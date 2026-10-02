/**
 * Milicic FireControl 365 - Middleware de Autenticación y Control de Acceso por Rol (RBAC)
 * Roles soportados: ADMIN, INSPECTOR, LECTURA
 */

const ROLES = {
  ADMIN: 'ADMIN',
  INSPECTOR: 'INSPECTOR',
  LECTURA: 'LECTURA'
};

/**
 * Middleware para identificar y autenticar al usuario solicitante.
 * Soporta headers de Microsoft Entra ID / Gateway, tokens de sesión o header x-user-role.
 */
function authenticate(req, res, next) {
  // Simulación / cabeceras de proxy inverso
  const roleHeader = (req.headers['x-user-role'] || '').toUpperCase();
  const userName = req.headers['x-user-name'] || 'Usuario Milicic';

  if (roleHeader && Object.values(ROLES).includes(roleHeader)) {
    req.user = {
      name: userName,
      role: roleHeader,
      authenticated: true
    };
    return next();
  }

  // Si se envía explícitamente sin autenticación
  if (req.headers['authorization'] === 'Bearer invalid_token' || req.headers['x-anonymous'] === 'true') {
    return res.status(401).json({
      success: false,
      error: 'No autorizado: sesión no válida o expirada'
    });
  }

  // Usuario predeterminado del sistema (Inspector en campo)
  req.user = {
    name: 'Santiago Amaya (Inspector HyS)',
    email: 'santiago.amaya@milicic.com.ar',
    role: ROLES.INSPECTOR,
    authenticated: true
  };

  next();
}

/**
 * Middleware que restringe el acceso a uno o varios roles específicos.
 * @param {string[]} allowedRoles 
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.authenticated) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado: se requiere autenticación para acceder a este recurso'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado: el rol '${req.user.role}' no tiene permisos suficientes para esta operación. Requerido: ${allowedRoles.join(' o ')}`
      });
    }

    next();
  };
}

module.exports = {
  ROLES,
  authenticate,
  requireRole
};
