# 📋 Inventario Técnico del Repositorio

> **Generado del código real** — verificar contra el árbol de archivos del repositorio.
> Última actualización: 2026-10-02

---

## 1. Stack Tecnológico

| Capa           | Tecnología                                    | Versión (package.json) |
| -------------- | --------------------------------------------- | ---------------------- |
| Frontend       | React + JSX (SPA)                             | 19.3.0                 |
| Build Tool     | Vite                                          | 8.3.2                  |
| Backend        | Express (Node.js)                             | 5.2.1                  |
| Base de Datos  | SQLite (node:sqlite `DatabaseSync`)           | Builtin Node 22        |
| Validación     | Zod                                           | 4.6.5                  |
| Autenticación  | Argon2id + Sesiones opacas SQLite             | argon2 0.45.1          |
| Icons          | Phosphor Icons React                          | 2.1.10                 |
| Tablas         | TanStack React Table                          | 8.21.3                 |
| Excel I/O      | ExcelJS                                       | 4.4.0                  |
| QR Scan        | html5-qrcode                                  | 2.3.8                  |
| QR Generate    | qrcode                                        | 1.5.4                  |
| Upload         | Multer                                        | 2.4.0                  |
| Seguridad HTTP | Helmet                                        | 8.3.0                  |
| Test Runner    | Vitest                                        | 5.0.3                  |
| E2E            | Playwright                                    | 1.63.0                 |
| A11y           | axe-core/playwright                           | 4.13.0                 |
| Perf Test      | Autocannon                                    | 8.0.0                  |
| Lint           | ESLint 9 + Prettier                           | —                      |
| Hooks          | Husky 9 + lint-staged 17                      | —                      |
| Container      | Docker (Node 22-alpine, multi-stage)          | —                      |
| Despliegue     | Dokploy (webhook CI/CD)                       | —                      |
| PWA            | Service Worker (sw.js) + manifest.webmanifest | —                      |

---

## 2. Estructura de Directorios

