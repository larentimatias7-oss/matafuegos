import { describe, it, expect } from 'vitest';
const {
  ROLES,
  PERMISOS,
  ROLE_PERMISSIONS,
  hasPermission,
  canManageRole
} = require('../../server/config/permissions');
const { checkUserSectorScope } = require('../../server/middleware/auth');

describe('FASE 2: Matriz Centralizada de Roles y Permisos (RBAC)', () => {
  it('SUPERADMIN debe poseer todos los permisos del sistema sin excepción', () => {
    const allPerms = Object.values(PERMISOS);
    for (const p of allPerms) {
      expect(hasPermission(ROLES.SUPERADMIN, p)).toBe(true);
    }
  });

  it('ADMIN (Seguridad e Higiene) debe tener permisos operativos completos pero no gestión técnica de infraestructura', () => {
    expect(hasPermission(ROLES.ADMIN, PERMISOS.INVENTARIO_CREAR)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISOS.INVENTARIO_EDITAR)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISOS.INVENTARIO_ELIMINAR)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISOS.RONDA_ABRIR_CERRAR)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISOS.USUARIO_INVITAR)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISOS.REPORTE_EXPORTAR)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISOS.CONFIG_GESTIONAR)).toBe(false);
    expect(hasPermission(ROLES.ADMIN, PERMISOS.BACKUP_GESTIONAR)).toBe(false);
  });

  it('SUPERVISOR debe poder reabrir rondas y revisar sospechosas pero no invitar usuarios', () => {
    expect(hasPermission(ROLES.SUPERVISOR, PERMISOS.RONDA_REABRIR)).toBe(true);
    expect(hasPermission(ROLES.SUPERVISOR, PERMISOS.INSPECCION_REVISAR_SOSPECHOSAS)).toBe(true);
    expect(hasPermission(ROLES.SUPERVISOR, PERMISOS.CASO_ASIGNAR)).toBe(true);
    expect(hasPermission(ROLES.SUPERVISOR, PERMISOS.USUARIO_INVITAR)).toBe(false);
    expect(hasPermission(ROLES.SUPERVISOR, PERMISOS.INVENTARIO_ELIMINAR)).toBe(false);
  });

  it('INSPECTOR solo debe poder inspeccionar, abrir casos y ver su alcance operativo', () => {
    expect(hasPermission(ROLES.INSPECTOR, PERMISOS.INSPECCION_CREAR)).toBe(true);
    expect(hasPermission(ROLES.INSPECTOR, PERMISOS.CASO_CREAR)).toBe(true);
    expect(hasPermission(ROLES.INSPECTOR, PERMISOS.INVENTARIO_VER)).toBe(true);
    expect(hasPermission(ROLES.INSPECTOR, PERMISOS.INVENTARIO_ELIMINAR)).toBe(false);
    expect(hasPermission(ROLES.INSPECTOR, PERMISOS.USUARIO_VER)).toBe(false);
    expect(hasPermission(ROLES.INSPECTOR, PERMISOS.AUDITORIA_VER)).toBe(false);
  });

  it('AUDITOR debe tener permisos de solo lectura y descarga sin capacidad de mutación', () => {
    expect(hasPermission(ROLES.AUDITOR, PERMISOS.INVENTARIO_VER)).toBe(true);
    expect(hasPermission(ROLES.AUDITOR, PERMISOS.AUDITORIA_VER)).toBe(true);
    expect(hasPermission(ROLES.AUDITOR, PERMISOS.REPORTE_EXPORTAR)).toBe(true);
    expect(hasPermission(ROLES.AUDITOR, PERMISOS.INSPECCION_CREAR)).toBe(false);
    expect(hasPermission(ROLES.AUDITOR, PERMISOS.INVENTARIO_CREAR)).toBe(false);
    expect(hasPermission(ROLES.AUDITOR, PERMISOS.CASO_CREAR)).toBe(false);
  });

  it('Reglas de Anti-Escalada de Privilegios: nadie puede gestionar un rol superior o igual al propio', () => {
    // Inspector no puede gestionar a nadie
    expect(canManageRole(ROLES.INSPECTOR, ROLES.INSPECTOR)).toBe(false);
    expect(canManageRole(ROLES.INSPECTOR, ROLES.SUPERVISOR)).toBe(false);
    expect(canManageRole(ROLES.INSPECTOR, ROLES.ADMIN)).toBe(false);
    expect(canManageRole(ROLES.INSPECTOR, ROLES.SUPERADMIN)).toBe(false);

    // Supervisor puede gestionar Inspector y Auditor, pero no Admin ni Superadmin
    expect(canManageRole(ROLES.SUPERVISOR, ROLES.INSPECTOR)).toBe(true);
    expect(canManageRole(ROLES.SUPERVISOR, ROLES.AUDITOR)).toBe(true);
    expect(canManageRole(ROLES.SUPERVISOR, ROLES.SUPERVISOR)).toBe(false);
    expect(canManageRole(ROLES.SUPERVISOR, ROLES.ADMIN)).toBe(false);

    // Admin puede gestionar Supervisor, Inspector, Auditor, pero no Superadmin ni otro Admin
    expect(canManageRole(ROLES.ADMIN, ROLES.SUPERVISOR)).toBe(true);
    expect(canManageRole(ROLES.ADMIN, ROLES.INSPECTOR)).toBe(true);
    expect(canManageRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(false);
    expect(canManageRole(ROLES.ADMIN, ROLES.SUPERADMIN)).toBe(false);

    // Superadmin puede gestionar todo
    expect(canManageRole(ROLES.SUPERADMIN, ROLES.SUPERADMIN)).toBe(true);
    expect(canManageRole(ROLES.SUPERADMIN, ROLES.ADMIN)).toBe(true);
  });

  it('Control de Alcance Sectorial (usuarios_sectores)', () => {
    const extPiso1 = { id: 1, code: 'MF-001', area: 'Piso 1 - Oficinas Administrativas', floor: 'Piso 1', building: 'Edificio Central', location: 'Puesto 1' };
    const extSubsuelo = { id: 2, code: 'MF-002', area: 'Cochera Subsuelo', floor: 'Subsuelo', building: 'Edificio Central', location: 'Puesto 2' };

    // Usuario con alcance global (sin filas de sector)
    const userGlobal = { role: ROLES.INSPECTOR, isGlobalScope: true, sectores: [] };
    expect(checkUserSectorScope(userGlobal, extPiso1)).toBe(true);
    expect(checkUserSectorScope(userGlobal, extSubsuelo)).toBe(true);

    // Usuario limitado solo a Piso 1
    const userPiso1 = {
      role: ROLES.INSPECTOR,
      isGlobalScope: false,
      sectores: [{ sector: 'Piso 1 - Oficinas Administrativas', floor: 'Piso 1', building: 'Edificio Central' }]
    };
    expect(checkUserSectorScope(userPiso1, extPiso1)).toBe(true);
    expect(checkUserSectorScope(userPiso1, extSubsuelo)).toBe(false);

    // Admin siempre tiene alcance global
    const adminScoped = { role: ROLES.ADMIN, isGlobalScope: false, sectores: [{ sector: 'Taller' }] };
    expect(checkUserSectorScope(adminScoped, extPiso1)).toBe(true);
  });
});
