const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticate, requirePermiso } = require('../middleware/auth');
const { PERMISOS, ROLES } = require('../config/permissions');
const { recordAudit } = require('../services/auditService');

// Helper to get or create active round
function getOrCreateActiveRound(orgId = 1) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let round = db.prepare("SELECT * FROM rounds WHERE year_month = ? AND organizacion_id = ?").get(currentMonth, orgId);

  if (!round) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const name = `Ronda ${months[now.getMonth()]} ${now.getFullYear()}`;
    const insert = db.prepare("INSERT INTO rounds (organizacion_id, name, year_month, status) VALUES (?, ?, ?, 'ABIERTA')");
    const result = insert.run(orgId, name, currentMonth);
    round = db.prepare("SELECT * FROM rounds WHERE id = ?").get(result.lastInsertRowid);
  }
  return round;
}

// GET active round with stats and "Mi Ruta"
router.get('/active', authenticate, requirePermiso(PERMISOS.RONDA_VER), (req, res) => {
  try {
    const orgId = req.user?.organizacion_id || 1;
    const round = getOrCreateActiveRound(orgId);

    // Build sector scope filter if inspector has restricted scope
    let sectorFilter = '';
    const sectorParams = [];
    if (req.user && req.user.role === ROLES.INSPECTOR && req.user.scopeSectors && req.user.scopeSectors.length > 0) {
      const placeholders = req.user.scopeSectors.map(() => '?').join(',');
      sectorFilter = ` AND (floor IN (${placeholders}) OR area IN (${placeholders}) OR location IN (${placeholders}))`;
      sectorParams.push(...req.user.scopeSectors, ...req.user.scopeSectors, ...req.user.scopeSectors);
    }

    // Total operative extinguishers within scope
    const totalExts = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE status = 'OPERATIVO' AND organizacion_id = ? ${sectorFilter}
    `).get(orgId, ...sectorParams).c;

    // Extinguishers inspected in this round within scope
    const inspectedExts = db.prepare(`
      SELECT DISTINCT i.extinguisher_id 
      FROM inspections i
      JOIN extinguishers e ON i.extinguisher_id = e.id
      WHERE i.year_month = ? AND i.organizacion_id = ? ${sectorFilter}
    `).all(round.year_month, orgId, ...sectorParams).map(r => r.extinguisher_id);

    const inspectedCount = inspectedExts.length;
    const pendingCount = Math.max(0, totalExts - inspectedCount);
    const progressPercent = totalExts > 0 ? Math.round((inspectedCount / totalExts) * 100) : 0;

    // Pendings by floor within scope
    const pendingByFloor = db.prepare(`
      SELECT floor, COUNT(*) as pending_count
      FROM extinguishers
      WHERE status = 'OPERATIVO' 
        AND organizacion_id = ?
        ${sectorFilter}
        AND id NOT IN (SELECT DISTINCT extinguisher_id FROM inspections WHERE year_month = ? AND organizacion_id = ?)
      GROUP BY floor
      ORDER BY floor ASC
    `).all(orgId, ...sectorParams, round.year_month, orgId);

    // "Mi Ruta" - Sorted list of pending extinguishers for seamless field navigation
    const pendingRoute = db.prepare(`
      SELECT id, code, public_id, type, capacity, location, floor, area, building, expiration_charge, status
      FROM extinguishers
      WHERE status = 'OPERATIVO'
        AND organizacion_id = ?
        ${sectorFilter}
        AND id NOT IN (SELECT DISTINCT extinguisher_id FROM inspections WHERE year_month = ? AND organizacion_id = ?)
      ORDER BY 
        CASE 
          WHEN floor LIKE '%Subsuelo 2%' THEN 1
          WHEN floor LIKE '%Subsuelo%' THEN 2
          WHEN floor LIKE '%Planta Baja%' THEN 3
          WHEN floor LIKE '%Piso 1%' THEN 4
          WHEN floor LIKE '%Piso 2%' THEN 5
          WHEN floor LIKE '%Piso 3%' THEN 6
          WHEN floor LIKE '%Piso 4%' THEN 7
          WHEN floor LIKE '%Piso 5%' THEN 8
          ELSE 9
        END,
        area ASC,
        code ASC
    `).all(orgId, ...sectorParams, round.year_month, orgId);

    res.json({
      success: true,
      round,
      metrics: {
        total: totalExts,
        inspected: inspectedCount,
        pending: pendingCount,
        progressPercent
      },
      pendingByFloor,
      route: pendingRoute
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET all rounds
router.get('/', authenticate, requirePermiso(PERMISOS.RONDA_VER), (req, res) => {
  try {
    const orgId = req.user?.organizacion_id || 1;
    const rounds = db.prepare("SELECT * FROM rounds WHERE organizacion_id = ? ORDER BY year_month DESC").all(orgId);
    res.json({ success: true, rounds });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST close round
router.post('/:id/close', authenticate, requirePermiso(PERMISOS.RONDA_ABRIR_CERRAR), (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizacion_id || 1;
    const oldRound = db.prepare('SELECT * FROM rounds WHERE id = ? AND organizacion_id = ?').get(id, orgId);

    if (!oldRound) {
      return res.status(404).json({ success: false, error: 'Ronda no encontrada' });
    }

    db.prepare(`
      UPDATE rounds SET status = 'CERRADA', closed_at = datetime('now', 'localtime')
      WHERE id = ? AND organizacion_id = ?
    `).run(id, orgId);

    recordAudit(db, {
      usuario_id: req.user?.id || null,
      usuario_nombre_snapshot: req.user?.name || 'Sistema',
      organizacion_id: orgId,
      accion: 'CERRAR_RONDA',
      entidad: 'ronda',
      entidad_id: id,
      datos_antes: oldRound,
      datos_despues: { status: 'CERRADA' },
      req
    });

    res.json({ success: true, message: 'Ronda cerrada con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST reopen round (Supervisor or Admin)
router.post('/:id/reopen', authenticate, requirePermiso(PERMISOS.RONDA_REABRIR), (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizacion_id || 1;
    const oldRound = db.prepare('SELECT * FROM rounds WHERE id = ? AND organizacion_id = ?').get(id, orgId);

    if (!oldRound) {
      return res.status(404).json({ success: false, error: 'Ronda no encontrada' });
    }

    db.prepare(`
      UPDATE rounds SET status = 'ABIERTA', closed_at = NULL
      WHERE id = ? AND organizacion_id = ?
    `).run(id, orgId);

    recordAudit(db, {
      usuario_id: req.user?.id || null,
      usuario_nombre_snapshot: req.user?.name || 'Sistema',
      organizacion_id: orgId,
      accion: 'REABRIR_RONDA',
      entidad: 'ronda',
      entidad_id: id,
      datos_antes: oldRound,
      datos_despues: { status: 'ABIERTA' },
      req
    });

    res.json({ success: true, message: 'Ronda reabierta con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