```
matafuegos/
├── server/                    # Backend Express
│   ├── index.js               # Entry point (Express app, rate limiter, rutas, SPA fallback)
│   ├── config.js              # Validación de ENV y config centralizada
│   ├── db.js                  # Schema DDL, ensureColumn, seed, init
│   ├── config/
│   │   └── permissions.js     # RBAC: roles, permisos, jerarquía
│   ├── middleware/
│   │   ├── auth.js            # Autenticación (cookie → sesión SQLite → headers → default)
│   │   ├── errorHandler.js    # Error handler centralizado + 404
│   │   └── logger.js          # Request ID, logging estructurado, métricas HTTP
│   ├── routes/
│   │   ├── auth.js            # Login local, Entra ID OIDC, PIN, sesiones
│   │   ├── extinguishers.js   # CRUD extintores, semáforo, Excel import/export
│   │   ├── inspections.js     # Inspecciones inmutables, antifraude, webhook M365
│   │   ├── rounds.js          # Rondas mensuales, cobertura
│   │   ├── cases.js           # Casos/anomalías, máquina de estados
│   │   ├── users.js           # CRUD usuarios, alcance sectorial, tokens
│   │   ├── audit.js           # Consulta de auditoría
│   │   ├── checklist.js       # Items de checklist configurable
│   │   ├── qrs.js             # Generación de imágenes QR
│   │   ├── m365.js            # Sync M365 SharePoint/Teams/Power Automate
│   │   ├── health.js          # Healthcheck (DB, disco, memoria)
│   │   └── metrics.js         # Prometheus / OpenMetrics
│   ├── services/
│   │   ├── anomalyService.js     # Máquina de estados de casos (ABIERTO→…→RESUELTO)
│   │   ├── antifraudService.js   # Reglas antifraude (velocidad, intervalo)
│   │   ├── auditService.js       # Registro append-only en tabla `auditoria`
│   │   ├── authService.js        # Hash Argon2id, sesiones, JIT Entra ID
│   │   ├── backupService.js      # VACUUM INTO, verify, restore, purge
│   │   ├── expirationService.js  # Cálculos IRAM 3517-2 (carga, PH, vida útil)
│   │   ├── roundService.js       # Cobertura, reinspección, agrupación por sector
│   │   └── semaphoreService.js   # Resolución de estado VENCIDO/FALLA/PENDIENTE/OK
│   ├── validators/
│   │   ├── schemas.js            # Zod schemas (extintor, inspección, caso, user, auth)
│   │   └── dataValidators.js     # Validación de MF-XXX, fechas, import Excel
│   └── migrations/
│       ├── index.js              # Runner de migraciones versionadas (up/down)
│       └── 001_multi_org_and_users.js  # Multitenant, usuarios, RBAC, sesiones, auditoría
├── src/                       # Frontend React
│   ├── main.jsx               # Entry point
│   ├── App.jsx                # Router hash, estado global, lógica de sesión
│   ├── index.css              # Design system (dark/light, variables CSS)
│   ├── components/
│   │   ├── AccessDenied.jsx
│   │   ├── AuditViewer.jsx
│   │   ├── CasesList.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── ExtinguisherModal.jsx
│   │   ├── ExtinguishersList.jsx
│   │   ├── InspectionForm.jsx
│   │   ├── InspectionHistory.jsx
│   │   ├── LoginModal.jsx
│   │   ├── M365SyncModal.jsx
│   │   ├── Navbar.jsx
│   │   ├── QrPrinter.jsx
│   │   ├── QuickPinSwitchModal.jsx
│   │   ├── RouteView.jsx
│   │   ├── Scanner.jsx
│   │   ├── UserModal.jsx
│   │   ├── UserProfileModal.jsx
│   │   └── UsersList.jsx
│   └── utils/
│       └── offlineQueue.js    # IndexedDB queue, cuarentena, sync, compresión foto
├── public/
│   ├── manifest.webmanifest   # PWA manifest
│   ├── manifest.json          # (alias)
│   ├── sw.js                  # Service Worker (network-first nav, cache-first assets)
│   ├── logo-milicic.png
│   └── logo-milicic.svg
├── scripts/
│   ├── backup-db.js           # Backup manual desde CLI
│   ├── restore-db.js          # Restore manual desde CLI
│   ├── crear-admin.js         # Crear usuario SUPERADMIN interactivo
│   ├── backup.sh / backup.ps1 # Scripts shell/PowerShell
├── tests/
│   ├── unit/                  # 9 archivos (Vitest)
│   ├── integration/           # 13 archivos (Vitest + Supertest)
│   ├── e2e/                   # 11 archivos (Playwright)
│   └── perf/                  # load_test.js (Autocannon)
├── docs/                      # Documentación técnica (este directorio)
├── documentacion/             # Portal de documentación servido en /documentacion
├── .github/workflows/ci.yml  # CI/CD (lint → test → build → Docker → Dokploy)
├── Dockerfile                 # Multi-stage (builder + runner node:22-alpine)
├── docker-compose.yml         # Servicio único con volumen persistente
├── vite.config.js             # Proxy /api, HTTPS dev, chunk splitting
├── vitest.config.js           # Config Vitest
├── playwright.config.js       # Config Playwright
└── package.json               # Scripts, dependencias
```

---

## 3. Tablas de Base de Datos

### 3.1 Tablas base (DDL en `server/db.js`)

