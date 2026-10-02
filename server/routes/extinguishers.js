const express = require('express');
const router = express.Router();
const { db, generatePublicId } = require('../db');

// Helper to determine monthly inspection status
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
      badgeColor: 'expired',
      label: 'Carga Anual Vencida',
      inspectedThisMonth: !!lastInspectionThisMonth,
      passed: lastInspectionThisMonth ? Boolean(lastInspectionThisMonth.passed) : null
    };
  }

  if (!lastInspectionThisMonth) {
    return {
      statusKey: 'PENDING',
      badgeColor: 'pending',
      label: 'Pendiente Mes',
      inspectedThisMonth: false,
      passed: null
    };
  }

  if (lastInspectionThisMonth.passed === 1) {
    return {
      statusKey: 'OK',
      badgeColor: 'ok',
      label: 'Controlado OK',
      inspectedThisMonth: true,
      passed: true,
      date: lastInspectionThisMonth.inspection_date
    };
  } else {
    return {
      statusKey: 'FAULT',
      badgeColor: 'fault',
      label: 'Con Anomalías',
      inspectedThisMonth: true,
      passed: false,
      date: lastInspectionThisMonth.inspection_date,
      observations: lastInspectionThisMonth.observations
    };
  }
}

// Helper to log changes to audit_logs
function logAudit(entityType, entityId, action, changedBy, oldValues, newValues) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (entity_type, entity_id, action, changed_by, old_values, new_values)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      entityType,
      entityId,
      action,
      changedBy || 'Sistema',
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
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
      query += ' AND (code LIKE ? OR location LIKE ? OR area LIKE ? OR building LIKE ? OR notes LIKE ? OR manufacturer LIKE ? OR public_id = ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term, search.trim().toLowerCase());
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

// GET single extinguisher by id, code or public_id
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
      ext = db.prepare('SELECT * FROM extinguishers WHERE public_id = ?').get(idOrCode.toLowerCase());
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
      ORDER BY id DESC LIMIT 15
    `).all(ext.id);

    // Get open cases
    const cases = db.prepare(`
      SELECT * FROM cases 
      WHERE extinguisher_id = ? 
      ORDER BY id DESC LIMIT 5
    `).all(ext.id);

    // Get audit history
    const auditHistory = db.prepare(`
      SELECT * FROM audit_logs
      WHERE entity_type = 'EXTINGUISHER' AND entity_id = ?
      ORDER BY id DESC LIMIT 10
    `).all(ext.id);

    res.json({
      success: true,
      data: {
        ...ext,
        monthlyStatus,
        inspections,
        cases,
        auditHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create new extinguisher
router.post('/', (req, res) => {
  try {
    const { 
      code, type, capacity, location, area, floor, building = 'Edificio Central',
      location_ref = '', manufacturer = '', fab_year = null, lifespan_limit = '',
      collar_year_color = '', last_charge_date = '', expiration_charge,
      last_ph_date = '', expiration_ph, supplier = '', certificate_number = '',
      status = 'OPERATIVO', notes = '', changed_by = 'Admin'
    } = req.body;

    if (!code || !type || !capacity || !location || !expiration_charge || !expiration_ph) {
      return res.status(400).json({ success: false, error: 'Campos obligatorios incompletos' });
    }

    const cleanCode = code.trim().toUpperCase();
    const publicId = generatePublicId();

    const insert = db.prepare(`
      INSERT INTO extinguishers (
        code, public_id, type, capacity, location, area, floor, building,
        location_ref, manufacturer, fab_year, lifespan_limit, last_charge_date,
        expiration_charge, collar_year_color, last_ph_date, expiration_ph,
        supplier, certificate_number, status, notes
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    const result = insert.run(
      cleanCode,
      publicId,
      type,
      capacity,
      location,
      area || '',
      floor || '',
      building,
      location_ref,
      manufacturer,
      fab_year ? Number(fab_year) : null,
      lifespan_limit,
      last_charge_date,
      expiration_charge,
      collar_year_color,
      last_ph_date,
      expiration_ph,
      supplier,
      certificate_number,
      status,
      notes
    );

    const newId = result.lastInsertRowid;
    logAudit('EXTINGUISHER', newId, 'CREATE', changed_by, null, { code: cleanCode, location, type, capacity });

    res.status(201).json({
      success: true,
      message: 'Matafuego creado con éxito',
      id: newId,
      code: cleanCode,
      public_id: publicId
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, error: 'Ya existe un matafuego con ese código' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update extinguisher with full audit logging
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const oldExt = db.prepare('SELECT * FROM extinguishers WHERE id = ?').get(id);

    if (!oldExt) {
      return res.status(404).json({ success: false, error: 'Matafuego no encontrado' });
    }

    const { 
      code, type, capacity, location, area, floor, building,
      location_ref, manufacturer, fab_year, lifespan_limit, collar_year_color,
      last_charge_date, expiration_charge, last_ph_date, expiration_ph,
      supplier, certificate_number, status, notes, changed_by = 'Operario / Admin'
    } = req.body;

    const update = db.prepare(`
      UPDATE extinguishers SET
        code = COALESCE(?, code),
        type = COALESCE(?, type),
        capacity = COALESCE(?, capacity),
        location = COALESCE(?, location),
        area = COALESCE(?, area),
        floor = COALESCE(?, floor),
        building = COALESCE(?, building),
        location_ref = COALESCE(?, location_ref),
        manufacturer = COALESCE(?, manufacturer),
        fab_year = COALESCE(?, fab_year),
        lifespan_limit = COALESCE(?, lifespan_limit),
        collar_year_color = COALESCE(?, collar_year_color),
        last_charge_date = COALESCE(?, last_charge_date),
        expiration_charge = COALESCE(?, expiration_charge),
        last_ph_date = COALESCE(?, last_ph_date),
        expiration_ph = COALESCE(?, expiration_ph),
        supplier = COALESCE(?, supplier),
        certificate_number = COALESCE(?, certificate_number),
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
      building,
      location_ref,
      manufacturer,
      fab_year ? Number(fab_year) : null,
      lifespan_limit,
      collar_year_color,
      last_charge_date,
      expiration_charge,
      last_ph_date,
      expiration_ph,
      supplier,
      certificate_number,
      status,
      notes,
      id
    );

    // Audit log
    const changes = {};
    if (location && location !== oldExt.location) changes.location = { from: oldExt.location, to: location };
    if (status && status !== oldExt.status) changes.status = { from: oldExt.status, to: status };
    if (expiration_charge && expiration_charge !== oldExt.expiration_charge) changes.expiration_charge = { from: oldExt.expiration_charge, to: expiration_charge };

    logAudit('EXTINGUISHER', id, 'UPDATE', changed_by, oldExt, req.body);

    res.json({ success: true, message: 'Ficha de extintor actualizada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE extinguisher
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const oldExt = db.prepare('SELECT * FROM extinguishers WHERE id = ?').get(id);
    db.prepare('DELETE FROM extinguishers WHERE id = ?').run(id);
    logAudit('EXTINGUISHER', id, 'DELETE', 'Admin', oldExt, null);
    res.json({ success: true, message: 'Matafuego eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST reset to 130 sample extinguishers
router.post('/reset-seed', (req, res) => {
  try {
    db.exec('DELETE FROM cases');
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
