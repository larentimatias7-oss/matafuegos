/**
 * Milicic FireControl 365 - Matriz Centralizada de Roles y Permisos (RBAC)
 * Fuente única de verdad para autorización en toda la aplicación.
 */

const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  INSPECTOR: 'INSPECTOR',
  AUDITOR: 'AUDITOR'
};

// Jerarquía numérica estricta para control de escalada de privilegios
// Un actor solo puede crear, invitar o modificar usuarios con rango estrictamente MENOR al propio.
const ROLE_HIERARCHY = {
  [ROLES.SUPERADMIN]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.SUPERVISOR]: 60,
  [ROLES.INSPECTOR]: 40,
  [ROLES.AUDITOR]: 20
};

// Definición exhaustiva de permisos del sistema
const PERMISOS = {
  // Gestión de Usuarios y Accesos
  USUARIO_VER: 'usuario:ver',
  USUARIO_CREAR: 'usuario:crear',
  USUARIO_EDITAR: 'usuario:editar',
  USUARIO_DESACTIVAR: 'usuario:desactivar',
  USUARIO_ELIMINAR: 'usuario:eliminar',
  USUARIO_INVITAR: 'usuario:invitar',
  USUARIO_EDITAR_ALCANCE: 'usuario:editar_alcance',
  
  // Sesiones y Dispositivos
  SESION_VER: 'sesion:ver',
  SESION_REVOCAR: 'sesion:revocar',
  DISPOSITIVO_AUTORIZAR: 'dispositivo:autorizar',
  
  // Auditoría y Configuración
  AUDITORIA_VER: 'auditoria:ver',
  AUDITORIA_EXPORTAR: 'auditoria:exportar',
  CONFIG_GESTIONAR: 'config:gestionar',
  BACKUP_GESTIONAR: 'backup:gestionar',

  // Inventario de Extintores
  INVENTARIO_VER: 'inventario:ver',
  INVENTARIO_CREAR: 'inventario:crear',
  INVENTARIO_EDITAR: 'inventario:editar',
  INVENTARIO_ELIMINAR: 'inventario:eliminar',
  QR_IMPRIMIR: 'qr:imprimir',

  // Rondas de Inspección
  RONDA_VER: 'ronda:ver',
  RONDA_ABRIR_CERRAR: 'ronda:abrir_cerrar',
  RONDA_REABRIR: 'ronda:reabrir',
  RONDA_ASIGNAR: 'ronda:asignar',

  // Inspecciones y Antifraude
  INSPECCION_CREAR: 'inspeccion:crear',
  INSPECCION_VER: 'inspeccion:ver',
  INSPECCION_REVISAR_SOSPECHOSAS: 'inspeccion:revisar_sospechosas',

  // Casos y Anomalías
  CASO_VER: 'caso:ver',
  CASO_CREAR: 'caso:crear',
  CASO_EDITAR: 'caso:editar',
  CASO_ASIGNAR: 'caso:asignar',

  // Checklists y Plantillas
  CHECKLIST_GESTIONAR: 'checklist:gestionar',

  // Reportes e Integración Excel
  REPORTE_EXPORTAR: 'reporte:exportar',
  REPORTE_IMPORTAR: 'reporte:importar',
  DASHBOARD_VER: 'dashboard:ver'
};

