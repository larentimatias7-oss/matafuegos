# 📋 Checklist de Seguridad y Guía de Verificación (OWASP ASVS)

> **Para quién es**: Ingenieros de DevOps, desarrolladores y evaluadores de seguridad antes de cada pase a producción o auditoría externa.  
> **Qué vas a entender al terminarlo**: Una lista de verificación rigurosa, basada en los lineamientos de OWASP ASVS (Application Security Verification Standard) Nivel 2 simplificado, para validar que la aplicación cumple con los estándares exigidos.

---

## 1. Lista de Verificación Pre-Despliegue

### V1: Arquitectura y Modelado de Amenazas

- [x] Límites de confianza identificados (Reverse Proxy $\rightarrow$ Express $\rightarrow$ SQLite).
- [x] Control estricto de acceso RBAC implementado a nivel de controlador backend (`requirePermiso`), nunca dependiente exclusivamente del frontend.
- [x] Protección contra IDOR mediante verificación de `organizacion_id` y `requireSectorScope`.

### V2: Autenticación

- [x] Hashing de contraseñas locales con **Argon2id** (mínimo 64 MB de memoria, 3 iteraciones).
- [x] Política de bloqueo temporal tras 5 intentos fallidos consecutivos durante 15 minutos.
- [x] Rate limiting en `/api/auth/login` (máximo 10 peticiones cada 15 minutos por IP).
- [x] Respuestas genéricas de error ("Credenciales inválidas") para evitar ataques de enumeración de usuarios.
- [x] Flujo de Microsoft Entra ID con OpenID Connect y PKCE.

### V3: Gestión de Sesiones

- [x] Identificadores de sesión opacos y aleatorios (UUID v4) almacenados en servidor.
- [x] Cookies marcadas como `HttpOnly` y `SameSite=Lax` (`Secure` obligatorio en producción).
- [x] Capacidad de revocación inmediata de sesiones activas por el propio usuario o por un administrador.
- [x] Cierre de todas las sesiones al desactivar una cuenta de usuario.

### V4: Control de Acceso y Autorización

- [x] Matriz centralizada de permisos en `server/config/permissions.js`.
- [x] Regla de jerarquía de roles: imposibilidad de elevarse privilegios o asignar roles superiores al propio.
- [x] Protección del último Superadmin: prohibición en backend de desactivar o degradar al último Superadmin activo.

### V5: Validación de Entradas y Consultas a Base de Datos

- [x] Validación estricta de payloads con esquemas **Zod** antes de tocar servicios de negocio.
- [x] 100% de consultas a SQLite mediante **sentencias preparadas** (`db.prepare(...)`), eliminando inyección SQL.
- [x] Sanitización y validación de tipos y formatos de fotos base64.

### V6: Configuración del Servidor y Cabeceras HTTP

- [x] Middleware **Helmet** activo configurando Content Security Policy (CSP), X-Frame-Options, X-Content-Type-Options y Referrer-Policy.
- [x] Contenedor Docker configurado para ejecutarse bajo usuario sin privilegios (`USER node`).
- [x] Ningún secreto, credencial o token hardcodeado en el código fuente.

### V7: Auditoría y Privacidad

- [x] Registro append-only en tabla `auditoria` para todas las mutaciones críticas.
- [x] Eliminación garantizada de contraseñas, PINs y tokens de cualquier salida de logs estructurados (`logger`).
- [x] Snapshots inmutables de nombres de inspectores en las inspecciones mensuales.

---

## Archivos del código relacionados

- [`server/index.js`](file:///c:/antigravity/matafuegos/server/index.js) — Configuración de Helmet y middlewares de seguridad.
- [`server/middleware/auth.js`](file:///c:/antigravity/matafuegos/server/middleware/auth.js) — Implementación de RBAC y protecciones de acceso.
- [`server/validators/schemas.js`](file:///c:/antigravity/matafuegos/server/validators/schemas.js) — Esquemas Zod de validación.
- [`Dockerfile`](file:///c:/antigravity/matafuegos/Dockerfile) — Hardening del contenedor con usuario no-root.
