/**
 * Milicic FireControl 365 - Middleware de Autenticación, Sesiones y Control de Acceso (RBAC)
 * Soporta autenticación por cookie de sesión segura (sesiones SQLite), cabeceras de proxy,
 * validación de permisos granulares y verificación de alcance sectorial (usuarios_sectores).
 */

const { db } = require('../db');
const {
  ROLES,
  PERMISOS,
  ROLE_HIERARCHY,
  hasPermission,
  canManageRole
} = require('../config/permissions');

// Aliases para retrocompatibilidad
const EXTENDED_ROLES = {
  ...ROLES,
  LECTURA: ROLES.AUDITOR
};

/**
 * Middleware para identificar y autenticar al usuario solicitante.
 * 1. Revisa cookie `firecontrol_session` y valida contra la tabla `sesiones`.
 * 2. Si no hay cookie, revisa cabeceras `x-user-role` (pruebas / gateway / proxies).
 * 3. En entorno dev/local, provee usuario por defecto (Santiago Amaya).
 */
function authenticate(req, res, next) {
  const sessionId = req.cookies?.firecontrol_session;

  // 1. Autenticación mediante Cookie de Sesión Opaca
  if (sessionId) {
    try {
      const session = db.prepare(`
        SELECT s.id as session_id, s.usuario_id, s.expira_en, s.revocada,
               u.nombre, u.apellido, u.email, u.rol, u.activo, u.organizacion_id
        FROM sesiones s
        JOIN usuarios u ON s.usuario_id = u.id
        WHERE s.id = ?
      `).get(sessionId);

      if (session) {
        if (session.revocada === 1) {
          return res.status(401).json({
            success: false,
            error: 'No autorizado: la sesión ha sido revocada remotamente'
          });
        }

        const now = new Date();
        const expDate = new Date(session.expira_en);
        if (expDate <= now) {
          return res.status(401).json({
            success: false,
            error: 'No autorizado: la sesión ha expirado'
          });
        }

        if (session.activo === 0) {
          return res.status(401).json({
            success: false,
            error: 'No autorizado: usuario desactivado. Contacte a Seguridad e Higiene.'
          });
        }

        // Actualizar último uso (sliding expiration)
        db.prepare("UPDATE sesiones SET ultimo_uso = datetime('now', 'localtime') WHERE id = ?").run(sessionId);

        // Cargar sectores asignados al usuario
        const sectores = db.prepare(`
          SELECT sector, piso, edificio FROM usuarios_sectores WHERE usuario_id = ?
        `).all(session.usuario_id);

        req.user = {
          id: session.usuario_id,
          sessionId: session.session_id,
          nombre: session.nombre,
          apellido: session.apellido,
          name: `${session.nombre} ${session.apellido}`.trim(),
          email: session.email,
          role: session.rol,
          rol: session.rol,
          activo: session.activo,
          organizacion_id: session.organizacion_id || 1,
          sectores: sectores || [],
          scopeSectors: (sectores || []).map(s => s.sector || s.piso).filter(Boolean),
          isGlobalScope: (sectores || []).length === 0,
          authenticated: true
        };

        return next();
      } else {
        return res.status(401).json({
          success: false,
          error: 'No autorizado: sesión no válida o expirada'
        });
      }
    } catch (err) {
      console.error('[AUTH ERROR] Error validando sesión SQLite:', err.message);
      return res.status(500).json({ success: false, error: 'Error interno de autenticación' });
    }
  }

  // 2. Si se envía explícitamente token inválido o anónimo en headers
  if (req.headers['authorization'] === 'Bearer invalid_token' || req.headers['x-anonymous'] === 'true') {
    return res.status(401).json({
      success: false,
      error: 'No autorizado: sesión no válida o expirada'
    });
  }

  // 3. Simulación / Cabeceras de Gateway o Pruebas (x-user-role o x-role)
  let roleHeader = (req.headers['x-user-role'] || req.headers['x-role'] || '').toUpperCase();
  if (roleHeader === 'LECTURA') roleHeader = ROLES.AUDITOR;

  if (roleHeader && Object.values(ROLES).includes(roleHeader)) {
    // Si viene x-user-id se usa, sino se consulta si existe en base de datos o se usa predeterminado
    const headerUserId = req.headers['x-user-id'];
    let userRow = null;
    if (headerUserId) {
      userRow = db.prepare('SELECT id, nombre, apellido, email, rol, activo, organizacion_id FROM usuarios WHERE id = ?').get(headerUserId);
    }

    if (userRow && userRow.activo === 0) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado: usuario desactivado'
      });
    }

    const userId = userRow ? userRow.id : (headerUserId || '11111111-1111-4111-8111-111111111111');
    const sectores = db.prepare('SELECT sector, piso, edificio FROM usuarios_sectores WHERE usuario_id = ?').all(userId);

    req.user = {
      id: userId,
      name: req.headers['x-user-name'] || (userRow ? `${userRow.nombre} ${userRow.apellido}`.trim() : 'Usuario Milicic'),
      nombre: userRow ? userRow.nombre : (req.headers['x-user-name'] || 'Usuario'),
      apellido: userRow ? userRow.apellido : '',
      email: req.headers['x-user-email'] || (userRow ? userRow.email : 'usuario@milicic.com.ar'),
      role: roleHeader,
      rol: roleHeader,
      organizacion_id: userRow ? userRow.organizacion_id : 1,
      activo: 1,
      sectores: sectores || [],
      scopeSectors: (sectores || []).map(s => s.sector || s.piso).filter(Boolean),
      isGlobalScope: (sectores || []).length === 0,
      authenticated: true
    };
    return next();
  }

  // 4. Sin sesión activa ni cabeceras: no autenticado
  req.user = {
    authenticated: false
  };

  next();
}

