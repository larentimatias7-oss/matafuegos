import { describe, it, expect, beforeAll } from 'vitest';
const request = require('supertest');
const { app } = require('../../server/index');
const { db } = require('../../server/db');
const { hashPassword, createSession } = require('../../server/services/authService');
const { ROLES } = require('../../server/config/permissions');

describe('FASE 6 & 7: Seguridad, IDOR, Alcance Sectorial y Multi-Organización', () => {
  let scopedUser;
  let scopedCookie;
  let org2ExtId;
  let floor1Ext;
  let floor4Ext;

  beforeAll(async () => {
    // 1. Obtener extintores en diferentes pisos
    floor1Ext = db.prepare("SELECT * FROM extinguishers WHERE floor LIKE '%Planta Baja%' AND organizacion_id = 1 LIMIT 1").get();
    floor4Ext = db.prepare("SELECT * FROM extinguishers WHERE floor NOT LIKE '%Planta Baja%' AND organizacion_id = 1 LIMIT 1").get();

    // 2. Crear usuario Inspector acotado únicamente a Planta Baja
    const passHash = await hashPassword('Mili2026!Seguro');
    const insertUser = db.prepare(`
      INSERT INTO usuarios (id, organizacion_id, nombre, apellido, email, origen, password_hash, rol, activo)
      VALUES ('33333333-3333-4333-8333-333333333333', 1, 'Marcos', 'Paz', 'marcos.paz@milicic.com.ar', 'local', ?, 'INSPECTOR', 1)
      ON CONFLICT(id) DO UPDATE SET activo = 1, rol = 'INSPECTOR'
    `);
    insertUser.run(passHash);
    scopedUser = db.prepare("SELECT * FROM usuarios WHERE id = '33333333-3333-4333-8333-333333333333'").get();

    // Asignar sector exclusivo "Planta Baja"
    db.prepare("DELETE FROM usuarios_sectores WHERE usuario_id = ?").run(scopedUser.id);
    db.prepare("INSERT INTO usuarios_sectores (usuario_id, sector, piso, edificio) VALUES (?, 'Planta Baja', 'Planta Baja', 'Edificio Central')").run(scopedUser.id);

    // Crear sesión para el inspector acotado
    const session = createSession(db, { usuario_id: scopedUser.id });
    scopedCookie = `firecontrol_session=${session.sessionId}`;

    // 3. Crear Organización 2 con su propio extintor
    db.prepare("INSERT OR IGNORE INTO organizaciones (id, nombre, activa) VALUES (2, 'Empresa Subcontratista B', 1)").run();
    db.prepare("DELETE FROM extinguishers WHERE code = 'MF-ORG2-999'").run();
    const insertOrg2Ext = db.prepare(`
      INSERT INTO extinguishers (
        organizacion_id, code, public_id, type, capacity, location, area, floor, building,
        expiration_charge, expiration_ph, status
      ) VALUES (
        2, 'MF-ORG2-999', 'org2secretid999', 'CO2', '5 kg', 'Obrador Externo', 'Zona Norte', 'PB', 'Obrador',
        '2027-01-01', '2030-01-01', 'OPERATIVO'
      )
    `);
    const org2Res = insertOrg2Ext.run();
    org2ExtId = org2Res.lastInsertRowid;
  });

  describe('1. Protección IDOR y Control de Alcance Sectorial (Sectores / Pisos)', () => {
    it('el inspector acotado solo debe ver extintores de su sector asignado en GET /api/extinguishers', async () => {
      const res = await request(app)
        .get('/api/extinguishers')
        .set('Cookie', scopedCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Todos los extintores devueltos deben pertenecer a su alcance
      for (const ext of res.body.data) {
        const matchesScope = ext.floor.includes('Planta Baja') || ext.location.includes('Planta Baja') || ext.area.includes('Planta Baja');
        expect(matchesScope).toBe(true);
      }
    });

    it('debe permitir al inspector consultar la ficha de un extintor DENTRO de su alcance', async () => {
      const res = await request(app)
        .get(`/api/extinguishers/${floor1Ext.code}`)
        .set('Cookie', scopedCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe(floor1Ext.code);
    });

    it('debe RECHAZAR con 403 Forbidden cuando el inspector intenta acceder a un extintor FUERA de su alcance', async () => {
      const res = await request(app)
        .get(`/api/extinguishers/${floor4Ext.code}`)
        .set('Cookie', scopedCookie)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('fuera de su sector');
    });

    it('debe RECHAZAR con 403 Forbidden cuando el inspector intenta registrar una inspección en un extintor FUERA de su sector', async () => {
      const res = await request(app)
        .post('/api/inspections')
        .set('Cookie', scopedCookie)
        .send({
          extinguisher_id: floor4Ext.id,
          check_location: 1,
          check_pressure: 1,
          check_seal: 1,
          check_physical: 1,
          check_signage: 1,
          check_card: 1
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('fuera de su sector operativo');
    });
  });

  describe('2. Aislamiento Multi-Organización (Multi-Tenancy)', () => {
    it('un usuario de la organización 1 no puede ver extintores de la organización 2', async () => {
      const res = await request(app)
        .get('/api/extinguishers/MF-ORG2-999')
        .set('x-user-role', 'ADMIN') // Admin de Org 1
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('no encontrado');
    });

    it('un usuario de la organización 1 no puede modificar extintores de la organización 2', async () => {
      const res = await request(app)
        .put(`/api/extinguishers/${org2ExtId}`)
        .set('x-user-role', 'ADMIN') // Admin de Org 1
        .send({ location: 'Hackeado a Org 1' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Revocación Inmediata de Sesiones y Desactivación de Usuario', () => {
    it('un usuario desactivado pierde el acceso de inmediato sin esperar expiración de sesión', async () => {
      // Desactivar temporalmente el usuario
      db.prepare('UPDATE usuarios SET activo = 0 WHERE id = ?').run(scopedUser.id);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', scopedCookie)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('desactivado');

      // Restaurar estado activo
      db.prepare('UPDATE usuarios SET activo = 1 WHERE id = ?').run(scopedUser.id);
    });

    it('una sesión revocada queda invalidada de inmediato con 401', async () => {
      // Crear una nueva sesión efímera
      const ephemeralSession = createSession(db, { usuario_id: scopedUser.id });
      const ephemeralCookie = `firecontrol_session=${ephemeralSession.sessionId}`;

      // Verificar que es válida inicialmente
      const checkValid = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ephemeralCookie)
        .expect(200);
      expect(checkValid.body.authenticated).toBe(true);

      // Revocar la sesión
      db.prepare('UPDATE sesiones SET revocada = 1 WHERE id = ?').run(ephemeralSession.sessionId);

      // Ahora debe rechazar con 401
      const checkRevoked = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ephemeralCookie)
        .expect(401);
      expect(checkRevoked.body.success).toBe(false);
      expect(checkRevoked.body.error).toContain('revocada');
    });
  });

  describe('4. Protección Anti-Enumeración de Cuentas y Rate Limiting', () => {
    it('login debe responder con idéntico mensaje genérico si el correo no existe o si la clave es incorrecta', async () => {
      db.prepare("UPDATE usuarios SET activo = 1, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?").run(scopedUser.id);

      // Caso 1: Correo inexistente
      const resNonExistent = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inexistente999@milicic.com.ar', password: 'CualquierClave123' })
        .expect(401);

      // Caso 2: Correo existente pero clave incorrecta
      const resBadPass = await request(app)
        .post('/api/auth/login')
        .send({ email: scopedUser.email, password: 'ClaveIncorrecta123' })
        .expect(401);

      expect(resNonExistent.body.error).toBe('Credenciales inválidas o cuenta bloqueada temporalmente');
      expect(resBadPass.body.error).toBe('Credenciales inválidas o cuenta bloqueada temporalmente');
    });
  });
});
