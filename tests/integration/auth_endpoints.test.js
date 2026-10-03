import { describe, it, expect, beforeAll } from 'vitest';
const request = require('supertest');
const { app } = require('../../server/index');
const { db } = require('../../server/db');
const { hashPassword } = require('../../server/services/authService');
const { ROLES } = require('../../server/config/permissions');

describe('FASE 3: API Integration - Autenticación Híbrida y Sesiones Seguras', () => {
  const testUserEmail = 'operario.test@milicic.com.ar';
  const testPassword = 'PasswordSeguro123!';
  let testUserId;

  beforeAll(async () => {
    // Asegurar usuario de prueba local
    const existing = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(testUserEmail);
    if (existing) {
      testUserId = existing.id;
      const passHash = await hashPassword(testPassword);
      db.prepare(`
        UPDATE usuarios 
        SET password_hash = ?, intentos_fallidos = 0, bloqueado_hasta = NULL, activo = 1, rol = 'INSPECTOR'
        WHERE id = ?
      `).run(passHash, testUserId);
    } else {
      const crypto = require('crypto');
      testUserId = crypto.randomUUID();
      const passHash = await hashPassword(testPassword);
      db.prepare(`
        INSERT INTO usuarios (id, organizacion_id, nombre, apellido, email, password_hash, rol, activo)
        VALUES (?, 1, 'Operario', 'Test', ?, ?, 'INSPECTOR', 1)
      `).run(testUserId, testUserEmail, passHash);
    }
  });

  it('debe iniciar sesión localmente con credenciales válidas y emitir cookie HttpOnly segura', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: testPassword
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUserEmail);

    // Verificar cabecera set-cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const sessionCookie = cookies.find(c => c.includes('firecontrol_session='));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('SameSite=Lax');
  });

  it('debe rechazar credenciales inválidas con mensaje genérico y registrar intento fallido', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: 'ClaveIncorrecta123!'
      })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Credenciales inválidas');

    const userInDb = db.prepare('SELECT intentos_fallidos FROM usuarios WHERE id = ?').get(testUserId);
    expect(userInDb.intentos_fallidos).toBeGreaterThan(0);
  });

  it('debe bloquear temporalmente la cuenta tras 5 intentos fallidos consecutivos', async () => {
    // Forzar 5 intentos
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'ClaveErronea123!'
        });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: testPassword // Aun con la contraseña correcta debe estar bloqueado
      })
      .expect(423);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Cuenta bloqueada temporalmente');

    // Desbloquear para siguientes pruebas
    db.prepare('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?').run(testUserId);
  });

  it('debe revalidar la sesión vía GET /api/auth/me usando la cookie de sesión', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: testPassword
      })
      .expect(200);

    const sessionCookie = loginRes.headers['set-cookie'].find(c => c.includes('firecontrol_session='));

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(meRes.body.authenticated).toBe(true);
    expect(meRes.body.user.email).toBe(testUserEmail);
  });

  it('debe permitir configurar PIN de 4-6 dígitos y realizar cambio rápido de usuario (shared device)', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: testPassword
      })
      .expect(200);

    const sessionCookie = loginRes.headers['set-cookie'].find(c => c.includes('firecontrol_session='));

    // Configurar PIN
    const pinRes = await request(app)
      .post('/api/auth/set-pin')
      .set('Cookie', sessionCookie)
      .send({ pin: '4826' })
      .expect(200);

    expect(pinRes.body.success).toBe(true);

    // Ejecutar PIN switch desde un dispositivo compartido
    const switchRes = await request(app)
      .post('/api/auth/pin-switch')
      .send({
        usuario_id: testUserId,
        pin: '4826'
      })
      .expect(200);

    expect(switchRes.body.success).toBe(true);
    expect(switchRes.body.user.id).toBe(testUserId);
  });

  it('debe revocar la sesión y limpiar la cookie en logout', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: testPassword
      })
      .expect(200);

    const sessionCookie = loginRes.headers['set-cookie'].find(c => c.includes('firecontrol_session='));

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(logoutRes.body.success).toBe(true);

    // Intentar acceder con la sesión recién revocada debe fallar
    const meAfterLogout = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie)
      .expect(401);

    expect(meAfterLogout.body.error).toContain('revocada');
  });

  it('debe aprovisionar JIT usuarios con dominio @milicic.com.ar en Entra ID y rechazar dominios no autorizados', async () => {
    // Dominio corporativo válido
    const entraRes = await request(app)
      .post('/api/auth/entra/mock-login')
      .send({
        email: 'nuevo.inspector@milicic.com.ar',
        nombre: 'Nuevo',
        apellido: 'Inspector',
        roles: ['Milicic-HyS-Admins']
      })
      .expect(200);

    expect(entraRes.body.success).toBe(true);
    expect(entraRes.body.user.role).toBe(ROLES.ADMIN);

    // Dominio externo no corporativo rechazado
    const unauthorizedRes = await request(app)
      .post('/api/auth/entra/mock-login')
      .send({
        email: 'hacker@gmail.com',
        nombre: 'Hacker',
        apellido: 'Externo'
      })
      .expect(400);

    expect(unauthorizedRes.body.success).toBe(false);
    expect(unauthorizedRes.body.error).toContain('no está autorizado');
  });
});
