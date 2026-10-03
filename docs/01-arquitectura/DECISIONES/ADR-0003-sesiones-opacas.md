# ADR-0003: Sesiones opacas en SQLite (vs JWT)

> **Estado**: Aceptado
> **Fecha**: 2026-10-02 (documentado retroactivamente del código)

## Contexto

El sistema necesita autenticación con soporte para revocación inmediata de sesiones, cambio rápido de usuario por PIN y bloqueo por intentos fallidos.

## Decisión

Sesiones opacas (tokens aleatorios de 32 bytes) almacenadas en la tabla `sesiones` de SQLite. Cookie `httpOnly`, `secure` (prod), `sameSite=lax`.

## Justificación (vs JWT)

- **Revocación inmediata**: al desactivar un usuario o cambiar contraseña, las sesiones se eliminan de la tabla y la cookie queda invalidada instantáneamente.
- **Sin refresh tokens**: la sesión tiene sliding expiration (se extiende en cada request).
- **PIN switch**: al cambiar de usuario con PIN, la sesión anterior se revoca y se crea una nueva.
- **Simplicidad**: no se necesitan bibliotecas de JWT, verificación de firma ni manejo de expiración client-side.

## Consecuencias

- ⚠️ **Cada request consulta la tabla `sesiones`**: overhead adicional vs JWT verificado localmente. Mitigado por SQLite en memoria (WAL).
- ⚠️ **No funciona cross-service**: si hubiera microservicios, cada uno necesitaría consultar la misma DB de sesiones.
- ✅ **Revocación instantánea**: eliminar la fila = sesión muerta.
- ✅ **Sin secretos de firma**: no hay `JWT_SECRET` que rotar.
