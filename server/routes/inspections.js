const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticate, requirePermiso, checkUserSectorScope } = require('../middleware/auth');
const { PERMISOS, ROLES } = require('../config/permissions');
const { evaluateInspectionFraud } = require('../services/antifraudService');
const { validateInspectionInRound } = require('../services/roundService');
const { getBuenosAiresDateString } = require('../services/expirationService');
const { recordAudit } = require('../services/auditService');

// Immutability: inspections cannot be modified or deleted by regulation IRAM 3517-2
router.use((req, res, next) => {
  if (['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: 'Las inspecciones de seguridad son inmutables por normativa IRAM 3517-2 y no pueden ser modificadas ni eliminadas.'
    });
  }
  next();
});

// Helper to notify M365 Power Automate Webhook if configured
async function notifyM365Webhook(payload) {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'm365_webhook_url'").get();
    const webhookUrl = row ? row.value : null;

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return false;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (err) {
    console.error('Error enviando datos al webhook de M365 Power Automate:', err.message);
    return false;
  }
}

// GET all inspections with filters, inspector filter, and antifraud
router.get('/', authenticate, requirePermiso(PERMISOS.INSPECCION_VER), (req, res) => {
  try {
    const { month, code, limit, round_id, inspector, usuario_id, suspicious } = req.query;
    const orgId = req.user?.organizacion_id || 1;

    let query = `
      SELECT i.*, e.location, e.type, e.capacity, e.floor, e.area, e.building
      FROM inspections i
      LEFT JOIN extinguishers e ON i.extinguisher_id = e.id
      WHERE i.organizacion_id = ?
    `;
    const params = [orgId];

    if (round_id) {
      query += ' AND i.round_id = ?';
      params.push(Number(round_id));
    }
    if (month) {
      query += ' AND i.year_month = ?';
      params.push(month);
    }
    if (code) {
      query += ' AND i.extinguisher_code = ?';
      params.push(code.toUpperCase());
    }
    if (usuario_id) {
      query += ' AND i.usuario_id = ?';
      params.push(usuario_id);
    }
    if (inspector) {
      query += ' AND (i.inspector_name_snapshot LIKE ? OR i.inspector_name LIKE ?)';
      params.push(`%${inspector}%`, `%${inspector}%`);
    }
    if (suspicious !== undefined && suspicious !== '') {
      query += ' AND i.is_suspicious = ?';
      params.push(Number(suspicious));
    }

    // Sector scope filtering for scoped inspectors
    if (req.user && req.user.role === ROLES.INSPECTOR && req.user.scopeSectors && req.user.scopeSectors.length > 0) {
      const placeholders = req.user.scopeSectors.map(() => '?').join(',');
      query += ` AND (e.floor IN (${placeholders}) OR e.area IN (${placeholders}) OR e.location IN (${placeholders}))`;
      params.push(...req.user.scopeSectors, ...req.user.scopeSectors, ...req.user.scopeSectors);
    }

    query += ' ORDER BY i.inspection_date DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(Number(limit));
    } else {
      query += ' LIMIT 300';
    }

    const rows = db.prepare(query).all(...params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET statistics for dashboard
router.get('/stats', authenticate, requirePermiso(PERMISOS.DASHBOARD_VER), (req, res) => {
  try {
    const orgId = req.user?.organizacion_id || 1;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    // Dates for upcoming expirations (15, 30 and 60 days)
    const in15Days = new Date(now.getTime() + 15 * 86400000).toISOString().split('T')[0];
    const in30Days = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0];
    const in60Days = new Date(now.getTime() + 60 * 86400000).toISOString().split('T')[0];
    const in90Days = new Date(now.getTime() + 90 * 86400000).toISOString().split('T')[0];

    // Sector scope filter if inspector is restricted
    let sectorFilter = '';
    const sectorParams = [];
    if (req.user && req.user.role === ROLES.INSPECTOR && req.user.scopeSectors && req.user.scopeSectors.length > 0) {
      const placeholders = req.user.scopeSectors.map(() => '?').join(',');
      sectorFilter = ` AND (floor IN (${placeholders}) OR area IN (${placeholders}) OR location IN (${placeholders}))`;
      sectorParams.push(...req.user.scopeSectors, ...req.user.scopeSectors, ...req.user.scopeSectors);
    }

    const totalExtinguishers = db.prepare(`SELECT COUNT(*) as c FROM extinguishers WHERE status = 'OPERATIVO' AND organizacion_id = ? ${sectorFilter}`).get(orgId, ...sectorParams).c;
    const allTotal = db.prepare(`SELECT COUNT(*) as c FROM extinguishers WHERE organizacion_id = ? ${sectorFilter}`).get(orgId, ...sectorParams).c;

    // Distinct extinguishers inspected this month
    const inspectedDistinct = db.prepare(`
      SELECT COUNT(DISTINCT i.extinguisher_id) as c 
      FROM inspections i
      JOIN extinguishers e ON i.extinguisher_id = e.id
      WHERE i.year_month = ? AND i.organizacion_id = ? ${sectorFilter}
    `).get(currentMonth, orgId, ...sectorParams).c;

    // Passed vs Failed this month
    const failedThisMonth = db.prepare(`
      SELECT COUNT(DISTINCT i.extinguisher_id) as c 
      FROM inspections i
      JOIN extinguishers e ON i.extinguisher_id = e.id
      WHERE i.year_month = ? AND i.passed = 0 AND i.organizacion_id = ? ${sectorFilter}
    `).get(currentMonth, orgId, ...sectorParams).c;

    // Open cases count
    const openCasesCount = db.prepare(`SELECT COUNT(*) as c FROM cases WHERE status != 'RESUELTO' AND organizacion_id = ?`).get(orgId).c;

    // Expired charges (already expired)
    const expiredCharges = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE expiration_charge < ? AND status = 'OPERATIVO' AND organizacion_id = ? ${sectorFilter}
    `).get(todayStr, orgId, ...sectorParams).c;

    // Expiring charges soon (granular alerts)
    const expiringCharge15 = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE expiration_charge >= ? AND expiration_charge <= ? AND status = 'OPERATIVO' AND organizacion_id = ? ${sectorFilter}
    `).get(todayStr, in15Days, orgId, ...sectorParams).c;

    const expiringCharge30 = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE expiration_charge >= ? AND expiration_charge <= ? AND status = 'OPERATIVO' AND organizacion_id = ? ${sectorFilter}
    `).get(todayStr, in30Days, orgId, ...sectorParams).c;

    const expiringCharge60 = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE expiration_charge >= ? AND expiration_charge <= ? AND status = 'OPERATIVO' AND organizacion_id = ? ${sectorFilter}
    `).get(todayStr, in60Days, orgId, ...sectorParams).c;

    // Expiring PH soon (between today and 90 days)
    const expiringPhSoon = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE expiration_ph >= ? AND expiration_ph <= ? AND status = 'OPERATIVO' AND organizacion_id = ? ${sectorFilter}
    `).get(todayStr, in90Days, orgId, ...sectorParams).c;

    const pendingThisMonth = Math.max(0, totalExtinguishers - inspectedDistinct);
    const coveragePercentage = totalExtinguishers > 0 
      ? Math.round((inspectedDistinct / totalExtinguishers) * 100) 
      : 0;

    // Active round
    const activeRound = db.prepare("SELECT * FROM rounds WHERE year_month = ? AND organizacion_id = ?").get(currentMonth, orgId);

    // Inspector activity breakdown for supervisory dashboard
    const inspectorBreakdown = db.prepare(`
      SELECT 
        COALESCE(i.inspector_name_snapshot, i.inspector_name) as inspector,
        i.usuario_id,
        COUNT(*) as total_inspections,
        SUM(CASE WHEN i.passed = 1 THEN 1 ELSE 0 END) as passed_count,
        SUM(CASE WHEN i.passed = 0 THEN 1 ELSE 0 END) as failed_count,
        SUM(i.is_suspicious) as suspicious_count
      FROM inspections i
      WHERE i.year_month = ? AND i.organizacion_id = ?
      GROUP BY COALESCE(i.inspector_name_snapshot, i.inspector_name), i.usuario_id
      ORDER BY total_inspections DESC
    `).all(currentMonth, orgId);

    // Recent activity
    const recentActivity = db.prepare(`
      SELECT i.*, e.location, e.type, e.capacity
      FROM inspections i
      LEFT JOIN extinguishers e ON i.extinguisher_id = e.id
      WHERE i.organizacion_id = ?
      ORDER BY i.id DESC LIMIT 6
    `).all(orgId);

    res.json({
      success: true,
      currentMonth,
      activeRound,
      metrics: {
        allTotal,
        totalOperative: totalExtinguishers,
        inspectedThisMonth: inspectedDistinct,
        pendingThisMonth,
        failedThisMonth,
        openCasesCount,
        coveragePercentage,
        expiredCharges,
        expiringCharge15,
        expiringCharge30,
        expiringCharge60,
        expiringPhSoon
      },
      inspectorBreakdown,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST register new inspection with antifraud, case creation and next pending finder
router.post('/', authenticate, requirePermiso(PERMISOS.INSPECCION_CREAR), async (req, res) => {
  try {
    const {
      extinguisher_id,
      extinguisher_code,
      inspector_name,
      check_location = 1,
      check_pressure = 1,
      check_seal = 1,
      check_physical = 1,
      check_signage = 1,
      check_card = 1,
      observations = '',
      photo_url = '',
      duration_seconds = 0,
      latitude = null,
      longitude = null,
      geo_accuracy = null,
      is_reinspection = 0,
      reinspection_reason = '',
      checklist_results = null
    } = req.body;

    let ext;
    if (extinguisher_id) {
      ext = db.prepare('SELECT * FROM extinguishers WHERE id = ?').get(extinguisher_id);
    } else if (extinguisher_code) {
      ext = db.prepare('SELECT * FROM extinguishers WHERE code = ?').get(extinguisher_code.toUpperCase());
    }

    if (!ext) {
      return res.status(404).json({ success: false, error: 'Matafuego no encontrado' });
    }

    // Verificación de alcance sectorial en servidor
    if (req.user && !checkUserSectorScope(req.user, ext)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado: este extintor se encuentra fuera de su sector operativo asignado.'
      });
    }

    const now = new Date();
    const todayBA = getBuenosAiresDateString(now);
    const year_month = todayBA.slice(0, 7);
    const inspection_date = now.toISOString().replace('T', ' ').substring(0, 19);
    const inspector = (inspector_name || (req.user ? req.user.name : 'Inspector')).trim();
    const usuarioId = req.user?.id || null;
    const orgId = req.user?.organizacion_id || 1;

    // Regla de una inspección por ronda o reinspección motivada
    const existingCount = db.prepare(`
      SELECT COUNT(*) as count FROM inspections 
      WHERE extinguisher_id = ? AND year_month = ?
    `).get(ext.id, year_month).count;

    const roundValidation = validateInspectionInRound(
      existingCount,
      Boolean(is_reinspection),
      reinspection_reason
    );

    if (!roundValidation.allowed) {
      return res.status(409).json({
        success: false,
        error: roundValidation.error
      });
    }

    // Determine if all checks passed
    const passed = (
      Number(check_location) === 1 &&
      Number(check_pressure) === 1 &&
      Number(check_seal) === 1 &&
      Number(check_physical) === 1 &&
      Number(check_signage) === 1 &&
      Number(check_card) === 1
    ) ? 1 : 0;

    // Active Round
    let round = db.prepare("SELECT id FROM rounds WHERE year_month = ?").get(year_month);
    const round_id = round ? round.id : null;

    // --- ANTIFRAUD VERIFICATION ---
    const durSec = Math.max(0, Number(duration_seconds) || 0);
    const fraudEval = evaluateInspectionFraud({ durationSeconds: durSec });
    const is_suspicious = fraudEval.isSuspicious ? 1 : 0;
    const fraud_flags = fraudEval.fraudFlags.join(';') || null;

    // Insert immutable inspection record with full traceability
    const insert = db.prepare(`
      INSERT INTO inspections (
        organizacion_id, usuario_id, inspector_name_snapshot,
        extinguisher_id, extinguisher_code, inspector_name, inspection_date, year_month,
        passed, check_location, check_pressure, check_seal, check_physical, check_signage, check_card,
        observations, photo_url, synced_m365, round_id, is_reinspection, reinspection_reason,
        duration_seconds, is_suspicious, fraud_flags, latitude, longitude, geo_accuracy, checklist_results
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      orgId,
      usuarioId,
      inspector,
      ext.id,
      ext.code,
      inspector,
      inspection_date,
      year_month,
      passed,
      Number(check_location),
      Number(check_pressure),
      Number(check_seal),
      Number(check_physical),
      Number(check_signage),
      Number(check_card),
      observations.trim(),
      photo_url,
      round_id,
      Number(is_reinspection),
      reinspection_reason || null,
      durSec,
      is_suspicious,
      fraud_flags,
      latitude,
      longitude,
      geo_accuracy,
      checklist_results ? JSON.stringify(checklist_results) : null
    );

    const inspectionId = result.lastInsertRowid;

    // Registrar en auditoría inmutable append-only
    recordAudit(db, {
      usuario_id: usuarioId,
      usuario_nombre_snapshot: inspector,
      organizacion_id: orgId,
      accion: 'REGISTRAR_INSPECCION',
      entidad: 'inspeccion',
      entidad_id: inspectionId,
      datos_despues: {
        extinguisher_code: ext.code,
        passed,
        is_suspicious,
        year_month
      },
      req
    });

    // --- CASE CREATION ON FAILURE ---
    let caseId = null;
    if (passed === 0) {
      const failDescriptions = [];
      if (!Number(check_location)) failDescriptions.push('Ubicación/acceso obstruido');
      if (!Number(check_pressure)) failDescriptions.push('Manómetro bajo / sin presión');
      if (!Number(check_seal)) failDescriptions.push('Precinto o perno dañado/violado');
      if (!Number(check_physical)) failDescriptions.push('Cilindro con daño físico o manguera rota');
      if (!Number(check_signage)) failDescriptions.push('Sin chapa baliza / señalización faltante');
      if (!Number(check_card)) failDescriptions.push('Marbete o tarjeta de control no vigente');
      if (observations.trim()) failDescriptions.push(`Nota: ${observations.trim()}`);

      const title = `Falla detectada en ${ext.code} (${ext.type})`;
      const desc = failDescriptions.join('. ');

      const insertCase = db.prepare(`
        INSERT INTO cases (
          organizacion_id, usuario_id, usuario_nombre_snapshot,
          extinguisher_id, extinguisher_code, inspection_id, title, description, status, priority, photo_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ABIERTO', 'ALTA', ?)
      `);
      const caseRes = insertCase.run(orgId, usuarioId, inspector, ext.id, ext.code, inspectionId, title, desc, photo_url);
      caseId = caseRes.lastInsertRowid;
    }

    // --- NEXT PENDING EXTIN噓UISHER ---
    // Finds the next pending extinguisher on the same floor/sector or nearest in the active round
    const nextPending = db.prepare(`
      SELECT code, location, floor, area
      FROM extinguishers
      WHERE status = 'OPERATIVO'
        AND id != ?
        AND id NOT IN (SELECT DISTINCT extinguisher_id FROM inspections WHERE year_month = ?)
      ORDER BY 
        CASE WHEN floor = ? THEN 0 ELSE 1 END,
        code ASC
      LIMIT 1
    `).get(ext.id, year_month, ext.floor);

    // M365 Webhook trigger
    const m365Payload = {
      event: 'INSPECTION_COMPLETED',
      id: inspectionId,
      extinguisher_code: ext.code,
      location: ext.location,
      area: ext.area,
      floor: ext.floor,
      type: ext.type,
      capacity: ext.capacity,
      inspector: inspector,
      date: inspection_date,
      month: year_month,
      result: passed === 1 ? 'APROBADO' : 'CON ANOMALÍAS',
      duration_seconds: durSec,
      is_suspicious: is_suspicious === 1,
      observations: observations.trim() || 'Sin observaciones'
    };

    notifyM365Webhook(m365Payload).then(synced => {
      if (synced) {
        db.prepare("UPDATE inspections SET synced_m365 = 1 WHERE id = ?").run(inspectionId);
      }
    });

    res.status(201).json({
      success: true,
      message: passed === 1 ? 'Control mensual registrado con éxito' : 'Control registrado con anomalías. Se abrió un caso de seguimiento.',
      passed: passed === 1,
      inspectionId,
      caseId,
      nextPendingCode: nextPending ? nextPending.code : null,
      nextPendingLocation: nextPending ? nextPending.location : null
    });
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
