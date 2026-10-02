import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('FASE 8: Observabilidad y Métricas de Operación', () => {
  it('GET /api/health debe reportar estado healthy con verificaciones de DB y almacenamiento', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.system).toBe('Milicic FireControl 365');
    expect(res.body.checks).toBeDefined();
    expect(res.body.checks.database.status).toBe('healthy');
    expect(res.body.checks.database.integrity).toBe('ok');
    expect(res.body.checks.storage).toBeDefined();
    expect(res.body.checks.memory).toBeDefined();
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });

  it('GET /api/metrics debe responder en formato texto estándar Prometheus', async () => {
    const res = await request(app).get('/api/metrics');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');

    const text = res.text;
    expect(text).toContain('firecontrol_uptime_seconds');
    expect(text).toContain('firecontrol_http_requests_total');
    expect(text).toContain('firecontrol_http_errors_total');
    expect(text).toContain('firecontrol_extinguishers_total');
    expect(text).toContain('firecontrol_inspections_total');
  });

  it('cada petición debe incluir un encabezado X-Request-ID único para trazabilidad', async () => {
    const res1 = await request(app).get('/api/health');
    const res2 = await request(app).get('/api/health');

    const id1 = res1.headers['x-request-id'];
    const id2 = res2.headers['x-request-id'];

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
  });
});