| Tabla             | PK                   | Descripción                                                                                                                                                                                                                                                                          |
| ----------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `extinguishers`   | `id` (autoincrement) | Inventario de extintores. Campos clave: `code` (MF-XXX, UNIQUE), `public_id` (24 hex para QR), `type`, `capacity`, `location`, `area`, `floor`, `building`, `expiration_charge`, `expiration_ph`, `status`, `manufacturer`, `fab_year`, etc.                                         |
| `inspections`     | `id` (autoincrement) | Registros inmutables de inspección mensual. Campos: `extinguisher_id`, `extinguisher_code`, `inspector_name`, `year_month`, `passed`, 6 checks booleanos, `checklist_results` (JSON), `duration_seconds`, `is_suspicious`, `fraud_flags`, coordenadas GPS, `round_id`, `usuario_id`. |
| `rounds`          | `id` (autoincrement) | Rondas mensuales. `year_month` (UNIQUE), `status` (ABIERTA/CERRADA).                                                                                                                                                                                                                 |
| `cases`           | `id` (autoincrement) | Anomalías/casos correctivos. `status` (ABIERTO→EN_TALLER→TEMP_REPLACED→RESUELTO).                                                                                                                                                                                                    |
| `audit_logs`      | `id` (autoincrement) | Auditoría legacy (CREATE/UPDATE/DELETE).                                                                                                                                                                                                                                             |
| `checklist_items` | `id` (autoincrement) | Items configurables del checklist de inspección. 6 items por defecto IRAM 3517-2.                                                                                                                                                                                                    |
| `settings`        | `key` (TEXT PK)      | Pares clave-valor (company_name, base_url, timezone, alert_days).                                                                                                                                                                                                                    |

### 3.2 Tablas de migración 001 (`server/migrations/001_multi_org_and_users.js`)

| Tabla               | PK                      | Descripción                                                                                     |
| ------------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| `organizaciones`    | `id` (autoincrement)    | Soporte multitenant (actualmente solo org id=1 "Milicic S.A.").                                 |
| `usuarios`          | `id` (TEXT UUID)        | Usuarios del sistema. `origen` (local/entra), `rol`, `password_hash`, `pin_hash`, bloqueo, etc. |
| `usuarios_sectores` | `id` (autoincrement)    | Alcance sectorial de cada usuario (sector, piso, edificio).                                     |
| `sesiones`          | `id` (TEXT, 64 hex)     | Sesiones opacas con expiración y revocación.                                                    |
| `auditoria`         | `id` (autoincrement)    | Auditoría append-only (reemplaza `audit_logs` para nuevos registros).                           |
| `permisos`          | `codigo` (TEXT PK)      | Definición de permisos granulares del sistema.                                                  |
| `roles_permisos`    | `(rol, permiso_codigo)` | Matriz rol → permisos.                                                                          |
| `tokens_seguridad`  | `id` (autoincrement)    | Tokens de invitación, reset, autorización de dispositivo.                                       |
| `schema_migrations` | `version` (INTEGER PK)  | Control de migraciones aplicadas.                                                               |

### 3.3 Columnas agregadas a tablas base por migración 001

- `extinguishers`: `organizacion_id`
- `rounds`: `organizacion_id`
- `cases`: `organizacion_id`, `usuario_id`, `usuario_nombre_snapshot`
- `checklist_items`: `organizacion_id`
- `inspections`: `organizacion_id`, `usuario_id`, `inspector_name_snapshot`

---

## 4. Endpoints de API

### 4.1 Rutas montadas en `server/index.js`

| Prefijo              | Módulo de rutas           | Auth         |
| -------------------- | ------------------------- | ------------ |
| `GET /m/:publicId`   | Inline en index.js        | No (público) |
| `/api/extinguishers` | `routes/extinguishers.js` | Sí           |
| `/api/inspections`   | `routes/inspections.js`   | Sí           |
| `/api/rounds`        | `routes/rounds.js`        | Sí           |
| `/api/cases`         | `routes/cases.js`         | Sí           |
| `/api/checklist`     | `routes/checklist.js`     | Sí           |
| `/api/auth`          | `routes/auth.js`          | Mixto        |
| `/api/users`         | `routes/users.js`         | Sí           |
| `/api/audit`         | `routes/audit.js`         | Sí           |
| `/api/qrs`           | `routes/qrs.js`           | Sí           |
| `/api/m365`          | `routes/m365.js`          | Sí           |
| `/api/health`        | `routes/health.js`        | No           |
| `/api/metrics`       | `routes/metrics.js`       | No           |
| `/documentacion`     | Static files              | No           |

### 4.2 Restricciones de inmutabilidad

Las inspecciones (`/api/inspections`) **rechazan PUT, PATCH y DELETE** con HTTP 405 por normativa IRAM 3517-2.

---

## 5. Modelo RBAC

### 5.1 Roles (de `config/permissions.js`)

