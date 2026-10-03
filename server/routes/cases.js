const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticate, requirePermiso } = require('../middleware/auth');
const { PERMISOS, ROLES } = require('../config/permissions');
const { validateCaseTransition } = require('../services/anomalyService');
const { recordAudit } = require('../services/auditService');

// GET all cases with days open calculation and scope filtering
router.get('/', authenticate, requirePermiso(PERMISOS.CASO_VER), (req, res) => {
  try {
    const { status } = req.query;
    const orgId = req.user?.organizacion_id || 1;

    let query = `
      SELECT c.*, e.location, e.type, e.capacity, e.floor, e.area,
        CAST((julianday('now', 'localtime') - julianday(c.opened_at)) AS INTEGER) as days_open
      FROM cases c
      LEFT JOIN extinguishers e ON c.extinguisher_id = e.id
      WHERE c.organizacion_id = ?
    `;
    const params = [orgId];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    // Sector scope filtering for scoped inspectors
    if (req.user && req.user.role === ROLES.INSPECTOR && req.user.scopeSectors && req.user.scopeSectors.length > 0) {
      const placeholders = req.user.scopeSectors.map(() => '?').join(',');
      query += ` AND (e.floor IN (${placeholders}) OR e.area IN (${placeholders}) OR e.location IN (${placeholders}))`;
      params.push(...req.user.scopeSectors, ...req.user.scopeSectors, ...req.user.scopeSectors);
    }

    query += ' ORDER BY c.status ASC, c.opened_at DESC';

    const cases = db.prepare(query).all(...params);
    res.json({ success: true, count: cases.length, cases });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update case status / replacement
router.put('/:id', authenticate, requirePermiso(PERMISOS.CASO_EDITAR), (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizacion_id || 1;
    const existingCase = db.prepare('SELECT * FROM cases WHERE id = ? AND organizacion_id = ?').get(id, orgId);

    if (!existingCase) {
      return res.status(404).json({ success: false, error: 'Caso no encontrado' });
    }

    const { status, resolution_notes, assigned_to, temp_replacement_code, priority } = req.body;

    if (status) {
      const transitionValidation = validateCaseTransition(existingCase.status, status, {
        resolution_notes,
        temp_replacement_code
      });

      if (!transitionValidation.valid) {
        return res.status(400).json({
          success: false,
          error: transitionValidation.error
        });
      }
    }

    const isClosing = status === 'RESUELTO';
    const usuarioId = req.user?.id || null;
    const usuarioNombre = req.user?.name || 'Usuario';

    const update = db.prepare(`
      UPDATE cases SET
        status = COALESCE(?, status),
        resolution_notes = COALESCE(?, resolution_notes),
        assigned_to = COALESCE(?, assigned_to),
        temp_replacement_code = COALESCE(?, temp_replacement_code),
        priority = COALESCE(?, priority),
        usuario_id = COALESCE(?, usuario_id),
        usuario_nombre_snapshot = COALESCE(?, usuario_nombre_snapshot),
        closed_at = ${isClosing ? "datetime('now', 'localtime')" : "closed_at"}
      WHERE id = ? AND organizacion_id = ?
    `);

    update.run(
      status ?? null,
      resolution_notes ?? null,
      assigned_to ?? null,
      temp_replacement_code ?? null,
      priority ?? null,
      usuarioId,
      usuarioNombre,
      id,
      orgId
    );

    // If replacement was registered, update extinguisher notes
    if (temp_replacement_code) {
      const caseRow = db.prepare("SELECT extinguisher_id FROM cases WHERE id = ?").get(id);
      if (caseRow) {
        db.prepare(`
          UPDATE extinguishers 
          SET notes = notes || ' [Reemplazado temporalmente por ' || ? || ']'
          WHERE id = ? AND organizacion_id = ?
        `).run(temp_replacement_code, caseRow.extinguisher_id, orgId);
      }
    }

    // Append-only audit record
    recordAudit(db, {
      usuario_id: usuarioId,
      usuario_nombre_snapshot: usuarioNombre,
      organizacion_id: orgId,
      accion: isClosing ? 'RESOLVER_CASO' : 'ACTUALIZAR_CASO',
      entidad: 'caso',
      entidad_id: id,
      datos_antes: existingCase,
      datos_despues: { status, resolution_notes, assigned_to, temp_replacement_code, priority },
      req
    });

    res.json({ success: true, message: 'Caso actualizado con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
