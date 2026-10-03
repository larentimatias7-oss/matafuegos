const express = require('express');
const router = express.Router();
const { db, generatePublicId } = require('../db');
const { authenticate, requirePermiso, checkUserSectorScope } = require('../middleware/auth');
const { PERMISOS, ROLES } = require('../config/permissions');
const { validateExtinguisherInput } = require('../validators/dataValidators');
const { resolveSemaphoreStatus } = require('../services/semaphoreService');
const { recordAudit } = require('../services/auditService');

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

// GET all extinguishers with current month status and sector scoping
router.get('/', authenticate, requirePermiso(PERMISOS.INVENTARIO_VER), (req, res) => {
  try {
    const { search, type, floor, status, month } = req.query;
    const now = new Date();
    const currentMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const orgId = req.user?.organizacion_id || 1;

    let query = 'SELECT * FROM extinguishers WHERE organizacion_id = ?';
    const params = [orgId];

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

    // Sector scope filtering for scoped inspectors
    if (req.user && req.user.role === ROLES.INSPECTOR && req.user.scopeSectors && req.user.scopeSectors.length > 0) {
      const placeholders = req.user.scopeSectors.map(() => '?').join(',');
      query += ` AND (floor IN (${placeholders}) OR area IN (${placeholders}) OR location IN (${placeholders}))`;
      params.push(...req.user.scopeSectors, ...req.user.scopeSectors, ...req.user.scopeSectors);
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

// GET single extinguisher by id, code or public_id with scope verification
router.get('/:idOrCode', authenticate, requirePermiso(PERMISOS.INVENTARIO_VER), (req, res) => {
  try {
    const rawParam = req.params.idOrCode || '';
    let clean = decodeURIComponent(rawParam).trim();
    const orgId = req.user?.organizacion_id || 1;

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
    ext = db.prepare('SELECT * FROM extinguishers WHERE UPPER(code) = ? AND organizacion_id = ?').get(clean.toUpperCase(), orgId);

    // 4. Search by public_id (case-insensitive) e.g. bb03f46d028d
    if (!ext) {
      ext = db.prepare('SELECT * FROM extinguishers WHERE LOWER(public_id) = ? AND organizacion_id = ?').get(clean.toLowerCase(), orgId);
    }

    // 5. If purely digits, try numeric ID
    if (!ext && /^\d+$/.test(clean)) {
      ext = db.prepare('SELECT * FROM extinguishers WHERE id = ? AND organizacion_id = ?').get(Number(clean), orgId);
    }

    // 6. If purely digits, try standard padded MF code (e.g. 1 -> MF-001)
    if (!ext && /^\d+$/.test(clean)) {
      const padded = `MF-${clean.padStart(3, '0')}`;
      ext = db.prepare('SELECT * FROM extinguishers WHERE UPPER(code) = ? AND organizacion_id = ?').get(padded, orgId);
    }

    if (!ext) {
      return res.status(404).json({ success: false, error: 'Matafuego no encontrado' });
    }

    // Enforce user sector scope for scoped inspectors
    if (req.user && !checkUserSectorScope(req.user, ext)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado: este extintor se encuentra fuera de su sector asignado.'
      });
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyStatus = getMonthlyStatus(ext, currentMonth);

    // Get last inspections
    const inspections = db.prepare(`
      SELECT * FROM inspections 
      WHERE extinguisher_id = ? AND organizacion_id = ?
      ORDER BY id DESC LIMIT 15
    `).all(ext.id, orgId);

    // Get open cases
    const cases = db.prepare(`
      SELECT * FROM cases 
      WHERE extinguisher_id = ? AND organizacion_id = ?
      ORDER BY id DESC LIMIT 5
    `).all(ext.id, orgId);

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
router.post('/', authenticate, requirePermiso(PERMISOS.INVENTARIO_CREAR), (req, res) => {
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
      status = 'OPERATIVO', notes = ''
    } = req.body;

    const orgId = req.user?.organizacion_id || 1;
    const cleanCode = code.trim().toUpperCase();
    const publicId = generatePublicId();

    const insert = db.prepare(`
      INSERT INTO extinguishers (
        organizacion_id, code, public_id, type, capacity, location, area, floor, building,
        location_ref, manufacturer, fab_year, lifespan_limit, last_charge_date,
        expiration_charge, collar_year_color, last_ph_date, expiration_ph,
        supplier, certificate_number, status, notes
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    const result = insert.run(
      orgId,
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

    recordAudit(db, {
      usuario_id: req.user?.id || null,
      usuario_nombre_snapshot: req.user?.name || 'Sistema',
      organizacion_id: orgId,
      accion: 'CREAR_EXTINTOR',
      entidad: 'extintor',
      entidad_id: newId,
      datos_despues: { code: cleanCode, location, type, capacity, floor, area },
      req
    });

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
router.put('/:id', authenticate, requirePermiso(PERMISOS.INVENTARIO_EDITAR), (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizacion_id || 1;
    const oldExt = db.prepare('SELECT * FROM extinguishers WHERE id = ? AND organizacion_id = ?').get(id, orgId);

    if (!oldExt) {
      return res.status(404).json({ success: false, error: 'Matafuego no encontrado' });
    }

    if (req.user && !checkUserSectorScope(req.user, oldExt)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado: este extintor se encuentra fuera de su sector asignado.'
      });
    }

    const { 
      code, type, capacity, location, area, floor, building,
      location_ref, manufacturer, fab_year, lifespan_limit, collar_year_color,
      last_charge_date, expiration_charge, last_ph_date, expiration_ph,
      supplier, certificate_number, status, notes
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
      WHERE id = ? AND organizacion_id = ?
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
      id,
      orgId
    );

    recordAudit(db, {
      usuario_id: req.user?.id || null,
      usuario_nombre_snapshot: req.user?.name || 'Sistema',
      organizacion_id: orgId,
      accion: 'ACTUALIZAR_EXTINTOR',
      entidad: 'extintor',
      entidad_id: id,
      datos_antes: oldExt,
      datos_despues: req.body,
      req
    });

    res.json({ success: true, message: 'Ficha de extintor actualizada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE extinguisher
router.delete('/:id', authenticate, requirePermiso(PERMISOS.INVENTARIO_ELIMINAR), (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizacion_id || 1;
    const oldExt = db.prepare('SELECT * FROM extinguishers WHERE id = ? AND organizacion_id = ?').get(id, orgId);

    if (!oldExt) {
      return res.status(404).json({ success: false, error: 'Matafuego no encontrado' });
    }

    db.prepare('DELETE FROM extinguishers WHERE id = ? AND organizacion_id = ?').run(id, orgId);

    recordAudit(db, {
      usuario_id: req.user?.id || null,
      usuario_nombre_snapshot: req.user?.name || 'Sistema',
      organizacion_id: orgId,
      accion: 'ELIMINAR_EXTINTOR',
      entidad: 'extintor',
      entidad_id: id,
      datos_antes: oldExt,
      req
    });

    res.json({ success: true, message: 'Matafuego eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST reset to 130 sample extinguishers (Config manager only)
router.post('/reset-seed', authenticate, requirePermiso(PERMISOS.CONFIG_GESTIONAR), (req, res) => {
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
