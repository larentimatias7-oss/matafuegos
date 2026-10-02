import { describe, it, expect } from 'vitest';
const request = require('supertest');
const { app } = require('../../server/index');

describe('API Integration: Autenticación y Control de Acceso (RBAC)', () => {

  it('debe responder 401 si se envían credenciales inválidas o anónimas', async () => {
    const res = await request(app)
      .get('/api/extinguishers')
      .set('authorization', 'Bearer invalid_token')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('No autorizado');
  });

  it('debe responder 403 Forbidden si rol LECTURA intenta registrar una inspección', async () => {
    const res = await request(app)
      .post('/api/inspections')
      .set('x-user-role', 'LECTURA')
      .send({
        extinguisher_code: 'MF-001',
        check_location: 1
      })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('no tiene permisos suficientes');
  });

  it('debe responder 403 Forbidden si rol INSPECTOR intenta eliminar un extintor (Operación solo Admin)', async () => {
    const res = await request(app)
      .delete('/api/extinguishers/1')
      .set('x-user-role', 'INSPECTOR')
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('ADMIN');
  });

  it('debe responder 403 Forbidden si rol INSPECTOR intenta modificar configuraciones globales', async () => {
    const res = await request(app)
      .post('/api/m365/settings')
      .set('x-user-role', 'INSPECTOR')
      .send({ company_name: 'Hack' })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('ADMIN');
  });

  it('debe permitir lectura a un usuario con rol LECTURA', async () => {
    const res = await request(app)
      .get('/api/extinguishers')
      .set('x-user-role', 'LECTURA')
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
