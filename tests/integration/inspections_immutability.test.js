import { describe, it, expect } from 'vitest';
const request = require('supertest');
const { app } = require('../../server/index');
const { db } = require('../../server/db');

describe('API Integration: Inspecciones, Antifraude e Inmutabilidad', () => {

  const testExtCode = 'MF-005';

  it('debe registrar exitosamente una inspección conforme (Happy Path)', async () => {
    // Asegurar que no haya inspecciones previas de este mes para el test
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ext = db.prepare('SELECT id FROM extinguishers WHERE code = ?').get(testExtCode);
    db.prepare('DELETE FROM inspections WHERE extinguisher_id = ? AND year_month = ?').run(ext.id, currentMonth);

    const res = await request(app)
      .post('/api/inspections')
      .set('x-user-role', 'INSPECTOR')
      .send({
        extinguisher_code: testExtCode,
        inspector_name: 'Santiago Amaya',
        check_location: 1,
        check_pressure: 1,
        check_seal: 1,
        check_physical: 1,
        check_signage: 1,
        check_card: 1,
        duration_seconds: 18,
        observations: 'Control preventivo mensual'
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.passed).toBe(true);
    expect(res.body.inspectionId).toBeDefined();

    // Verificar en BD que no quedó como sospechosa
    const saved = db.prepare('SELECT is_suspicious, duration_seconds FROM inspections WHERE id = ?').get(res.body.inspectionId);
    expect(saved.is_suspicious).toBe(0);
    expect(saved.duration_seconds).toBe(18);
  });

  it('debe abrir un caso automáticamente si la inspección no pasa (Con anomalías)', async () => {
    const faultyExtCode = 'MF-006';
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ext = db.prepare('SELECT id FROM extinguishers WHERE code = ?').get(faultyExtCode);
    db.prepare('DELETE FROM inspections WHERE extinguisher_id = ? AND year_month = ?').run(ext.id, currentMonth);

    const res = await request(app)
      .post('/api/inspections')
      .set('x-user-role', 'INSPECTOR')
      .send({
        extinguisher_code: faultyExtCode,
        inspector_name: 'Santiago Amaya',
        check_location: 1,
        check_pressure: 0, // Falló presión
        check_seal: 1,
        check_physical: 1,
        check_signage: 1,
        check_card: 1,
        duration_seconds: 15,
        observations: 'Manómetro despresurizado en zona roja'
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.passed).toBe(false);
    expect(res.body.caseId).toBeDefined();

    // Verificar que el caso existe en la tabla cases
    const createdCase = db.prepare('SELECT * FROM cases WHERE id = ?').get(res.body.caseId);
    expect(createdCase).toBeDefined();
    expect(createdCase.status).toBe('ABIERTO');
    expect(createdCase.description).toContain('Manómetro bajo');
  });

  it('debe detectar y marcar como sospechosa una inspección de menos de 5 segundos (Antifraude)', async () => {
    const fastExtCode = 'MF-007';
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ext = db.prepare('SELECT id FROM extinguishers WHERE code = ?').get(fastExtCode);
    db.prepare('DELETE FROM inspections WHERE extinguisher_id = ? AND year_month = ?').run(ext.id, currentMonth);

    const res = await request(app)
      .post('/api/inspections')
      .set('x-user-role', 'INSPECTOR')
      .send({
        extinguisher_code: fastExtCode,
        inspector_name: 'Operario Rápido',
        check_location: 1,
        check_pressure: 1,
        check_seal: 1,
        check_physical: 1,
        check_signage: 1,
        check_card: 1,
        duration_seconds: 2 // Menor a 5 segundos
      })
      .expect(201);

    const saved = db.prepare('SELECT is_suspicious, fraud_flags FROM inspections WHERE id = ?').get(res.body.inspectionId);
    expect(saved.is_suspicious).toBe(1);
    expect(saved.fraud_flags).toContain('TIEMPO_INSPECCION_MENOR_5S');
  });

  it('debe rechazar (409 Conflict) una segunda inspección en el mismo mes sin declarar reinspección', async () => {
    // testExtCode (MF-005) ya fue inspeccionado en el primer test
    const res = await request(app)
      .post('/api/inspections')
      .set('x-user-role', 'INSPECTOR')
      .send({
        extinguisher_code: testExtCode,
        check_location: 1,
        check_pressure: 1,
        check_seal: 1,
        check_physical: 1,
        check_signage: 1,
        check_card: 1,
        duration_seconds: 15
      })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('ya fue inspeccionado en esta ronda');
  });

  it('debe permitir una reinspección si se justifica debidamente el motivo', async () => {
    const res = await request(app)
      .post('/api/inspections')
      .set('x-user-role', 'INSPECTOR')
      .send({
        extinguisher_code: testExtCode,
        check_location: 1,
        check_pressure: 1,
        check_seal: 1,
        check_physical: 1,
        check_signage: 1,
        check_card: 1,
        duration_seconds: 20,
        is_reinspection: 1,
        reinspection_reason: 'Revisión por simulacro de evacuación en planta'
      })
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('debe responder 404 si el extintor a inspeccionar no existe', async () => {
    const res = await request(app)
      .post('/api/inspections')
      .set('x-user-role', 'INSPECTOR')
      .send({
        extinguisher_code: 'MF-99999',
        check_location: 1
      })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('no encontrado');
  });

  describe('Inmutabilidad Estricta de Inspecciones (IRAM 3517-2)', () => {
    it('debe rechazar PUT con 405 Method Not Allowed', async () => {
      const res = await request(app)
        .put('/api/inspections/1')
        .set('x-user-role', 'ADMIN')
        .send({ observations: 'Intento de modificar' })
        .expect(405);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('inmutables');
    });

    it('debe rechazar DELETE con 405 Method Not Allowed', async () => {
      const res = await request(app)
        .delete('/api/inspections/1')
        .set('x-user-role', 'ADMIN')
        .expect(405);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('inmutables');
    });

    it('debe rechazar PATCH con 405 Method Not Allowed', async () => {
      const res = await request(app)
        .patch('/api/inspections/1')
        .set('x-user-role', 'ADMIN')
        .send({ passed: 1 })
        .expect(405);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('inmutables');
    });
  });
});
