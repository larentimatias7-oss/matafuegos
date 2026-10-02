const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Helper to get or create active round
function getOrCreateActiveRound() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let round = db.prepare("SELECT * FROM rounds WHERE year_month = ?").get(currentMonth);

  if (!round) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const name = `Ronda ${months[now.getMonth()]} ${now.getFullYear()}`;
    const insert = db.prepare("INSERT INTO rounds (name, year_month, status) VALUES (?, ?, 'ABIERTA')");
    const result = insert.run(name, currentMonth);
    round = db.prepare("SELECT * FROM rounds WHERE id = ?").get(result.lastInsertRowid);
  }
  return round;
}

// GET active round with stats and "Mi Ruta"
router.get('/active', (req, res) => {
  try {
    const round = getOrCreateActiveRound();

    // Total operative extinguishers
    const totalExts = db.prepare("SELECT COUNT(*) as c FROM extinguishers WHERE status = 'OPERATIVO'").get().c;

    // Extinguishers inspected in this round
    const inspectedExts = db.prepare(`
      SELECT DISTINCT extinguisher_id 
      FROM inspections 
      WHERE year_month = ?
    `).all(round.year_month).map(r => r.extinguisher_id);

    const inspectedCount = inspectedExts.length;
    const pendingCount = Math.max(0, totalExts - inspectedCount);
    const progressPercent = totalExts > 0 ? Math.round((inspectedCount / totalExts) * 100) : 0;

    // Pendings by floor
    const pendingByFloor = db.prepare(`
      SELECT floor, COUNT(*) as pending_count
      FROM extinguishers
      WHERE status = 'OPERATIVO' 
        AND id NOT IN (SELECT DISTINCT extinguisher_id FROM inspections WHERE year_month = ?)
      GROUP BY floor
      ORDER BY floor ASC
    `).all(round.year_month);

    // "Mi Ruta" - Sorted list of pending extinguishers for seamless field navigation
    const pendingRoute = db.prepare(`
      SELECT id, code, public_id, type, capacity, location, floor, area, building, expiration_charge, status
      FROM extinguishers
      WHERE status = 'OPERATIVO'
        AND id NOT IN (SELECT DISTINCT extinguisher_id FROM inspections WHERE year_month = ?)
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
    `).all(round.year_month);

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
router.get('/', (req, res) => {
  try {
    const rounds = db.prepare("SELECT * FROM rounds ORDER BY year_month DESC").all();
    res.json({ success: true, rounds });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST close round
router.post('/:id/close', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare(`
      UPDATE rounds SET status = 'CERRADA', closed_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(id);

    res.json({ success: true, message: 'Ronda cerrada con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
