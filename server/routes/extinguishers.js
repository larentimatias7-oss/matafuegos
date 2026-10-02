const express = require('express');
const router = express.Router();
const { db, generatePublicId } = require('../db');
const { authenticate, requireRole, ROLES } = require('../middleware/auth');
const { validateExtinguisherInput } = require('../validators/dataValidators');
const { resolveSemaphoreStatus } = require('../services/semaphoreService');

// Helper to determine monthly inspection status using unified semaphore service
function getMonthlyStatus(extinguisher, currentMonth) {
  const stmt = db.prepare(`
    SELECT * FROM inspections 
    WHERE extinguisher_id = ? AND year_month = ?
    ORDER BY id DESC LIMIT 1
  `);
  const lastInspectionThisMonth = stmt.get(extinguisher.id, currentMonth);

  const res = resolveSemaphoreStatus(extinguisher, lastInspectionThisMonth);
  return {
    statusKey: res.statusKey,
    badgeColor: res.badgeColor,
    label: res.label,
    inspectedThisMonth: !!lastInspectionThisMonth,
    passed: lastInspectionThisMonth ? Boolean(lastInspectionThisMonth.passed) : null,
    date: lastInspectionThisMonth ? lastInspectionThisMonth.inspection_date : null,
    observations: lastInspectionThisMonth ? lastInspectionThisMonth.observations : null,
    reasons: res.reasons
  };
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
router.get('/', authenticate, (req, res) => {
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
router.get('/:idOrCode', authenticate, (req, res) => {
  try {
    const rawParam = req.params.idOrCode || '';
    let clean = decodeURIComponent(rawParam).trim();

    // 1. If a full or relative URL is passed, extract /m/:publicId
    if (clean.includes('/m/')) {
      const mMatch = clean.match(/\/m\/([a-zA-Z0-9_-]+)/i);
      if (mMatch) clean = mMatch[1];
    } else if (clean.includes('code=')) {
      const codeMatch = clean.match(/code=([A-Za-z0-9_-]+)/i);
      if (codeMatch) clean = codeMatch[1];
    }

    // 2. Strip any query parameters, hash fragments, or trailing slashes
    clean = clean.split('#')[0].split('?')[0].replace(/\/+$/, '').trim();

    let ext;

    // 3. Search by exact code (case-insensitive) e.g. MF-001
    ext = db.prepare('SELECT * FROM extinguishers WHERE UPPER(code) = ?').get(clean.toUpperCase());

    // 4. Search by public_id (case-insensitive) e.g. bb03f46d028d
    if (!ext) {
      ext = db.prepare('SELECT * FROM extinguishers WHERE LOWER(public_id) = ?').get(clean.toLowerCase());
    }

    // 5. If purely digits, try numeric ID
    if (!ext && /^\d+$/.test(clean)) {
      ext = db.prepare('SELECT * FROM extinguishers WHERE id = ?').get(Number(clean));
    }

    // 6. If purely digits, try standard padded MF code (e.g. 1 -> MF-001)
    if (!ext && /^\d+$/.test(clean)) {
      const padded = `MF-${clean.padStart(3, '0')}`;
      ext = db.prepare('SELECT * FROM extinguishers WHERE UPPER(code) = ?').get(padded);
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
router.post('/', authenticate, requireRole([ROLES.ADMIN, ROLES.INSPECTOR]), (req, res) => {
  try {
    const validation = validateExtinguisherInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Errores de validación en los datos del extintor',
        details: validation.errors
      });
    }

    const { 
      code, type, capacity, location, area, floor, building = 'Edificio Central',
      location_ref = '', manufacturer = '', fab_year = null, lifespan_limit = '',
      collar_year_color = '', last_charge_date = '', expiration_charge,
      last_ph_date = '', expiration_ph, supplier = '', certificate_number = '',
      status = 'OPERATIVO', notes = '', changed_by = (req.user ? req.user.name : 'Admin')
    } = req.body;

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
router.put('/:id', authenticate, requireRole([ROLES.ADMIN, ROLES.INSPECTOR]), (req, res) => {
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
      supplier, certificate_number, status, notes, changed_by = (req.user ? req.user.name : 'Operario / Admin')
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
      type ?? null,
      capacity ?? null,
      location ?? null,
      area ?? null,
      floor ?? null,
      building ?? null,
      location_ref ?? null,
      manufacturer ?? null,
      fab_year !== undefined && fab_year !== null ? Number(fab_year) : null,
      lifespan_limit ?? null,
      collar_year_color ?? null,
      last_charge_date ?? null,
      expiration_charge ?? null,
      last_ph_date ?? null,
      expiration_ph ?? null,
      supplier ?? null,
      certificate_number ?? null,
      status ?? null,
      notes ?? null,
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

// DELETE extinguisher (Admin only)
router.delete('/:id', authenticate, requireRole([ROLES.ADMIN]), (req, res) => {
  try {
    const { id } = req.params;
    const oldExt = db.prepare('SELECT * FROM extinguishers WHERE id = ?').get(id);

    if (!oldExt) {
      return res.status(404).json({ success: false, error: 'Matafuego no encontrado' });
    }

    db.prepare('DELETE FROM extinguishers WHERE id = ?').run(id);
    logAudit('EXTINGUISHER', id, 'DELETE', (req.user ? req.user.name : 'Admin'), oldExt, null);
    res.json({ success: true, message: 'Matafuego eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST reset to 130 sample extinguishers (Admin only)
router.post('/reset-seed', authenticate, requireRole([ROLES.ADMIN]), (req, res) => {
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
