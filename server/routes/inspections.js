const express = require('express');
const router = express.Router();
const { db } = require('../db');

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

// GET all inspections with filters
router.get('/', (req, res) => {
  try {
    const { month, code, limit, round_id } = req.query;
    let query = `
      SELECT i.*, e.location, e.type, e.capacity, e.floor, e.area, e.building
      FROM inspections i
      LEFT JOIN extinguishers e ON i.extinguisher_id = e.id
      WHERE 1=1
    `;
    const params = [];

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
router.get('/stats', (req, res) => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    // Dates for upcoming expirations (15, 30 and 60 days)
    const in15Days = new Date(now.getTime() + 15 * 86400000).toISOString().split('T')[0];
    const in30Days = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0];
    const in60Days = new Date(now.getTime() + 60 * 86400000).toISOString().split('T')[0];
    const in90Days = new Date(now.getTime() + 90 * 86400000).toISOString().split('T')[0];

    const totalExtinguishers = db.prepare("SELECT COUNT(*) as c FROM extinguishers WHERE status = 'OPERATIVO'").get().c;
    const allTotal = db.prepare("SELECT COUNT(*) as c FROM extinguishers").get().c;

    // Distinct extinguishers inspected this month
    const inspectedDistinct = db.prepare(`
      SELECT COUNT(DISTINCT extinguisher_id) as c 
      FROM inspections 
      WHERE year_month = ?
    `).get(currentMonth).c;

    // Passed vs Failed this month
    const failedThisMonth = db.prepare(`
      SELECT COUNT(DISTINCT extinguisher_id) as c 
      FROM inspections 
      WHERE year_month = ? AND passed = 0
    `).get(currentMonth).c;

    // Open cases count
    const openCasesCount = db.prepare("SELECT COUNT(*) as c FROM cases WHERE status != 'RESUELTO'").get().c;

    // Expired charges (already expired)
    const expiredCharges = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE expiration_charge < ? AND status = 'OPERATIVO'
    `).get(todayStr).c;

    // Expiring charges soon (granular alerts)
    const expiringCharge15 = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE expiration_charge >= ? AND expiration_charge <= ? AND status = 'OPERATIVO'
    `).get(todayStr, in15Days).c;

    const expiringCharge30 = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE expiration_charge >= ? AND expiration_charge <= ? AND status = 'OPERATIVO'
    `).get(todayStr, in30Days).c;

    const expiringCharge60 = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE expiration_charge >= ? AND expiration_charge <= ? AND status = 'OPERATIVO'
    `).get(todayStr, in60Days).c;

    // Expiring PH soon (between today and 90 days)
    const expiringPhSoon = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE expiration_ph >= ? AND expiration_ph <= ? AND status = 'OPERATIVO'
    `).get(todayStr, in90Days).c;

    const pendingThisMonth = Math.max(0, totalExtinguishers - inspectedDistinct);
    const coveragePercentage = totalExtinguishers > 0 
      ? Math.round((inspectedDistinct / totalExtinguishers) * 100) 
      : 0;

    // Active round
    const activeRound = db.prepare("SELECT * FROM rounds WHERE year_month = ?").get(currentMonth);

    // Recent activity
    const recentActivity = db.prepare(`
      SELECT i.*, e.location, e.type, e.capacity
      FROM inspections i
      LEFT JOIN extinguishers e ON i.extinguisher_id = e.id
      ORDER BY i.id DESC LIMIT 6
    `).all();

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
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST register new inspection with antifraud, case creation and next pending finder
router.post('/', async (req, res) => {
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

    // Determine if all checks passed
    const passed = (
      Number(check_location) === 1 &&
      Number(check_pressure) === 1 &&
      Number(check_seal) === 1 &&
      Number(check_physical) === 1 &&
      Number(check_signage) === 1 &&
      Number(check_card) === 1
    ) ? 1 : 0;

    const now = new Date();
    const inspection_date = now.toISOString().replace('T', ' ').substring(0, 19);
    const year_month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const inspector = (inspector_name || 'Inspector').trim();

    // Active Round
    let round = db.prepare("SELECT id FROM rounds WHERE year_month = ?").get(year_month);
    const round_id = round ? round.id : null;

    // --- ANTIFRAUD VERIFICATION ---
    const durSec = Math.max(0, Number(duration_seconds) || 0);
    let is_suspicious = 0;
    const fraudFlagsList = [];

    if (durSec > 0 && durSec < 5) {
      is_suspicious = 1;
      fraudFlagsList.push('TIEMPO_INSPECCION_MENOR_5S');
    }

    const fraud_flags = fraudFlagsList.join(';') || null;

    // Insert immutable inspection record
    const insert = db.prepare(`
      INSERT INTO inspections (
        extinguisher_id, extinguisher_code, inspector_name, inspection_date, year_month,
        passed, check_location, check_pressure, check_seal, check_physical, check_signage, check_card,
        observations, photo_url, synced_m365, round_id, is_reinspection, reinspection_reason,
        duration_seconds, is_suspicious, fraud_flags, latitude, longitude, geo_accuracy, checklist_results
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
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
          extinguisher_id, extinguisher_code, inspection_id, title, description, status, priority, photo_url
        ) VALUES (?, ?, ?, ?, ?, 'ABIERTO', 'ALTA', ?)
      `);
      const caseRes = insertCase.run(ext.id, ext.code, inspectionId, title, desc, photo_url);
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