| Rol          | Nivel jerárquico | Descripción                                                        |
| ------------ | ---------------- | ------------------------------------------------------------------ |
| `SUPERADMIN` | 100              | Acceso total. Gestión de config, backup, usuarios sin restricción. |
| `ADMIN`      | 80               | Gestión completa menos config global y backup.                     |
| `SUPERVISOR` | 60               | Gestión de rondas, inspecciones, casos. Sin CRUD de usuarios.      |
| `INSPECTOR`  | 40               | Crear inspecciones, ver inventario, crear/editar casos.            |
| `AUDITOR`    | 20               | Solo lectura de todo + auditoría.                                  |

### 5.2 Permisos granulares (27 permisos)

| Módulo       | Permisos                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| Usuario      | `usuario:ver`, `usuario:crear`, `usuario:editar`, `usuario:desactivar`, `usuario:invitar`, `usuario:editar_alcance` |
| Sesión       | `sesion:ver`, `sesion:revocar`                                                                                      |
| Dispositivo  | `dispositivo:autorizar`                                                                                             |
| Auditoría    | `auditoria:ver`, `auditoria:exportar`                                                                               |
| Config       | `config:gestionar`, `backup:gestionar`                                                                              |
| Inventario   | `inventario:ver`, `inventario:crear`, `inventario:editar`, `inventario:eliminar`, `qr:imprimir`                     |
| Rondas       | `ronda:ver`, `ronda:abrir_cerrar`, `ronda:reabrir`, `ronda:asignar`                                                 |
| Inspecciones | `inspeccion:crear`, `inspeccion:ver`, `inspeccion:revisar_sospechosas`                                              |
| Casos        | `caso:ver`, `caso:crear`, `caso:editar`, `caso:asignar`                                                             |
| Checklist    | `checklist:gestionar`                                                                                               |
| Reportes     | `reporte:exportar`, `reporte:importar`, `dashboard:ver`                                                             |

---

## 6. Servicios del Backend

| Servicio   | Archivo                | Responsabilidad                                                                                                           |
| ---------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Anomaly    | `anomalyService.js`    | Máquina de estados de casos (ABIERTO→EN_TALLER→TEMP_REPLACED→RESUELTO). Validación de transiciones.                       |
| Antifraud  | `antifraudService.js`  | Evaluación de inspecciones sospechosas: duración < 5s, duración = 0, intervalo < 8s.                                      |
| Audit      | `auditService.js`      | `recordAudit()`: inserta en `auditoria` (nuevo) + `audit_logs` (legacy, retrocompat).                                     |
| Auth       | `authService.js`       | Hash Argon2id, sesiones opacas, bloqueo por intentos fallidos, PIN, provisioning JIT Entra ID.                            |
| Backup     | `backupService.js`     | `VACUUM INTO`, verificación de integridad, restore, listado, purga por retención.                                         |
| Expiration | `expirationService.js` | Cálculos de vencimiento IRAM 3517-2: carga anual (1 año), PH (5 años), vida útil (20/30 años). Zona horaria Buenos Aires. |
| Round      | `roundService.js`      | Cobertura de ronda, reinspección, agrupación de pendientes por sector.                                                    |
| Semaphore  | `semaphoreService.js`  | Resolución de semáforo: VENCIDO > FALLA > PENDIENTE > OK.                                                                 |

---

## 7. Middleware

| Middleware           | Archivo           | Función                                                                |
| -------------------- | ----------------- | ---------------------------------------------------------------------- |
| `authenticate`       | `auth.js`         | Pipeline: cookie sesión → headers proxy/gateway → usuario default dev. |
| `requireRole`        | `auth.js`         | Restricción por lista de roles permitidos. SUPERADMIN bypasses.        |
| `requirePermiso`     | `auth.js`         | Restricción por permiso granular específico.                           |
| `requireSectorScope` | `auth.js`         | Verifica que el extintor esté en el sector del usuario.                |
| `requestLogger`      | `logger.js`       | Request ID, latencia, métricas en memoria.                             |
| `errorHandler`       | `errorHandler.js` | Error centralizado con mensajes en español.                            |
| `notFoundHandler`    | `errorHandler.js` | 404 para rutas de API inexistentes.                                    |

