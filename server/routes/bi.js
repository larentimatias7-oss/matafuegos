/**
 * Milicic FireControl 365 - API de Datasets para Power BI y Excel (/api/bi/*)
 * Tablas planas dimensionales (modelo estrella) para consumo analítico.
 * Autenticación dual: Cookie de sesión (RBAC) o Token de API de Solo Lectura (Bearer).
 * Pseudonimización estricta de datos de personas para cumplimiento de privacidad.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../db');
const { PERMISOS, hasPermission, ROLES } = require('../config/permissions');

/**
 * Middleware de autenticación para BI:
 * 1. Revisa cabecera Authorization: Bearer <TOKEN> y valida contra tabla bi_tokens.
 * 2. Si no hay token, revisa la sesión regular de la app.
 */
function authenticateBi(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7).trim();
    if (rawToken && rawToken !== 'invalid_token') {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const biToken = db.prepare(`
        SELECT id, organizacion_id, nombre, revocado
        FROM bi_tokens
        WHERE token_hash = ? AND revocado = 0
      `).get(tokenHash);

      if (biToken) {
        db.prepare('UPDATE bi_tokens SET ultimo_acceso = datetime(\'now\', \'localtime\') WHERE id = ?').run(biToken.id);
        req.user = {
          authenticated: true,
          isBiToken: true,
          organizacion_id: biToken.organizacion_id || 1,
          name: biToken.nombre,
          role: ROLES.GERENCIA
        };
        return next();
      }
    }
    return res.status(401).json({ success: false, error: 'Token de Power BI inválido o revocado' });
  }

  // Fallback a autenticación de sesión de la aplicación
  const { authenticate } = require('../middleware/auth');
  return authenticate(req, res, () => {
    if (req.user && req.user.authenticated) {
      if (req.user.role === ROLES.SUPERADMIN || req.user.role === ROLES.ADMIN || req.user.role === ROLES.GERENCIA) {
        return next();
      }
    }
    return res.status(403).json({ success: false, error: 'Permisos insuficientes para consultar datasets de BI' });
  });
}

router.use(authenticateBi);

// Helper para convertir array de objetos a CSV con UTF-8 BOM
function formatCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => headers.map(h => escapeCell(row[h])).join(','))
  ];

  return '\uFEFF' + csvRows.join('\r\n');
}

function respondDataset(req, res, rows, filename = 'dataset.csv') {
  const format = (req.query.format || 'json').toLowerCase();
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(formatCsv(rows));
  }
  return res.json({ success: true, count: rows.length, data: rows });
}

// 1. GET /api/bi/activos - Dimensión / Hecho de Activos de Extinción
router.get('/activos', (req, res) => {
  const orgId = req.user.organizacion_id || 1;
  const rows = db.prepare(`
    SELECT 
      id AS extintor_id,
      code AS codigo,
      type AS tipo_agente,
      capacity AS capacidad,
      building AS edificio,
      floor AS piso,
      area AS sector,
      location AS ubicacion_detalle,
      manufacturer AS fabricante,
      fab_year AS anio_fabricacion,
      lifespan_limit AS fecha_limite_vida_util,
      last_charge_date AS fecha_ultima_carga,
      expiration_charge AS fecha_vencimiento_carga,
      last_ph_date AS fecha_ultima_ph,
      expiration_ph AS fecha_vencimiento_ph,
      supplier AS proveedor_mantenimiento,
      certificate_number AS numero_certificado,
      status AS estado_operativo,
      CASE WHEN expiration_charge < date('now') THEN 1 ELSE 0 END AS carga_vencida,
      CASE WHEN expiration_ph < date('now') THEN 1 ELSE 0 END AS ph_vencida
    FROM extinguishers
    WHERE organizacion_id = ? AND status != 'DE_BAJA'
    ORDER BY code
  `).all(orgId);

  return respondDataset(req, res, rows, 'milicic_bi_activos.csv');
});

