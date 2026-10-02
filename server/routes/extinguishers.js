const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Helper to determine monthly inspection status
// Verde: inspeccionado este mes y aprobado
// Amarillo: pendiente de inspección este mes
// Rojo: inspeccionado este mes con falla O carga anual vencida
function getMonthlyStatus(extinguisher, currentMonth) {
  const isChargeExpired = extinguisher.expiration_charge < new Date().toISOString().split('T')[0];

  const stmt = db.prepare(`
    SELECT * FROM inspections 
    WHERE extinguisher_id = ? AND year_month = ?
    ORDER BY id DESC LIMIT 1
  `);
  const lastInspectionThisMonth = stmt.get(extinguisher.id, currentMonth);

  if (isChargeExpired) {
    return {
      statusKey: 'EXPIRED',
      badgeColor: 'red',
      label: 'Carga Anual Vencida',
      inspectedThisMonth: !!lastInspectionThisMonth,
      passed: lastInspectionThisMonth ? Boolean(lastInspectionThisMonth.passed) : null
    };
  }

  if (!lastInspectionThisMonth) {
    return {
      statusKey: 'PENDING',
      badgeColor: 'yellow',
      label: 'Pendiente Mes Actual',
      inspectedThisMonth: false,
      passed: null
    };
  }

  if (lastInspectionThisMonth.passed === 1) {
    return {
      statusKey: 'OK',
      badgeColor: 'green',
      label: 'Controlado OK',
      inspectedThisMonth: true,
      passed: true,
      date: lastInspectionThisMonth.inspection_date
    };
  } else {
    return {
      statusKey: 'FAULT',
      badgeColor: 'red',
      label: 'Con Anomalías',
      inspectedThisMonth: true,
      passed: false,
      date: lastInspectionThisMonth.inspection_date,
      observations: lastInspectionThisMonth.observations
    };
  }
}

// GET all extinguishers with current month status
router.get('/', (req, res) => {
  try {
    const { search, type, floor, status, month } = req.query;
    const now = new Date();
    const currentMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let query = 'SELECT * FROM extinguishers WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (floor) {
      query += ' AND floor = ?';
      params.push(floor);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (code LIKE ? OR location LIKE ? OR area LIKE ? OR notes LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY code ASC';

    const extinguishers = db.prepare(query).all(...params);

    // Attach monthly status to each
    const enriched = extinguishers.map(ext => {
      const monthlyStatus = getMonthlyStatus(ext, currentMonth);
      return {
        ...ext,
        monthlyStatus
      };
    });

    res.json({
      success: true,
      month: currentMonth,
      total: enriched.length,
      data: enriched
    });
  } catch (error) {
    console.error('Error fetching extinguishers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single extinguisher by id or code
router.get('/:idOrCode', (req, res) => {
  try {
    const { idOrCode } = req.params;
    let ext;

    if (!isNaN(idOrCode)) {
      ext = db.prepare('SELECT * FROM extinguishers WHERE id = ?').get(Number(idOrCode));
    }
    if (!ext) {
      ext = db.prepare('SELECT * FROM extinguishers WHERE code = ?').get(idOrCode.toUpperCase());
    }

    if (!ext) {
      return res.status(404).json({ success: false, error: 'Matafuego no encontrado' });
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyStatus = getMonthlyStatus(ext, currentMonth);

    // Get last inspections
    const inspections = db.prepare(`
      SELECT * FROM inspections 
      WHERE extinguisher_id = ? 
      ORDER BY id DESC LIMIT 10
    `).all(ext.id);

    res.json({
      success: true,
      data: {
        ...ext,
        monthlyStatus,
        inspections
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create new extinguisher
router.post('/', (req, res) => {
  try {
    const { code, type, capacity, location, area, floor, expiration_charge, expiration_ph, status, notes } = req.body;

    if (!code || !type || !capacity || !location || !expiration_charge || !expiration_ph) {
      return res.status(400).json({ success: false, error: 'Campos obligatorios incompletos' });
    }

    const cleanCode = code.trim().toUpperCase();

    const insert = db.prepare(`
      INSERT INTO extinguishers (code, type, capacity, location, area, floor, expiration_charge, expiration_ph, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      cleanCode,
      type,
      capacity,
      location,
      area || '',
      floor || '',
      expiration_charge,
      expiration_ph,
      status || 'OPERATIVO',
      notes || ''
    );

    res.status(201).json({
      success: true,
      message: 'Matafuego creado con éxito',
      id: result.lastInsertRowid,
      code: cleanCode
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, error: 'Ya existe un matafuego con ese código' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update extinguisher
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { code, type, capacity, location, area, floor, expiration_charge, expiration_ph, status, notes } = req.body;

    const update = db.prepare(`
      UPDATE extinguishers SET
        code = COALESCE(?, code),
        type = COALESCE(?, type),
        capacity = COALESCE(?, capacity),
        location = COALESCE(?, location),
        area = COALESCE(?, area),
        floor = COALESCE(?, floor),
        expiration_charge = COALESCE(?, expiration_charge),
        expiration_ph = COALESCE(?, expiration_ph),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    update.run(
      code ? code.trim().toUpperCase() : null,
      type,
      capacity,
      location,
      area,
      floor,
      expiration_charge,
      expiration_ph,
      status,
      notes,
      id
    );

    res.json({ success: true, message: 'Matafuego actualizado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE extinguisher
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM extinguishers WHERE id = ?').run(id);
    db.prepare('DELETE FROM inspections WHERE extinguisher_id = ?').run(id);
    res.json({ success: true, message: 'Matafuego eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST reset to 130 sample extinguishers
router.post('/reset-seed', (req, res) => {
  try {
    db.exec('DELETE FROM inspections');
    db.exec('DELETE FROM extinguishers');
    const { seed130Extinguishers } = require('../db');
    seed130Extinguishers();
    res.json({ success: true, message: 'Base de datos reiniciada con 130 matafuegos de prueba' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