// Matriz de Rol -> Permisos
const ROLE_PERMISSIONS = {
  [ROLES.SUPERADMIN]: Object.values(PERMISOS), // Acceso total a todos los módulos

  [ROLES.ADMIN]: [
    PERMISOS.USUARIO_VER,
    PERMISOS.USUARIO_INVITAR,
    PERMISOS.USUARIO_EDITAR,
    PERMISOS.USUARIO_DESACTIVAR,
    PERMISOS.USUARIO_ELIMINAR,
    PERMISOS.USUARIO_EDITAR_ALCANCE,
    PERMISOS.SESION_VER,
    PERMISOS.SESION_REVOCAR,
    PERMISOS.DISPOSITIVO_AUTORIZAR,
    PERMISOS.AUDITORIA_VER,
    PERMISOS.AUDITORIA_EXPORTAR,
    PERMISOS.INVENTARIO_VER,
    PERMISOS.INVENTARIO_CREAR,
    PERMISOS.INVENTARIO_EDITAR,
    PERMISOS.INVENTARIO_ELIMINAR,
    PERMISOS.QR_IMPRIMIR,
    PERMISOS.RONDA_VER,
    PERMISOS.RONDA_ABRIR_CERRAR,
    PERMISOS.RONDA_ASIGNAR,
    PERMISOS.INSPECCION_CREAR,
    PERMISOS.INSPECCION_VER,
    PERMISOS.INSPECCION_REVISAR_SOSPECHOSAS,
    PERMISOS.CASO_VER,
    PERMISOS.CASO_CREAR,
    PERMISOS.CASO_EDITAR,
    PERMISOS.CASO_ASIGNAR,
    PERMISOS.CHECKLIST_GESTIONAR,
    PERMISOS.REPORTE_EXPORTAR,
    PERMISOS.REPORTE_IMPORTAR,
    PERMISOS.DASHBOARD_VER
  ],

  [ROLES.SUPERVISOR]: [
    PERMISOS.USUARIO_VER,
    PERMISOS.INVENTARIO_VER,
    PERMISOS.QR_IMPRIMIR,
    PERMISOS.RONDA_VER,
    PERMISOS.RONDA_ABRIR_CERRAR,
    PERMISOS.RONDA_REABRIR,
    PERMISOS.RONDA_ASIGNAR,
    PERMISOS.INSPECCION_CREAR,
    PERMISOS.INSPECCION_VER,
    PERMISOS.INSPECCION_REVISAR_SOSPECHOSAS,
    PERMISOS.CASO_VER,
    PERMISOS.CASO_CREAR,
    PERMISOS.CASO_EDITAR,
    PERMISOS.CASO_ASIGNAR,
    PERMISOS.REPORTE_EXPORTAR,
    PERMISOS.DASHBOARD_VER
  ],

  [ROLES.INSPECTOR]: [
    PERMISOS.INVENTARIO_VER,
    PERMISOS.RONDA_VER,
    PERMISOS.INSPECCION_CREAR,
    PERMISOS.INSPECCION_VER,
    PERMISOS.CASO_VER,
    PERMISOS.CASO_CREAR,
    PERMISOS.CASO_EDITAR,
    PERMISOS.REPORTE_EXPORTAR,
    PERMISOS.DASHBOARD_VER
  ],

  [ROLES.AUDITOR]: [
    PERMISOS.INVENTARIO_VER,
    PERMISOS.RONDA_VER,
    PERMISOS.INSPECCION_VER,
    PERMISOS.CASO_VER,
    PERMISOS.AUDITORIA_VER,
    PERMISOS.REPORTE_EXPORTAR,
    PERMISOS.DASHBOARD_VER
  ]
};

/**
 * Verifica si un rol tiene un permiso determinado.
 * @param {string} role
 * @param {string} permissionCode
 * @returns {boolean}
 */
function hasPermission(role, permissionCode) {
  if (!role || !permissionCode) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permissionCode);
}

/**
 * Regla de jerarquía: determina si un usuario con rol `actorRole` puede gestionar o asignar `targetRole`.
 * Debe ser estrictamente mayor, salvo que actorRole sea SUPERADMIN y targetRole sea SUPERADMIN (para otros admins).
 * @param {string} actorRole
 * @param {string} targetRole
 * @returns {boolean}
 */
function canManageRole(actorRole, targetRole) {
  const actorRank = ROLE_HIERARCHY[actorRole] || 0;
  const targetRank = ROLE_HIERARCHY[targetRole] || 0;
  if (actorRole === ROLES.SUPERADMIN) {
    return true; // Superadmin puede gestionar cualquier rol
  }
  return actorRank > targetRank;
}

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  PERMISOS,
  ROLE_PERMISSIONS,
  hasPermission,
  canManageRole
};
