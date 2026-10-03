# ADR-0004: RBAC con permisos granulares y jerarquía numérica

> **Estado**: Aceptado
> **Fecha**: 2026-10-02 (documentado retroactivamente del código)

## Contexto

Se necesitan al menos 3 niveles de acceso (inspector, supervisor, admin) con restricciones granulares por módulo y por sector/piso/edificio.

## Decisión

RBAC con 5 roles fijos, 27 permisos granulares y jerarquía numérica para control de escalada:

```
SUPERADMIN (100) > ADMIN (80) > SUPERVISOR (60) > INSPECTOR (40) > AUDITOR (20)
```

## Justificación

- **Permisos granulares**: permiten control fino (ej: un SUPERVISOR puede ver usuarios pero no crearlos).
- **Jerarquía numérica**: previene escalada de privilegios (un ADMIN no puede crear un SUPERADMIN).
- **Alcance sectorial**: tabla `usuarios_sectores` limita la visibilidad a sectores específicos.
- **SUPERADMIN bypass**: acceso total sin necesidad de listar cada permiso.

## Consecuencias

- ⚠️ **Roles fijos**: no se pueden crear roles custom desde la UI.
- ⚠️ **Alcance "global" por defecto**: un usuario sin sectores asignados ve todo (intencional, documentado en H-008).
- ✅ **Prevención de escalada**: verificada por test `rbac_matrix.test.js`.
- ✅ **27 permisos cubren todos los módulos actuales**.
