/**
 * Milicic FireControl 365 - Rutas de Consulta y Exportación de Auditoría Inmutable
 */

const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { db } = require('../db');
const { authenticate, requirePermiso, PERMISOS } = require('../middleware/auth');
const { recordAudit } = require('../services/auditService');

router.use(authenticate);

// 1. GET /api/audit - Listar eventos de auditoría con filtros
router.get('/', requirePermiso(PERMISOS.AUDITORIA_VER), (req, res) => {
  const { usuario_id, accion, entidad, desde, hasta, limit = 50, offset = 0 } = req.query;

  try {
    let query = `
      SELECT id, fecha, usuario_id, usuario_nombre_snapshot, accion,
             entidad, entidad_id, datos_antes, datos_despues, ip, user_agent
      FROM auditoria
      WHERE organizacion_id = ?
    `;
    const params = [req.user.organizacion_id || 1];

    if (usuario_id) {
      query += ` AND usuario_id = ?`;
      params.push(usuario_id);
    }
    if (accion) {
      query += ` AND accion = ?`;
      params.push(accion);
    }
    if (entidad) {
      query += ` AND entidad = ?`;
      params.push(entidad);
    }
    if (desde) {
      query += ` AND fecha >= ?`;
      params.push(`${desde} 00:00:00`);
    }
    if (hasta) {
      query += ` AND fecha <= ?`;
      params.push(`${hasta} 23:59:59`);
    }

    query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const rows = db.prepare(query).all(...params);

    const countQuery = `SELECT COUNT(*) as total FROM auditoria WHERE organizacion_id = ?`;
    const total = db.prepare(countQuery).get(req.user.organizacion_id || 1).total;

    return res.json({
      success: true,
      data: rows.map(r => ({
        ...r,
        datos_antes: r.datos_antes ? JSON.parse(r.datos_antes) : null,
        datos_despues: r.datos_despues ? JSON.parse(r.datos_despues) : null
      })),
      pagination: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      }
    });
  } catch (err) {
    console.error('[AUDIT QUERY ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al consultar auditoría' });
  }
});

// 2. GET /api/audit/export - Exportar auditoría a Excel (.xlsx)
router.get('/export', requirePermiso(PERMISOS.AUDITORIA_EXPORTAR), async (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, fecha, usuario_nombre_snapshot, accion, entidad, entidad_id, ip, datos_despues
      FROM auditoria
      WHERE organizacion_id = ?
      ORDER BY id DESC
      LIMIT 1000
    `).all(req.user.organizacion_id || 1);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Milicic S.A. - FireControl 365';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Auditoría del Sistema', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    sheet.columns = [
      { header: 'ID Evento', key: 'id', width: 12 },
      { header: 'Fecha y Hora', key: 'fecha', width: 22 },
      { header: 'Usuario Responsable', key: 'usuario_nombre_snapshot', width: 26 },
      { header: 'Acción Ejecutada', key: 'accion', width: 24 },
      { header: 'Entidad Afectada', key: 'entidad', width: 16 },
      { header: 'ID de Entidad', key: 'entidad_id', width: 20 },
      { header: 'Dirección IP', key: 'ip', width: 16 },
      { header: 'Detalles / Datos', key: 'datos_despues', width: 40 }
    ];

    sheet.getRow(1).eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' } // Slate 900 corporativo
      };
      cell.font = {
        name: 'Segoe UI',
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 11
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    rows.forEach(r => sheet.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Auditoria_Milicic_${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();

    recordAudit(db, {
      usuario_id: req.user.id,
      usuario_nombre_snapshot: req.user.name,
      accion: 'EXPORTAR_AUDITORIA',
      entidad: 'auditoria',
      entidad_id: 'excel_export',
      req
    });
  } catch (err) {
    console.error('[AUDIT EXPORT ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al exportar registros de auditoría' });
  }
});

module.exports = router;