// 2. GET /api/bi/inspecciones - Hechos de Controles Periódicos (Seudonimizado)
router.get('/inspecciones', (req, res) => {
  const orgId = req.user.organizacion_id || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 5000, 10000);

  const rows = db.prepare(`
    SELECT 
      i.id AS inspeccion_id,
      i.extinguisher_id,
      i.extinguisher_code AS codigo_extintor,
      e.building AS edificio,
      e.floor AS piso,
      e.area AS sector,
      e.type AS tipo_agente,
      i.inspection_date AS fecha_inspeccion,
      i.year_month AS anio_mes,
      i.passed AS conforme,
      i.check_location AS check_ubicacion,
      i.check_pressure AS check_presion,
      i.check_seal AS check_precinto,
      i.check_physical AS check_fisico,
      i.check_signage AS check_senaletica,
      i.check_card AS check_tarjeta,
      i.duration_seconds AS duracion_segundos,
      i.is_suspicious AS es_sospechosa,
      -- Seudonimización estricta: nunca expone nombre de inspectores a BI
      'Inspector #' || (abs(random()) % 90 + 10) AS inspector_anonimo
    FROM inspections i
    JOIN extinguishers e ON i.extinguisher_id = e.id
    WHERE i.organizacion_id = ?
    ORDER BY i.inspection_date DESC
    LIMIT ?
  `).all(orgId, limit);

  return respondDataset(req, res, rows, 'milicic_bi_inspecciones.csv');
});

// 3. GET /api/bi/casos - Hechos de Anomalías y Fallas
router.get('/casos', (req, res) => {
  const orgId = req.user.organizacion_id || 1;
  const rows = db.prepare(`
    SELECT 
      c.id AS caso_id,
      c.extinguisher_id,
      c.extinguisher_code AS codigo_extintor,
      e.building AS edificio,
      e.floor AS piso,
      e.area AS sector,
      e.type AS tipo_agente,
      c.title AS titulo_falla,
      c.status AS estado_caso,
      c.priority AS prioridad,
      c.opened_at AS fecha_apertura,
      c.closed_at AS fecha_cierre,
      CASE 
        WHEN c.closed_at IS NOT NULL THEN ROUND(julianday(c.closed_at) - julianday(c.opened_at), 1)
        ELSE ROUND(julianday('now', 'localtime') - julianday(c.opened_at), 1)
      END AS dias_resolucion,
      CASE WHEN c.temp_replacement_code IS NOT NULL AND c.temp_replacement_code != '' THEN 1 ELSE 0 END AS tiene_reemplazo_muletto
    FROM cases c
    JOIN extinguishers e ON c.extinguisher_id = e.id
    WHERE c.organizacion_id = ?
    ORDER BY c.opened_at DESC
  `).all(orgId);

  return respondDataset(req, res, rows, 'milicic_bi_casos.csv');
});

// 4. GET /api/bi/servicios - Hechos de Taller Externo, SLA y Costos
router.get('/servicios', (req, res) => {
  const orgId = req.user.organizacion_id || 1;
  const rows = db.prepare(`
    SELECT 
      os.id AS orden_id,
      os.codigo_orden,
      os.extinguisher_id,
      e.code AS codigo_extintor,
      e.type AS tipo_agente,
      os.proveedor,
      os.tipo_servicio,
      os.fecha_envio,
      os.fecha_prometida,
      os.fecha_devolucion,
      os.cumplio_tiempo,
      CASE 
        WHEN os.fecha_devolucion IS NOT NULL THEN ROUND(julianday(os.fecha_devolucion) - julianday(os.fecha_envio), 1)
        ELSE ROUND(julianday('now', 'localtime') - julianday(os.fecha_envio), 1)
      END AS dias_en_taller,
      os.costo_estimado,
      os.costo_real,
      os.estado AS estado_orden
    FROM ordenes_servicio os
    JOIN extinguishers e ON os.extinguisher_id = e.id
    WHERE os.organizacion_id = ?
    ORDER BY os.fecha_envio DESC
  `).all(orgId);

  return respondDataset(req, res, rows, 'milicic_bi_servicios.csv');
});

// 5. GET /api/bi/snapshots - Histórico de Snapshots de KPIs
router.get('/snapshots', (req, res) => {
  const orgId = req.user.organizacion_id || 1;
  const rows = db.prepare(`
    SELECT 
      id AS snapshot_id,
      year_month,
      fecha_corte,
      sitio,
      tipo_activo,
      kpis_json,
      es_reconstruido,
      hash_integridad,
      creado_en
    FROM kpi_snapshots
    WHERE organizacion_id = ?
    ORDER BY year_month DESC
  `).all(orgId);

  return respondDataset(req, res, rows, 'milicic_bi_snapshots.csv');
});

module.exports = router;
