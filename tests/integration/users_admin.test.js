import { describe, it, expect, beforeAll } from 'vitest';
const request = require('supertest');
const { app } = require('../../server/index');
const { db } = require('../../server/db');
const { ROLES } = require('../../server/config/permissions');
const { hashPassword } = require('../../server/services/authService');

describe('FASE 4: API Integration - Gestión de Usuarios y Auditoría (RBAC)', () => {
  const superadminEmail = 'superadmin.test@milicic.com.ar';
  const adminEmail = 'admin.test@milicic.com.ar';
  const inspectorEmail = 'inspector.test@milicic.com.ar';
  let superadminId, adminId, inspectorId;

  beforeAll(async () => {
    const crypto = require('crypto');
    const dummyHash = await hashPassword('SuperTest2026!');

    // Superadmin
    let superUser = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(superadminEmail);
    if (!superUser) {
      superadminId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO usuarios (id, organizacion_id, nombre, apellido, email, password_hash, rol, activo)
        VALUES (?, 1, 'Super', 'Admin', ?, ?, 'SUPERADMIN', 1)
      `).run(superadminId, superadminEmail, dummyHash);
    } else {
      superadminId = superUser.id;
      db.prepare('UPDATE usuarios SET rol = ?, activo = 1 WHERE id = ?').run(ROLES.SUPERADMIN, superadminId);
    }

    // Admin
    let adminUser = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(adminEmail);
    if (!adminUser) {
      adminId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO usuarios (id, organizacion_id, nombre, apellido, email, password_hash, rol, activo)
        VALUES (?, 1, 'Jefe', 'HyS', ?, ?, 'ADMIN', 1)
      `).run(adminId, adminEmail, dummyHash);
    } else {
      adminId = adminUser.id;
      db.prepare('UPDATE usuarios SET rol = ?, activo = 1 WHERE id = ?').run(ROLES.ADMIN, adminId);
    }

    // Inspector
    let inspUser = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(inspectorEmail);
    if (!inspUser) {
      inspectorId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO usuarios (id, organizacion_id, nombre, apellido, email, password_hash, rol, activo)
        VALUES (?, 1, 'Juan', 'Inspector', ?, ?, 'INSPECTOR', 1)
      `).run(inspectorId, inspectorEmail, dummyHash);
    } else {
      inspectorId = inspUser.id;
      db.prepare('UPDATE usuarios SET rol = ?, activo = 1 WHERE id = ?').run(ROLES.INSPECTOR, inspectorId);
    }
  });

  it('debe responder 403 si un INSPECTOR intenta listar usuarios', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('x-user-role', ROLES.INSPECTOR)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('permisos suficientes');
  });

  it('debe permitir a un ADMIN listar usuarios de la organización', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('x-user-role', ROLES.ADMIN)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('debe permitir a ADMIN crear un usuario con rol inferior (INSPECTOR)', async () => {
    const newUserEmail = `operario.nuevo.${Date.now()}@milicic.com.ar`;
    const res = await request(app)
      .post('/api/users')
      .set('x-user-role', ROLES.ADMIN)
      .set('x-user-id', adminId)
      .send({
        nombre: 'Carlos',
        apellido: 'Pérez',
        email: newUserEmail,
        rol: ROLES.INSPECTOR,
        sectores: [{ sector: 'Piso 1 - Oficinas Administrativas' }]
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(newUserEmail);

    const userInDb = db.prepare('SELECT id, rol FROM usuarios WHERE email = ?').get(newUserEmail);
    expect(userInDb).toBeDefined();
    expect(userInDb.rol).toBe(ROLES.INSPECTOR);

    // Verificar sector asignado
    const sectors = db.prepare('SELECT sector FROM usuarios_sectores WHERE usuario_id = ?').all(userInDb.id);
    expect(sectors.length).toBe(1);
    expect(sectors[0].sector).toContain('Piso 1');
  });

  it('debe rechazar (403) si un ADMIN intenta crear un SUPERADMIN (Regla de techo jerárquico)', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('x-user-role', ROLES.ADMIN)
      .set('x-user-id', adminId)
      .send({
        nombre: 'Intento',
        apellido: 'Escalada',
        email: 'hacker@milicic.com.ar',
        rol: ROLES.SUPERADMIN
      })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Privilegios insuficientes');
  });

  it('debe rechazar (403) si un usuario intenta modificar su propio rol (Anti-Auto-Elevación)', async () => {
    const res = await request(app)
      .put(`/api/users/${adminId}`)
      .set('x-user-role', ROLES.ADMIN)
      .set('x-user-id', adminId)
      .send({
        rol: ROLES.SUPERADMIN
      })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('no puede modificar su propio rol');
  });

  it('debe rechazar la desactivación o degradación del último Superadmin activo', async () => {
    // Buscar superadmins activos
    const superadmins = db.prepare("SELECT id FROM usuarios WHERE rol = 'SUPERADMIN' AND activo = 1").all();
    
    // Si hay más de uno, dejamos solo uno activo para la prueba
    if (superadmins.length > 1) {
      for (let i = 1; i < superadmins.length; i++) {
        db.prepare('UPDATE usuarios SET activo = 0 WHERE id = ?').run(superadmins[i].id);
      }
    }

    const singleSuperadmin = db.prepare("SELECT id FROM usuarios WHERE rol = 'SUPERADMIN' AND activo = 1").get();

    // Intentar desactivar al único superadmin
    const res = await request(app)
      .put(`/api/users/${singleSuperadmin.id}`)
      .set('x-user-role', ROLES.SUPERADMIN)
      .set('x-user-id', 'dummy-superadmin-session')
      .send({
        activo: false
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('único Superadmin activo');

    // Restaurar los superadmins desactivados para el resto del sistema
    for (const sa of superadmins) {
      db.prepare('UPDATE usuarios SET activo = 1 WHERE id = ?').run(sa.id);
    }
  });

  it('debe registrar todas las mutaciones en la tabla append-only de auditoría', async () => {
    const res = await request(app)
      .get('/api/audit')
      .set('x-user-role', ROLES.SUPERADMIN)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const firstEvent = res.body.data[0];
    expect(firstEvent.accion).toBeDefined();
    expect(firstEvent.fecha).toBeDefined();
  });

  it('debe permitir exportar la auditoría en formato Excel .xlsx', async () => {
    const res = await request(app)
      .get('/api/audit/export')
      .set('x-user-role', ROLES.ADMIN)
      .buffer(true)
      .parse((res, callback) => {
        const data = [];
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(data)));
      })
      .expect(200);

    expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(100);
  });
});
