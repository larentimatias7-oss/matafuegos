/**
 * Milicic FireControl 365 - Rutas de Administración de Usuarios (RBAC)
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../db');
const {
  authenticate,
  requirePermiso,
  canManageRole,
  ROLES,
  PERMISOS
} = require('../middleware/auth');
const {
  hashPassword,
  validatePasswordStrength,
  revokeAllUserSessions,
  revokeSession
} = require('../services/authService');
const { recordAudit } = require('../services/auditService');
const { validateBody, UserCreateSchema, UserUpdateSchema } = require('../validators/schemas');

router.use(authenticate);

/**
 * Valida que no se degrade ni desactive al último Superadmin activo.
 */
function verifyNotLastSuperadmin(targetUserId, newRole, newActivo) {
  const targetUser = db.prepare('SELECT rol, activo FROM usuarios WHERE id = ?').get(targetUserId);
  if (!targetUser) return;

  if (targetUser.rol === ROLES.SUPERADMIN && targetUser.activo === 1) {
    const isDemoting = newRole !== undefined && newRole !== ROLES.SUPERADMIN;
    const isDeactivating = newActivo !== undefined && (newActivo === 0 || newActivo === false);

    if (isDemoting || isDeactivating) {
      const activeSuperadmins = db.prepare(`
        SELECT COUNT(*) as c FROM usuarios WHERE rol = ? AND activo = 1
      `).get(ROLES.SUPERADMIN).c;

      if (activeSuperadmins <= 1) {
        throw new Error('Operación denegada: No es posible desactivar ni degradar al único Superadmin activo del sistema.');
      }
    }
  }
}

