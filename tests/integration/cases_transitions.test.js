import { describe, it, expect } from 'vitest';
const request = require('supertest');
const { app } = require('../../server/index');
const { db } = require('../../server/db');

describe('API Integration: Gestión de Casos y Transiciones de Estado', () => {

  let testCaseId;

  it('debe listar casos con cálculo de días abierto', async () => {
    // Insertar un caso de prueba
    const ext = db.prepare('SELECT id, code FROM extinguishers LIMIT 1').get();
    const insert = db.prepare(`
      INSERT INTO cases (extinguisher_id, extinguisher_code, title, description, status, priority, opened_at)
      VALUES (?, ?, 'Fuga en válvula', 'Pérdida leve de agente', 'ABIERTO', 'ALTA', datetime('now', '-5 days'))
    `);
    const res = insert.run(ext.id, ext.code);
    testCaseId = res.lastInsertRowid;

    const apiRes = await request(app).get('/api/cases?status=ABIERTO').expect(200);
    expect(apiRes.body.success).toBe(true);
    expect(Array.isArray(apiRes.body.cases)).toBe(true);

    const found = apiRes.body.cases.find(c => c.id === testCaseId);
    expect(found).toBeDefined();
    expect(found.days_open).toBeGreaterThanOrEqual(4);
  });

  it('debe permitir transición válida de ABIERTO a EN_TALLER', async () => {
    const res = await request(app)
      .put(`/api/cases/${testCaseId}`)
      .set('x-user-role', 'INSPECTOR')
      .send({
        status: 'EN_TALLER',
        assigned_to: 'Taller Certificado Rosarino'
      })
      .expect(200);

    expect(res.body.success).toBe(true);

    const updated = db.prepare('SELECT status, assigned_to FROM cases WHERE id = ?').get(testCaseId);
    expect(updated.status).toBe('EN_TALLER');
    expect(updated.assigned_to).toBe('Taller Certificado Rosarino');
  });

  it('debe permitir transición de EN_TALLER a RESUELTO con notas de resolución', async () => {
    const res = await request(app)
      .put(`/api/cases/${testCaseId}`)
      .set('x-user-role', 'INSPECTOR')
      .send({
        status: 'RESUELTO',
        resolution_notes: 'Válvula reparada y prueba hidráulica completada con éxito'
      })
      .expect(200);

    expect(res.body.success).toBe(true);

    const closed = db.prepare('SELECT status, closed_at FROM cases WHERE id = ?').get(testCaseId);
    expect(closed.status).toBe('RESUELTO');
    expect(closed.closed_at).not.toBeNull();
  });

  it('debe RECHAZAR con 400 transición inválida de RESUELTO a ABIERTO', async () => {
    const res = await request(app)
      .put(`/api/cases/${testCaseId}`)
      .set('x-user-role', 'INSPECTOR')
      .send({
        status: 'ABIERTO'
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Transición inválida');
  });

  it('debe responder 404 al intentar actualizar un caso inexistente', async () => {
    const res = await request(app)
      .put('/api/cases/9999999')
      .set('x-user-role', 'INSPECTOR')
      .send({ status: 'RESUELTO', resolution_notes: 'Nada' })
      .expect(404);

    expect(res.body.success).toBe(false);
  });
});
