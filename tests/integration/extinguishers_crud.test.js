import { describe, it, expect } from 'vitest';
const request = require('supertest');
const { app } = require('../../server/index');
const { db } = require('../../server/db');

describe('API Integration: Extintores CRUD, Validaciones y Conflictos', () => {

  const testNewCode = 'MF-888';

  it('debe listar extintores con filtros y estado de semáforo adjunto', async () => {
    const res = await request(app)
      .get('/api/extinguishers?type=Polvo ABC')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].monthlyStatus).toBeDefined();
    expect(res.body.data[0].monthlyStatus.statusKey).toBeDefined();
  });

  it('debe obtener un extintor por su ID, código o public_id', async () => {
    const ext = db.prepare('SELECT id, code, public_id FROM extinguishers LIMIT 1').get();

    // Por ID
    const resId = await request(app).get(`/api/extinguishers/${ext.id}`).expect(200);
    expect(resId.body.data.code).toBe(ext.code);

    // Por Código
    const resCode = await request(app).get(`/api/extinguishers/${ext.code}`).expect(200);
    expect(resCode.body.data.id).toBe(ext.id);

    // Por Public ID
    const resPub = await request(app).get(`/api/extinguishers/${ext.public_id}`).expect(200);
    expect(resPub.body.data.id).toBe(ext.id);
  });

  it('debe responder 404 al buscar un extintor inexistente', async () => {
    const res = await request(app).get('/api/extinguishers/NO-EXISTE-999').expect(404);
    expect(res.body.success).toBe(false);
  });

  it('debe rechazar (400) la creación con campos inválidos o faltantes', async () => {
    const res = await request(app)
      .post('/api/extinguishers')
      .set('x-user-role', 'ADMIN')
      .send({
        code: 'CODIGO_INVALIDO',
        type: 'Polvo ABC'
        // Faltan capacity, location, expiration_charge, expiration_ph
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.details).toBeDefined();
  });

  it('debe crear un nuevo extintor con éxito y generar su public_id (201 Created)', async () => {
    // Asegurar que no exista previo al test
    db.prepare('DELETE FROM extinguishers WHERE code = ?').run(testNewCode);

    const res = await request(app)
      .post('/api/extinguishers')
      .set('x-user-role', 'ADMIN')
      .send({
        code: testNewCode,
        type: 'CO2',
        capacity: '5 kg',
        location: 'Sala de Pruebas Automatizadas',
        floor: 'Piso 1',
        area: 'QA y Testing',
        expiration_charge: '2027-10-01',
        expiration_ph: '2031-10-01',
        fab_year: 2021
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.public_id).toBeDefined();
    expect(res.body.public_id.length).toBeGreaterThan(6);

    // Verificar en BD y en auditoría
    const saved = db.prepare('SELECT * FROM extinguishers WHERE code = ?').get(testNewCode);
    expect(saved).toBeDefined();
    expect(saved.location).toBe('Sala de Pruebas Automatizadas');

    const audit = db.prepare("SELECT * FROM audit_logs WHERE entity_type = 'EXTINGUISHER' AND entity_id = ? AND action = 'CREATE'").get(saved.id);
    expect(audit).toBeDefined();
  });

  it('debe rechazar con 409 Conflict si se intenta dar de alta un código ya existente', async () => {
    const res = await request(app)
      .post('/api/extinguishers')
      .set('x-user-role', 'ADMIN')
      .send({
        code: testNewCode, // Ya creado en el test anterior
        type: 'Polvo ABC',
        capacity: '5 kg',
        location: 'Otro lugar',
        expiration_charge: '2027-10-01',
        expiration_ph: '2031-10-01'
      })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Ya existe');
  });

  it('debe actualizar los datos de un extintor existente (PUT /:id)', async () => {
    const ext = db.prepare('SELECT id FROM extinguishers WHERE code = ?').get(testNewCode);

    const res = await request(app)
      .put(`/api/extinguishers/${ext.id}`)
      .set('x-user-role', 'ADMIN')
      .send({
        location: 'Nueva Ubicación Actualizada',
        notes: 'Actualizado vía test suite'
      })
      .expect(200);

    expect(res.body.success).toBe(true);

    const updated = db.prepare('SELECT location, notes FROM extinguishers WHERE id = ?').get(ext.id);
    expect(updated.location).toBe('Nueva Ubicación Actualizada');
  });

  it('debe responder 404 al intentar actualizar un extintor inexistente', async () => {
    const res = await request(app)
      .put('/api/extinguishers/9999999')
      .set('x-user-role', 'ADMIN')
      .send({ location: 'Imposible' })
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  it('debe eliminar un extintor con rol ADMIN y responder 404 si ya no existe', async () => {
    const ext = db.prepare('SELECT id FROM extinguishers WHERE code = ?').get(testNewCode);

    // Eliminación exitosa
    await request(app)
      .delete(`/api/extinguishers/${ext.id}`)
      .set('x-user-role', 'ADMIN')
      .expect(200);

    // Segundo intento debe dar 404
    await request(app)
      .delete(`/api/extinguishers/${ext.id}`)
      .set('x-user-role', 'ADMIN')
      .expect(404);
  });
});