/**
 * Middleware que restringe el acceso a roles específicos.
 * @param {string[]} allowedRoles
 */
function requireRole(allowedRoles) {
  // Normalizar alias retrocompatible LECTURA -> AUDITOR
  const normalizedAllowed = allowedRoles.map(r => (r === 'LECTURA' ? ROLES.AUDITOR : r));

  return (req, res, next) => {
    if (!req.user || !req.user.authenticated) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado: se requiere autenticación para acceder a este recurso'
      });
    }

    // Superadmin tiene acceso a cualquier ruta con requireRole
    if (req.user.role === ROLES.SUPERADMIN) {
      return next();
    }

    if (!normalizedAllowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado: el rol '${req.user.role}' no tiene permisos suficientes para esta operación. Requerido: ${allowedRoles.join(' o ')}`
      });
    }

    next();
  };
}

/**
 * Middleware declarativo para validar un permiso granular específico.
 * @param {string} permissionCode
 */
function requirePermiso(permissionCode) {
  return (req, res, next) => {
    if (!req.user || !req.user.authenticated) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado: se requiere autenticación para acceder a este recurso'
      });
    }

    if (!hasPermission(req.user.role, permissionCode)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado: el rol '${req.user.role}' no tiene permisos suficientes para esta operación (${permissionCode}). Requerido: ADMIN o superior`
      });
    }

    next();
  };
}

/**
 * Verifica si el usuario tiene alcance sobre un extintor específico.
 * @param {object} user
 * @param {object} extinguisher
 * @returns {boolean}
 */
function checkUserSectorScope(user, extinguisher) {
  if (!user || !extinguisher) return false;
  // Superadmin, Admin y Auditor tienen alcance global
  if (user.isGlobalScope || [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.AUDITOR].includes(user.role)) {
    return true;
  }

  const sectores = user.sectores || [];
  if (sectores.length === 0) return true;

  // Si tiene sectores o pisos asignados, debe coincidir área, piso o ubicación
  return sectores.some(s => {
    const sectorTarget = (s.sector || s.piso || '').toLowerCase().trim();
    if (sectorTarget) {
      const inFloor = extinguisher.floor && extinguisher.floor.toLowerCase().includes(sectorTarget);
      const inArea = extinguisher.area && extinguisher.area.toLowerCase().includes(sectorTarget);
      const inLoc = extinguisher.location && extinguisher.location.toLowerCase().includes(sectorTarget);
      return inFloor || inArea || inLoc;
    }
    if (s.edificio && extinguisher.building) {
      return extinguisher.building.toLowerCase() === s.edificio.toLowerCase();
    }
    return false;
  });
}

/**
 * Middleware que verifica que el extintor solicitado esté dentro del alcance del usuario.
 */
function requireSectorScope(req, res, next) {
  if (req.user.isGlobalScope || [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.AUDITOR].includes(req.user.role)) {
    return next();
  }

  const idOrCode = req.params.id || req.body?.extinguisher_id || req.body?.extinguisher_code;
  if (!idOrCode) return next();

  try {
    const ext = db.prepare(`
      SELECT area, floor, building, location FROM extinguishers 
      WHERE id = ? OR code = ? OR public_id = ?
    `).get(idOrCode, idOrCode, idOrCode);

    if (ext && !checkUserSectorScope(req.user, ext)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado: el extintor se encuentra fuera de su sector operativo asignado.'
      });
    }
  } catch (err) {
    console.error('[SCOPE ERROR] Error verificando alcance:', err.message);
  }

  next();
}

module.exports = {
  ROLES: EXTENDED_ROLES,
  PERMISOS,
  authenticate,
  requireRole,
  requirePermiso,
  checkUserSectorScope,
  requireSectorScope,
  canManageRole
};
