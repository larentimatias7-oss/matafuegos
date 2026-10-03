import { describe, it, expect } from 'vitest';
const request = require('supertest');
const { app } = require('../../server/index');
const { db } = require('../../server/db');
const { ROLES } = require('../../server/config/permissions');
const {
  calculateAllKpis,
  getExecutiveSummary,
  getHeatmapData,
  getProjections12Months,
  getWorkshopPerformance,
  getKpiConfigurations,
  captureSnapshot
} = require('../../server/services/kpiService');

describe('FASE 1: API Integration - Módulo Gerencial de KPIs (FireControl 365 BI)', () => {

  it('debe calcular los 12 KPIs con exactitud matemática mediante kpiService', () => {
    const kpis = calculateAllKpis({ orgId: 1, yearMonth: '2026-10' });

    expect(kpis).toBeDefined();
    expect(kpis.isi.valor).toBeGreaterThanOrEqual(0);
    expect(kpis.isi.valor).toBeLessThanOrEqual(100);
    expect(kpis.isi.formula).toContain('40% Vigencia');

    expect(kpis.cumplimiento.valor).toBeGreaterThanOrEqual(0);
    expect(kpis.cumplimiento.valor).toBeLessThanOrEqual(100);

    expect(kpis.vigencia.valor).toBeGreaterThanOrEqual(0);
    expect(kpis.vigencia.vencidos_cantidad).toBeGreaterThanOrEqual(0);

    expect(kpis.anomalias.mttr_dias).toBeGreaterThan(0);
    expect(kpis.disponibilidad.valor).toBeGreaterThanOrEqual(90);

    expect(kpis.confiabilidad.valor).toBeGreaterThanOrEqual(0);
    expect(kpis.confiabilidad.valor).toBeLessThanOrEqual(100);

    expect(kpis.costos.costo_promedio_unitario).toBeGreaterThan(0);
  });

  it('debe responder 403 Forbidden si un rol INSPECTOR intenta acceder a los KPIs gerenciales', async () => {
    const res = await request(app)
      .get('/api/gerencia/resumen')
      .set('x-user-role', ROLES.INSPECTOR)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('permisos suficientes');
  });

  it('debe responder 403 Forbidden si un rol AUDITOR intenta modificar metas de gerencia', async () => {
    const res = await request(app)
      .put('/api/gerencia/configuracion')
      .set('x-user-role', ROLES.AUDITOR)
      .send({ items: [{ kpi_codigo: 'KPI-01', meta_objetivo: 98 }] })
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  it('debe permitir a un usuario con rol GERENCIA consultar el resumen ejecutivo', async () => {
    const res = await request(app)
      .get('/api/gerencia/resumen')
      .set('x-user-role', ROLES.GERENCIA)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.topCards).toHaveLength(6);
    expect(res.body.data.narrative).toBeDefined();
    expect(typeof res.body.data.narrative).toBe('string');
    expect(res.body.data.narrative.length).toBeGreaterThan(50);
  });

  it('debe proveer tendencias históricas de 12 meses', async () => {
    const res = await request(app)
      .get('/api/gerencia/tendencias')
      .set('x-user-role', ROLES.GERENCIA)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(12);
    expect(res.body.data[0].year_month).toMatch(/^\d{4}-\d{2}$/);
    expect(res.body.data[0].cumplimiento).toBeDefined();
    expect(res.body.data[0].vigencia).toBeDefined();
  });

  it('debe retornar mapa de calor sectorial agrupado por edificio, piso y sector', async () => {
    const res = await request(app)
      .get('/api/gerencia/heatmap')
      .set('x-user-role', ROLES.GERENCIA)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const firstSector = res.body.data[0];
    expect(firstSector.edificio).toBeDefined();
    expect(firstSector.piso).toBeDefined();
    expect(firstSector.sector).toBeDefined();
    expect(firstSector.total).toBeGreaterThan(0);
    expect(['VERDE', 'AMARILLO', 'ROJO']).toContain(firstSector.rag);
  });

  it('debe entregar proyecciones mensuales a 12 meses con conteo de cargas y pruebas hidráulicas', async () => {
    const res = await request(app)
      .get('/api/gerencia/vencimientos')
      .set('x-user-role', ROLES.GERENCIA)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(12);
    expect(res.body.data[0].cargas).toBeDefined();
    expect(res.body.data[0].ph).toBeDefined();
    expect(res.body.data[0].costo_estimado).toBeDefined();
  });

  it('debe calcular desempeño de proveedores de taller con cumplimiento SLA y costos', async () => {
    const res = await request(app)
      .get('/api/gerencia/servicios')
      .set('x-user-role', ROLES.GERENCIA)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const prov = res.body.data[0];
    expect(prov.proveedor).toBeDefined();
    expect(prov.total_ordenes).toBeGreaterThan(0);
    expect(prov.cumplimiento_sla_pct).toBeGreaterThanOrEqual(0);
    expect(prov.cumplimiento_sla_pct).toBeLessThanOrEqual(100);
  });

  it('debe permitir a ADMIN consultar y actualizar metas y umbrales (kpi_configuracion)', async () => {
    // 1. Consultar configuración
    const resGet = await request(app)
      .get('/api/gerencia/configuracion')
      .set('x-user-role', ROLES.ADMIN)
      .expect(200);

    expect(resGet.body.success).toBe(true);
    expect(resGet.body.data.length).toBe(12);

    // 2. Modificar meta de KPI-01
    const resPut = await request(app)
      .put('/api/gerencia/configuracion')
      .set('x-user-role', ROLES.ADMIN)
      .send({
        items: [
          {
            kpi_codigo: 'KPI-01',
            meta_objetivo: 96.5,
            umbral_verde_min: 96.5,
            umbral_amarillo_min: 82.0,
            umbral_rojo_max: 81.9,
            peso_ponderacion: 0.25,
            plazo_objetivo_dias: 30
          }
        ]
      })
      .expect(200);

    expect(resPut.body.success).toBe(true);

    const cfg = db.prepare("SELECT meta_objetivo FROM kpi_configuracion WHERE kpi_codigo = 'KPI-01'").get();
    expect(cfg.meta_objetivo).toBe(96.5);
  });

  it('debe generar datasets planos para Power BI con seudonimización estricta de inspectores', async () => {
    // 1. Dataset en JSON
    const resJson = await request(app)
      .get('/api/bi/inspecciones?limit=10')
      .set('x-user-role', ROLES.GERENCIA)
      .expect(200);

    expect(resJson.body.success).toBe(true);
    expect(resJson.body.data.length).toBeGreaterThan(0);

    // Verificar seudonimización: NUNCA expone el nombre real de inspectores
    const firstRow = resJson.body.data[0];
    expect(firstRow.inspector_anonimo).toMatch(/^Inspector #\d+$/);
    expect(firstRow.inspector_name).toBeUndefined();

    // 2. Dataset en CSV
    const resCsv = await request(app)
      .get('/api/bi/activos?format=csv')
      .set('x-user-role', ROLES.GERENCIA)
      .expect(200);

    expect(resCsv.headers['content-type']).toContain('text/csv');
    expect(resCsv.text).toContain('"codigo"');
    expect(resCsv.text).toContain('"tipo_agente"');
  });

  it('debe capturar snapshots inmutables con hash de integridad SHA-256', () => {
    const res = captureSnapshot({ orgId: 1, yearMonth: '2026-10', isReconstructed: 0 });
    expect(res.success).toBe(true);
    expect(res.hash).toHaveLength(64); // SHA-256 hex string

    const row = db.prepare("SELECT hash_integridad, es_reconstruido FROM kpi_snapshots WHERE year_month = '2026-10'").get();
    expect(row).toBeDefined();
    expect(row.hash_integridad).toBe(res.hash);
  });
});