// 1. GET /api/users - Listado de usuarios con filtros
router.get('/', requirePermiso(PERMISOS.USUARIO_VER), (req, res) => {
  const { search, rol, activo, origen, sector } = req.query;

  try {
    let query = `
      SELECT u.id, u.nombre, u.apellido, u.email, u.rol, u.activo, u.origen,
             u.ultimo_acceso, u.creado_en, u.debe_cambiar_password,
             (CASE WHEN u.pin_hash IS NOT NULL THEN 1 ELSE 0 END) as has_pin,
             (SELECT COUNT(*) FROM sesiones s WHERE s.usuario_id = u.id AND s.revocada = 0 AND s.expira_en > datetime('now', 'localtime')) as active_sessions
      FROM usuarios u
      WHERE u.organizacion_id = ?
    `;
    const params = [req.user.organizacion_id || 1];

    if (search) {
      query += ` AND (u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (rol) {
      query += ` AND u.rol = ?`;
      params.push(rol);
    }

    if (activo !== undefined && activo !== '') {
      query += ` AND u.activo = ?`;
      params.push(activo === 'true' || activo === '1' ? 1 : 0);
    }

    if (origen) {
      query += ` AND u.origen = ?`;
      params.push(origen);
    }

    query += ` ORDER BY u.activo DESC, u.nombre ASC`;

    const users = db.prepare(query).all(...params);

    // Adjuntar sectores asignados a cada usuario
    const userIds = users.map(u => u.id);
    const sectorsMap = new Map();
    if (userIds.length > 0) {
      const allSectors = db.prepare(`
        SELECT usuario_id, sector, piso, edificio FROM usuarios_sectores
      `).all();
      for (const s of allSectors) {
        if (!sectorsMap.has(s.usuario_id)) sectorsMap.set(s.usuario_id, []);
        sectorsMap.get(s.usuario_id).push(s);
      }
    }

    let result = users.map(u => ({
      ...u,
      activo: !!u.activo,
      debe_cambiar_password: !!u.debe_cambiar_password,
      has_pin: !!u.has_pin,
      sectores: sectorsMap.get(u.id) || []
    }));

    if (sector) {
      result = result.filter(u => 
        u.sectores.some(s => s.sector && s.sector.toLowerCase().includes(sector.toLowerCase()))
      );
    }

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[USERS LIST ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al listar usuarios' });
  }
});

// 2. GET /api/users/:id - Detalle completo de usuario
router.get('/:id', requirePermiso(PERMISOS.USUARIO_VER), (req, res) => {
  const { id } = req.params;

  try {
    const user = db.prepare(`
      SELECT id, organizacion_id, nombre, apellido, email, rol, activo, origen,
             ultimo_acceso, creado_en, desactivado_en, debe_cambiar_password,
             (CASE WHEN pin_hash IS NOT NULL THEN 1 ELSE 0 END) as has_pin
      FROM usuarios 
      WHERE id = ? AND organizacion_id = ?
    `).get(id, req.user.organizacion_id || 1);

    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const sectores = db.prepare('SELECT id, sector, piso, edificio FROM usuarios_sectores WHERE usuario_id = ?').all(id);
    const sesiones = db.prepare(`
      SELECT id, dispositivo, ip, user_agent, creada_en, ultimo_uso, expira_en, revocada
      FROM sesiones 
      WHERE usuario_id = ? AND revocada = 0 AND expira_en > datetime('now', 'localtime')
      ORDER BY ultimo_uso DESC
    `).all(id);

    const ultimasInspecciones = db.prepare(`
      SELECT id, extinguisher_code, inspection_date, passed, is_suspicious, created_at
      FROM inspections
      WHERE usuario_id = ?
      ORDER BY id DESC
      LIMIT 10
    `).all(id);

    const historialCambios = db.prepare(`
      SELECT id, fecha, usuario_nombre_snapshot, accion, datos_antes, datos_despues
      FROM auditoria
      WHERE entidad = 'usuario' AND entidad_id = ?
      ORDER BY id DESC
      LIMIT 15
    `).all(id);

    return res.json({
      success: true,
      data: {
        ...user,
        activo: !!user.activo,
        has_pin: !!user.has_pin,
        sectores,
        sesiones,
        ultimasInspecciones,
        historialCambios
      }
    });
  } catch (err) {
    console.error('[USER DETAIL ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al obtener usuario' });
  }
});

// 3. POST /api/users - Creación directa o invitación de usuario
router.post('/', requirePermiso(PERMISOS.USUARIO_INVITAR), validateBody(UserCreateSchema), async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    rol = ROLES.INSPECTOR,
    password,
    sectores = []
  } = req.body;

  if (!nombre || !apellido || !email) {
    return res.status(400).json({ success: false, error: 'Nombre, apellido y correo electrónico son obligatorios.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Regla de anti-escalada jerárquica
  if (!canManageRole(req.user.role, rol)) {
    return res.status(403).json({
      success: false,
      error: `Privilegios insuficientes: su rol '${req.user.role}' no puede asignar el rol '${rol}'.`
    });
  }

  try {
    const existing = db.prepare('SELECT id FROM usuarios WHERE organizacion_id = ? AND email = ?').get(req.user.organizacion_id || 1, normalizedEmail);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Ya existe un usuario registrado con este correo en la organización.' });
    }

    const newUserId = crypto.randomUUID();
    let passHash = null;
    let mustChangePassword = 1;

    if (password) {
      const passCheck = validatePasswordStrength(password);
      if (!passCheck.valid) {
        return res.status(400).json({ success: false, error: passCheck.error });
      }
      passHash = await hashPassword(password);
    } else {
      // Contraseña temporal autogenerada
      const tempPass = `Milicic.${crypto.randomBytes(4).toString('hex')}!`;
      passHash = await hashPassword(tempPass);
    }

    db.prepare(`
      INSERT INTO usuarios (
        id, organizacion_id, nombre, apellido, email, origen, password_hash, rol,
        activo, debe_cambiar_password, creado_por
      ) VALUES (
        ?, ?, ?, ?, ?, 'local', ?, ?,
        1, ?, ?
      )
    `).run(
      newUserId,
      req.user.organizacion_id || 1,
      nombre.trim(),
      apellido.trim(),
      normalizedEmail,
      passHash,
      rol,
      mustChangePassword,
      req.user.id
    );

    // Asignar sectores si fueron enviados
    if (Array.isArray(sectores) && sectores.length > 0) {
      const insertSector = db.prepare(`
        INSERT INTO usuarios_sectores (usuario_id, sector, piso, edificio)
        VALUES (?, ?, ?, ?)
      `);
      for (const s of sectores) {
        insertSector.run(newUserId, s.sector || null, s.piso || null, s.edificio || null);
      }
    }

    recordAudit(db, {
      usuario_id: req.user.id,
      usuario_nombre_snapshot: req.user.name,
      accion: 'CREAR_USUARIO',
      entidad: 'usuario',
      entidad_id: newUserId,
      datos_despues: { nombre, apellido, email: normalizedEmail, rol, sectores },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: { id: newUserId, email: normalizedEmail, rol }
    });
  } catch (err) {
    console.error('[CREATE USER ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al registrar usuario' });
  }
});

// 4. PUT /api/users/:id - Modificación de datos, rol, estado y sectores
router.put('/:id', requirePermiso(PERMISOS.USUARIO_EDITAR), validateBody(UserUpdateSchema), (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, rol, activo, sectores } = req.body;

  try {
    const targetUser = db.prepare('SELECT * FROM usuarios WHERE id = ? AND organizacion_id = ?').get(id, req.user.organizacion_id || 1);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // Regla de no auto-elevación ni auto-modificación de rol
    if (id === req.user.id && rol && rol !== req.user.role) {
      return res.status(403).json({
        success: false,
        error: 'Por razones de seguridad no puede modificar su propio rol.'
      });
    }

    // Regla jerárquica: no se puede gestionar a alguien con rol >= al propio
    if (req.user.role !== ROLES.SUPERADMIN && !canManageRole(req.user.role, targetUser.rol)) {
      return res.status(403).json({
        success: false,
        error: `No tiene privilegios para modificar a un usuario con rol '${targetUser.rol}'.`
      });
    }

    // Regla jerárquica: no se puede asignar un rol >= al propio
    if (rol && rol !== targetUser.rol && !canManageRole(req.user.role, rol)) {
      return res.status(403).json({
        success: false,
        error: `No tiene privilegios para asignar el rol '${rol}'.`
      });
    }

    // Proteger al último Superadmin activo
    verifyNotLastSuperadmin(id, rol, activo);

    const oldValues = {
      nombre: targetUser.nombre,
      apellido: targetUser.apellido,
      rol: targetUser.rol,
      activo: targetUser.activo
    };

    const updatedNombre = nombre !== undefined ? nombre.trim() : targetUser.nombre;
    const updatedApellido = apellido !== undefined ? apellido.trim() : targetUser.apellido;
    const updatedRol = rol !== undefined ? rol : targetUser.rol;
    const updatedActivo = activo !== undefined ? (activo ? 1 : 0) : targetUser.activo;
    const desactivadoEn = updatedActivo === 0 ? new Date().toISOString().replace('T', ' ').substring(0, 19) : null;

    db.prepare(`
      UPDATE usuarios 
      SET nombre = ?, apellido = ?, rol = ?, activo = ?, desactivado_en = ?
      WHERE id = ?
    `).run(updatedNombre, updatedApellido, updatedRol, updatedActivo, desactivadoEn, id);

    // Si el usuario fue desactivado, revocar de inmediato todas sus sesiones activas
    if (updatedActivo === 0) {
      revokeAllUserSessions(db, id);
    }

    // Actualizar sectores si se proveyeron
    if (Array.isArray(sectores)) {
      db.prepare('DELETE FROM usuarios_sectores WHERE usuario_id = ?').run(id);
      const insertSector = db.prepare(`
        INSERT INTO usuarios_sectores (usuario_id, sector, piso, edificio)
        VALUES (?, ?, ?, ?)
      `);
      for (const s of sectores) {
        insertSector.run(id, s.sector || null, s.piso || null, s.edificio || null);
      }
    }

    const newValues = {
      nombre: updatedNombre,
      apellido: updatedApellido,
      rol: updatedRol,
      activo: updatedActivo,
      sectores: sectores || []
    };

    recordAudit(db, {
      usuario_id: req.user.id,
      usuario_nombre_snapshot: req.user.name,
      accion: updatedActivo === 0 && oldValues.activo === 1 ? 'DESACTIVAR_USUARIO' : 'MODIFICAR_USUARIO',
      entidad: 'usuario',
      entidad_id: id,
      datos_antes: oldValues,
      datos_despues: newValues,
      req
    });

    return res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: newValues
    });
  } catch (err) {
    console.error('[UPDATE USER ERROR]', err);
    return res.status(400).json({ success: false, error: err.message || 'Error al actualizar usuario' });
  }
});

// 5. POST /api/users/:id/sessions/:sessionId/revoke - Revocación remota de sesión por un Admin
router.post('/:id/sessions/:sessionId/revoke', requirePermiso(PERMISOS.SESION_REVOCAR), (req, res) => {
  const { id, sessionId } = req.params;

  try {
    const session = db.prepare('SELECT id FROM sesiones WHERE id = ? AND usuario_id = ?').get(sessionId, id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesión no encontrada' });
    }

    revokeSession(db, sessionId);

    recordAudit(db, {
      usuario_id: req.user.id,
      usuario_nombre_snapshot: req.user.name,
      accion: 'REVOCAR_SESION_ADMIN',
      entidad: 'sesion',
      entidad_id: sessionId,
      datos_despues: { usuario_id: id },
      req
    });

    return res.json({ success: true, message: 'Sesión revocada exitosamente' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Error al revocar sesión' });
  }
});

module.exports = router;