---

## 8. Frontend (Componentes React)

| Componente            | Archivo                   | Función principal                                                  |
| --------------------- | ------------------------- | ------------------------------------------------------------------ |
| `App`                 | `App.jsx`                 | Router hash, estado global, lógica de sesión, sync offline.        |
| `Navbar`              | `Navbar.jsx`              | Barra de navegación con tabs, indicador offline, avatar usuario.   |
| `Dashboard`           | `Dashboard.jsx`           | KPIs, semáforos, vencimientos, cobertura de ronda.                 |
| `ExtinguishersList`   | `ExtinguishersList.jsx`   | Lista paginada con filtros, semáforo, acciones CRUD.               |
| `ExtinguisherModal`   | `ExtinguisherModal.jsx`   | Alta/edición de extintor.                                          |
| `InspectionForm`      | `InspectionForm.jsx`      | Formulario de inspección con checklist dinámico, foto, GPS, timer. |
| `InspectionHistory`   | `InspectionHistory.jsx`   | Historial de inspecciones con filtros.                             |
| `Scanner`             | `Scanner.jsx`             | Escaneo QR con cámara (html5-qrcode).                              |
| `CasesList`           | `CasesList.jsx`           | Gestión de anomalías/casos con transiciones.                       |
| `QrPrinter`           | `QrPrinter.jsx`           | Generación e impresión de etiquetas QR.                            |
| `RouteView`           | `RouteView.jsx`           | Vista de ruta/sector para inspección en campo.                     |
| `LoginModal`          | `LoginModal.jsx`          | Login local y redirección Entra ID.                                |
| `UsersList`           | `UsersList.jsx`           | ABM de usuarios con roles.                                         |
| `UserModal`           | `UserModal.jsx`           | Alta/edición de usuario con sectores.                              |
| `UserProfileModal`    | `UserProfileModal.jsx`    | Perfil personal, cambio de PIN/contraseña.                         |
| `QuickPinSwitchModal` | `QuickPinSwitchModal.jsx` | Cambio rápido de usuario por PIN (dispositivo compartido).         |
| `AuditViewer`         | `AuditViewer.jsx`         | Visor de registros de auditoría.                                   |
| `M365SyncModal`       | `M365SyncModal.jsx`       | Sincronización con Microsoft 365.                                  |
| `AccessDenied`        | `AccessDenied.jsx`        | Pantalla de acceso denegado.                                       |
| `ErrorBoundary`       | `ErrorBoundary.jsx`       | Captura de errores React.                                          |

---

## 9. PWA / Offline

