# 📖 Guía de Integración y Convenciones de la API REST

> **Para quién es**: Desarrolladores backend, frontend e ingenieros de integraciones que consumen o extienden los servicios web de Milicic FireControl 365.  
> **Qué vas a entender al terminarlo**: Las convenciones de diseño de la API, encabezados requeridos, manejo uniforme de errores, formato de respuestas, mecanismos de autenticación y ejemplos reproducibles con `curl`.

---

## 1. Convenciones Globales

- **URL Base**: `/api`
- **Formato de Payload**: `application/json; charset=utf-8`
- **Mecanismo de Autenticación Principal**: Cookie HttpOnly `firecontrol_session` emitida tras el login exitoso (`SameSite=Lax`, `Secure` en producción).
- **Trazabilidad (Request ID)**: Cada petición entrante recibe un identificador único reflejado en el encabezado de respuesta `X-Request-ID`.
- **Estructura Uniforme de Respuesta**:
  ```json
  // Respuesta Exitosa
  {
    "success": true,
    "data": { ... }
  }

  // Respuesta de Error
  {
    "success": false,
    "error": "Mensaje descriptivo en español",
    "code": "CODIGO_DE_ERROR_IDENTIFICABLE"
  }
  ```

---

## 2. Códigos de Estado HTTP Utilizados

| Código                   | Significado                | Escenario de Uso en Milicic FireControl                             |
| ------------------------ | -------------------------- | ------------------------------------------------------------------- |
| `200 OK`                 | Petición procesada         | Consultas GET exitosas, actualizaciones PUT exitosas                |
| `201 Created`            | Recurso creado             | Alta de extintor, registro de inspección, creación de usuario       |
| `400 Bad Request`        | Validación fallida         | Parámetros inválidos, validaciones Zod no cumplidas                 |
| `401 Unauthorized`       | No autenticado             | Cookie ausente, token de sesión expirado o revocado                 |
| `403 Forbidden`          | No autorizado (RBAC/Scope) | Usuario sin permiso para la operación o fuera de su sector asignado |
| `404 Not Found`          | Recurso inexistente        | Extintor o ronda no encontrada                                      |
| `405 Method Not Allowed` | Inmutabilidad legal        | Invocación de `PUT`, `PATCH` o `DELETE` sobre `/api/inspections`    |
| `409 Conflict`           | Conflicto de estado        | Extintor ya inspeccionado en el mes sin declarar reinspección       |
| `423 Locked`             | Cuenta bloqueada           | Bloqueo temporal por 5 intentos fallidos de login                   |
| `429 Too Many Requests`  | Rate limit superado        | Exceso de 10 peticiones/15m en login o 300 req/min en API           |
| `500 Internal Error`     | Error de servidor          | Excepción no controlada en el backend                               |

---

## 3. Ejemplos Prácticos con `curl`

### 3.1 Autenticación Local

```bash
# Iniciar sesión y guardar la cookie en un archivo temporal
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@milicic.com.ar","password":"PasswordSegura123!"}'
```

### 3.2 Listado de Extintores (con Cookie)

```bash
curl -X GET "http://localhost:3000/api/extinguishers?status=OPERATIVO" \
  -b cookies.txt
```

### 3.3 Registro de Inspección Inmutable (IRAM 3517-2)

```bash
curl -X POST http://localhost:3000/api/inspections \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "extinguisher_code": "MF-001",
    "passed": 1,
    "check_location": 1,
    "check_access": 1,
    "check_seal": 1,
    "check_pressure": 1,
    "check_hose": 1,
    "check_card": 1,
    "duration_seconds": 18,
    "observations": "Control mensual conforme, manómetro en zona verde"
  }'
```

### 3.4 Cambio Rápido de Inspector por PIN en Tablet Compartida

```bash
curl -X POST http://localhost:3000/api/auth/switch-pin \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "pin": "1234"
  }'
```

---

## Archivos del código relacionados

- [`server/index.js`](file:///c:/antigravity/matafuegos/server/index.js) — Montaje de middlewares globales y ruteo.
- [`server/middleware/auth.js`](file:///c:/antigravity/matafuegos/server/middleware/auth.js) — Autenticación, RBAC y scope sectorial.
- [`server/routes/`](file:///c:/antigravity/matafuegos/server/routes/) — Rutas de los recursos de la API.
