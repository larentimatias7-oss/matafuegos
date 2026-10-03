/**
 * Milicic FireControl 365 - Rutas del Módulo Gerencial de KPIs (FireControl 365 BI)
 * Endpoints ejecutivos de solo lectura, agregados a nivel sitio/sector/proveedor.
 * Respeta la regla de oro de privacidad: nunca expone métricas ni rankings individuales por inspector.
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const {
  authenticate,
  requirePermiso,
  PERMISOS,
  ROLES
} = require('../middleware/auth');
const {
  getExecutiveSummary,
  getHeatmapData,
  getProjections12Months,
  getWorkshopPerformance,
  getKpiConfigurations,
  captureSnapshot,
  calculateAllKpis,
  clearKpiCache
} = require('../services/kpiService');
const { recordAudit } = require('../services/auditService');

router.use(authenticate);

// 1. GET /api/gerencia/resumen - Resumen ejecutivo, top cards, narrativa y deltas
router.get('/resumen', requirePermiso(PERMISOS.GERENCIA_VER), (req, res) => {
  try {
    const { yearMonth, building, assetType } = req.query;
    const orgId = req.user.organizacion_id || 1;

    const summary = getExecutiveSummary({
      orgId,
      yearMonth,
      building: building || 'ALL',
      assetType: assetType || 'ALL'
    });

    return res.json({ success: true, data: summary });
  } catch (err) {
    console.error('[GERENCIA RESUMEN ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al calcular resumen gerencial' });
  }
});

// 2. GET /api/gerencia/tendencias - Historial de 12 meses (snapshots cerrados + mes actual)
router.get('/tendencias', requirePermiso(PERMISOS.GERENCIA_VER), (req, res) => {
  try {
    const orgId = req.user.organizacion_id || 1;
    const { building, assetType } = req.query;

    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(ym);
    }

    const trends = months.map(ym => {
      // Intentar leer snapshot
      const snapshotRow = db.prepare(`
        SELECT kpis_json, es_reconstruido, hash_integridad
        FROM kpi_snapshots
        WHERE organizacion_id = ? AND year_month = ? AND sitio = ? AND tipo_activo = ?
      `).get(orgId, ym, building || 'ALL', assetType || 'ALL');

      if (snapshotRow) {
        try {
          const kpis = JSON.parse(snapshotRow.kpis_json);
          return {
            year_month: ym,
            cumplimiento: kpis.cumplimiento?.valor || 0,
            vigencia: kpis.vigencia?.valor || 0,
            tasa_fallas: kpis.tasa_fallas?.valor || 0,
            isi: kpis.isi?.valor || 0,
            disponibilidad: kpis.disponibilidad?.valor || 0,
            es_snapshot: true,
            es_reconstruido: snapshotRow.es_reconstruido === 1
          };
        } catch (e) {
          // Fallback a cálculo
        }
      }

      // Si no hay snapshot, cálculo en vivo
      const kpis = calculateAllKpis({ orgId, yearMonth: ym, building, assetType });
      return {
        year_month: ym,
        cumplimiento: kpis.cumplimiento.valor,
        vigencia: kpis.vigencia.valor,
        tasa_fallas: kpis.tasa_fallas.valor,
        isi: kpis.isi.valor,
        disponibilidad: kpis.disponibilidad.valor,
        es_snapshot: false,
        es_reconstruido: false
      };
    });

    return res.json({ success: true, data: trends });
  } catch (err) {
    console.error('[GERENCIA TENDENCIAS ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al consultar tendencias históricas' });
  }
});

// 3. GET /api/gerencia/heatmap - Mapa de calor sectorial (Edificio / Piso / Área)
router.get('/heatmap', requirePermiso(PERMISOS.GERENCIA_VER), (req, res) => {
  try {
    const orgId = req.user.organizacion_id || 1;
    const { building } = req.query;

    const data = getHeatmapData({ orgId, building });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[GERENCIA HEATMAP ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al obtener mapa de calor' });
  }
});

// 4. GET /api/gerencia/vencimientos - Proyección mensual a 12 meses
router.get('/vencimientos', requirePermiso(PERMISOS.GERENCIA_VER), (req, res) => {
  try {
    const orgId = req.user.organizacion_id || 1;
    const { building } = req.query;

    const data = getProjections12Months({ orgId, building });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[GERENCIA VENCIMIENTOS ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al calcular proyección de vencimientos' });
  }
});

// 5. GET /api/gerencia/anomalias - Distribución de casos y tiempos de resolución
router.get('/anomalias', requirePermiso(PERMISOS.GERENCIA_VER), (req, res) => {
  try {
    const orgId = req.user.organizacion_id || 1;

    const aging = db.prepare(`
      SELECT 
        SUM(CASE WHEN CAST(julianday('now') - julianday(opened_at) AS INT) <= 7 THEN 1 ELSE 0 END) AS menos_7_dias,
        SUM(CASE WHEN CAST(julianday('now') - julianday(opened_at) AS INT) BETWEEN 8 AND 15 THEN 1 ELSE 0 END) AS de_8_a_15_dias,
        SUM(CASE WHEN CAST(julianday('now') - julianday(opened_at) AS INT) BETWEEN 16 AND 30 THEN 1 ELSE 0 END) AS de_16_a_30_dias,
        SUM(CASE WHEN CAST(julianday('now') - julianday(opened_at) AS INT) > 30 THEN 1 ELSE 0 END) AS mas_30_dias
      FROM cases
      WHERE status IN ('ABIERTO', 'EN_TALLER') AND organizacion_id = ?
    `).get(orgId);

    const mttrTrend = db.prepare(`
      SELECT 
        strftime('%Y-%m', closed_at) AS year_month,
        COUNT(*) AS resueltos,
        ROUND(AVG(julianday(closed_at) - julianday(opened_at)), 1) AS mttr_dias
      FROM cases
      WHERE status = 'RESUELTO' AND closed_at IS NOT NULL AND organizacion_id = ?
      GROUP BY strftime('%Y-%m', closed_at)
      ORDER BY year_month DESC
      LIMIT 6
    `).all(orgId);

    return res.json({
      success: true,
      data: {
        antiguedad_casos_abiertos: aging || { menos_7_dias: 0, de_8_a_15_dias: 0, de_16_a_30_dias: 0, mas_30_dias: 0 },
        mttr_historico_mensual: mttrTrend.reverse()
      }
    });
  } catch (err) {
    console.error('[GERENCIA ANOMALIAS ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al consultar métricas de anomalías' });
  }
});

// 6. GET /api/gerencia/servicios - Desempeño de proveedores y talleres
router.get('/servicios', requirePermiso(PERMISOS.GERENCIA_VER), (req, res) => {
  try {
    const orgId = req.user.organizacion_id || 1;
    const data = getWorkshopPerformance({ orgId });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[GERENCIA SERVICIOS ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al consultar servicios de taller' });
  }
});

// 7. GET /api/gerencia/configuracion - Metas y umbrales configurables
router.get('/configuracion', requirePermiso(PERMISOS.GERENCIA_VER), (req, res) => {
  try {
    const orgId = req.user.organizacion_id || 1;
    const configs = getKpiConfigurations(orgId);
    return res.json({ success: true, data: Object.values(configs) });
  } catch (err) {
    console.error('[GERENCIA CONFIG ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al leer configuración de KPIs' });
  }
});

// 8. PUT /api/gerencia/configuracion - Actualizar metas y umbrales (Solo Admin/Superadmin)
router.put('/configuracion', requirePermiso(PERMISOS.GERENCIA_CONFIGURAR), (req, res) => {
  try {
    const orgId = req.user.organizacion_id || 1;
    const { items } = req.body; // array de { kpi_codigo, meta_objetivo, umbral_verde_min, umbral_amarillo_min, umbral_rojo_max, peso_ponderacion, plazo_objetivo_dias }

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Formato inválido: se requiere un array de items' });
    }

    const updateStmt = db.prepare(`
      UPDATE kpi_configuracion
      SET meta_objetivo = ?,
          umbral_verde_min = ?,
          umbral_amarillo_min = ?,
          umbral_rojo_max = ?,
          peso_ponderacion = COALESCE(?, peso_ponderacion),
          plazo_objetivo_dias = COALESCE(?, plazo_objetivo_dias),
          actualizado_por = ?,
          actualizado_en = datetime('now', 'localtime')
      WHERE organizacion_id = ? AND kpi_codigo = ?
    `);

    for (const item of items) {
      if (item.kpi_codigo) {
        updateStmt.run(
          item.meta_objetivo,
          item.umbral_verde_min,
          item.umbral_amarillo_min,
          item.umbral_rojo_max,
          item.peso_ponderacion,
          item.plazo_objetivo_dias,
          req.user.name,
          orgId,
          item.kpi_codigo
        );
      }
    }

    clearKpiCache();

    recordAudit(db, {
      usuario_id: req.user.id,
      usuario_nombre_snapshot: req.user.name,
      accion: 'ACTUALIZAR_CONFIG_KPIS',
      entidad: 'kpi_configuracion',
      entidad_id: 'GLOBAL',
      datos_despues: { cantidad_modificada: items.length },
      req
    });

    return res.json({ success: true, message: 'Metas y umbrales actualizados exitosamente' });
  } catch (err) {
    console.error('[GERENCIA UPDATE CONFIG ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar configuración de KPIs' });
  }
});

// 9. POST /api/gerencia/snapshots/recompute - Forzar captura de snapshot (Solo Admin/Superadmin)
router.post('/snapshots/recompute', requirePermiso(PERMISOS.GERENCIA_CONFIGURAR), (req, res) => {
  try {
    const orgId = req.user.organizacion_id || 1;
    const { yearMonth, building, assetType } = req.body;

    const result = captureSnapshot({
      orgId,
      yearMonth,
      building: building || 'ALL',
      assetType: assetType || 'ALL',
      isReconstructed: 0
    });

    clearKpiCache();

    return res.json({ success: true, message: 'Snapshot capturado con éxito', data: result });
  } catch (err) {
    console.error('[GERENCIA SNAPSHOT ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al generar snapshot' });
  }
});

module.exports = router;