| Componente      | Archivo                       | Estrategia                                                                                                                                        |
| --------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Service Worker  | `public/sw.js`                | **API**: Network-first con fallback JSON offline. **Navegación**: Network-first con cache fallback. **Assets**: Cache-first con network fallback. |
| Manifest        | `public/manifest.webmanifest` | `display: standalone`, `orientation: portrait`, tema naranja (#ea580c).                                                                           |
| IndexedDB Queue | `src/utils/offlineQueue.js`   | Encola inspecciones offline en IndexedDB. Sync con revalidación de sesión. Cuarentena si usuario desactivado. Compresión de fotos en Canvas.      |

---

## 10. Variables de Entorno

| Variable                         | Default                          | Descripción                                    |
| -------------------------------- | -------------------------------- | ---------------------------------------------- |
| `NODE_ENV`                       | `development`                    | Entorno (`production`, `development`, `test`). |
| `PORT`                           | `3000`                           | Puerto del servidor.                           |
| `DATA_DIR`                       | `./data`                         | Directorio de datos SQLite y backups.          |
| `BASE_URL`                       | `http://localhost:3000`          | URL pública para QR y redirects.               |
| `CORS_ORIGIN`                    | `*`                              | Orígenes CORS permitidos.                      |
| `TZ`                             | `America/Argentina/Buenos_Aires` | Zona horaria.                                  |
| `AUTH_PROVIDER`                  | `local`                          | Modo de autenticación (`local` / `entra`).     |
| `MICROSOFT_CLIENT_ID`            | —                                | App Registration de Entra ID.                  |
| `MICROSOFT_TENANT_ID`            | —                                | Tenant de Entra ID.                            |
| `MICROSOFT_CLIENT_SECRET`        | —                                | Secret de Entra ID.                            |
| `MICROSOFT_REDIRECT_URI`         | —                                | URI de callback OIDC.                          |
| `ALLOWED_EMAIL_DOMAINS`          | `milicic.com.ar`                 | Dominios autorizados para JIT provisioning.    |
| `M365_WEBHOOK_URL`               | —                                | Webhook de Power Automate para notificaciones. |
| `HTTPS`                          | `false`                          | Habilitar HTTPS con certificados locales.      |
| `SSL_CERT_FILE` / `SSL_KEY_FILE` | `certs/dev-*`                    | Certificados SSL dev.                          |
| `RATE_LIMIT_MAX`                 | `300` (prod)                     | Límite de requests/minuto por IP.              |
| `RATE_LIMIT_DISABLED`            | `false`                          | Deshabilitar rate limit (para tests).          |
| `ALLOW_SEED`                     | `false`                          | Permitir seed automático en producción.        |
| `LOG_LEVEL`                      | `info` (prod) / `debug` (dev)    | Nivel de log.                                  |
| `SESSION_SECRET`                 | —                                | (Advertencia si < 16 chars en prod).           |

---

## 11. Tests

| Nivel       | Directorio           | Herramienta        | Archivos                                                                                                                                     |
| ----------- | -------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | `tests/unit/`        | Vitest             | 9 archivos: anomaly, antifraud, backup, expiration, rbac, round, schemas, semaphore, validators.                                             |
| Integration | `tests/integration/` | Vitest + Supertest | 13 archivos: auth, RBAC, backup, cases, Excel I/O, CRUD, health, IDOR, inspections immutability, migrations, observability, security, users. |
| E2E         | `tests/e2e/`         | Playwright         | 11 archivos: a11y, export, fault report, inspector flow, inventory, login, mobile, offline, QR, users.                                       |
| Performance | `tests/perf/`        | Autocannon         | 1 archivo: load_test.js.                                                                                                                     |

---

## 12. CI/CD

**Pipeline**: `.github/workflows/ci.yml`

```
push/PR a main → quality-and-tests → docker-build → deploy-dokploy
```

1. **quality-and-tests**: npm audit → Prettier → ESLint → Vitest (coverage) → Vite build → Playwright E2E → Axe a11y.
2. **docker-build**: Build imagen Docker multi-stage (depende de quality-and-tests).
3. **deploy-dokploy**: Webhook HTTP POST a Dokploy (solo push a main).

---

## 13. Scripts

| Script npm          | Comando                            | Descripción                      |
| ------------------- | ---------------------------------- | -------------------------------- |
| `dev`               | `vite`                             | Dev server frontend.             |
| `dev:https`         | `vite --host --https`              | Dev con HTTPS para cámara móvil. |
| `build`             | `vite build`                       | Build de producción.             |
| `start` / `server`  | `node server/index.js`             | Iniciar servidor Express.        |
| `test`              | `vitest run`                       | Tests unitarios + integración.   |
| `test:e2e`          | `playwright test`                  | Tests end-to-end.                |
| `test:a11y`         | `playwright test a11y_axe.spec.js` | Auditoría accesibilidad.         |
| `test:load`         | `node tests/perf/load_test.js`     | Test de carga.                   |
| `test:coverage`     | `vitest run --coverage`            | Con cobertura.                   |
| `lint` / `lint:fix` | `eslint .`                         | Linting.                         |
| `format`            | `prettier --write`                 | Formateo.                        |
| `backup`            | `node scripts/backup-db.js`        | Backup manual de DB.             |
| `restore`           | `node scripts/restore-db.js`       | Restore manual de DB.            |
| `crear-admin`       | `node scripts/crear-admin.js`      | Crear usuario SUPERADMIN.        |
