# Requisitos

> **Para quién**: Arquitectos, desarrolladores y testers que necesiten entender qué debe hacer el sistema y con qué restricciones.
> **Qué vas a entender**: Los requisitos funcionales y no funcionales con trazabilidad a los módulos que los implementan.

---

## 1. Requisitos Funcionales

### RF-01: Inventario de extintores

| ID      | Requisito                                                                                                                     | Módulo                                             |
| ------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| RF-01.1 | Alta de extintores con datos técnicos completos (código, tipo, capacidad, ubicación, fechas de vencimiento, fabricante, etc.) | `routes/extinguishers.js`, `ExtinguisherModal.jsx` |
| RF-01.2 | Edición de datos del extintor con registro de auditoría (diff antes/después)                                                  | `routes/extinguishers.js`, `auditService.js`       |
| RF-01.3 | Importación masiva desde Excel (.xlsx) con validación fila por fila                                                           | `routes/extinguishers.js`, `dataValidators.js`     |
| RF-01.4 | Exportación del inventario a Excel con estado de semáforo                                                                     | `routes/extinguishers.js`, `ExtinguishersList.jsx` |
| RF-01.5 | Generación de códigos QR con URL pública (`/m/<publicId>`)                                                                    | `routes/qrs.js`, `QrPrinter.jsx`                   |
| RF-01.6 | Semáforo de estado: VENCIDO > FALLA > PENDIENTE > OK                                                                          | `semaphoreService.js`                              |
| RF-01.7 | Cálculo automático de vencimientos según IRAM 3517-2                                                                          | `expirationService.js`                             |

### RF-02: Inspección mensual

| ID      | Requisito                                                                 | Módulo                                   |
| ------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| RF-02.1 | Escaneo de QR con cámara del celular para identificar el extintor         | `Scanner.jsx`, `html5-qrcode`            |
| RF-02.2 | Checklist de 6 puntos predefinidos (IRAM 3517-2) + checklist configurable | `InspectionForm.jsx`, `checklist_items`  |
| RF-02.3 | Captura de foto evidencia con compresión en el cliente                    | `InspectionForm.jsx`, `offlineQueue.js`  |
| RF-02.4 | Registro de coordenadas GPS si están disponibles                          | `routes/inspections.js`                  |
| RF-02.5 | Medición de duración de la inspección (timer)                             | `InspectionForm.jsx`                     |
| RF-02.6 | Inspecciones **inmutables**: no se pueden modificar ni eliminar           | `routes/inspections.js` (middleware 405) |
| RF-02.7 | Una inspección por extintor por ronda (reinspección con justificación)    | `roundService.js`                        |
| RF-02.8 | Detección automática de inspecciones sospechosas (antifraude)             | `antifraudService.js`                    |

### RF-03: Rondas mensuales

| ID      | Requisito                                      | Módulo                             |
| ------- | ---------------------------------------------- | ---------------------------------- |
| RF-03.1 | Auto-creación de ronda al inicio de cada mes   | `db.js` (initSchema)               |
| RF-03.2 | Cálculo de cobertura en tiempo real            | `roundService.js`, `Dashboard.jsx` |
| RF-03.3 | Cierre de ronda por supervisor/admin           | `routes/rounds.js`                 |
| RF-03.4 | Reapertura de ronda cerrada (solo SUPERVISOR+) | `routes/rounds.js`                 |

### RF-04: Gestión de anomalías

| ID      | Requisito                                                          | Módulo                             |
| ------- | ------------------------------------------------------------------ | ---------------------------------- |
| RF-04.1 | Creación de caso desde inspección con falla o manualmente          | `CasesList.jsx`, `routes/cases.js` |
| RF-04.2 | Máquina de estados: ABIERTO → EN_TALLER → TEMP_REPLACED → RESUELTO | `anomalyService.js`                |
| RF-04.3 | Resolución requiere notas ≥ 5 caracteres                           | `anomalyService.js`                |
| RF-04.4 | Reemplazo temporal requiere código del extintor sustituto          | `anomalyService.js`                |

### RF-05: Autenticación y usuarios

| ID      | Requisito                                                     | Módulo                                      |
| ------- | ------------------------------------------------------------- | ------------------------------------------- |
| RF-05.1 | Login local (email + contraseña Argon2id)                     | `routes/auth.js`, `authService.js`          |
| RF-05.2 | Login con Microsoft Entra ID (OIDC) con JIT provisioning      | `routes/auth.js`, `authService.js`          |
| RF-05.3 | Cambio rápido por PIN (4-6 dígitos) en dispositivo compartido | `routes/auth.js`, `QuickPinSwitchModal.jsx` |
| RF-05.4 | 5 roles con 27 permisos granulares                            | `permissions.js`                            |
| RF-05.5 | Alcance sectorial (restricción por sector/piso/edificio)      | `auth.js` (middleware)                      |
| RF-05.6 | Bloqueo por intentos fallidos (5 → 15 min)                    | `authService.js`                            |
| RF-05.7 | Revocación inmediata de sesiones                              | `authService.js`                            |

### RF-06: Funcionalidad offline

| ID      | Requisito                                                   | Módulo                       |
| ------- | ----------------------------------------------------------- | ---------------------------- |
| RF-06.1 | Encolamiento de inspecciones en IndexedDB cuando no hay red | `offlineQueue.js`            |
| RF-06.2 | Sincronización automática al recuperar conectividad         | `offlineQueue.js`, `App.jsx` |
| RF-06.3 | Cuarentena de inspecciones si el usuario fue desactivado    | `offlineQueue.js`            |
| RF-06.4 | Service Worker con cache de assets y fallback offline       | `sw.js`                      |

### RF-07: Integración M365

| ID      | Requisito                                                   | Módulo                  |
| ------- | ----------------------------------------------------------- | ----------------------- |
| RF-07.1 | Webhook a Power Automate cuando una inspección tiene fallas | `routes/inspections.js` |
| RF-07.2 | Sincronización con SharePoint (listas, bibliotecas)         | `routes/m365.js`        |

---

## 2. Requisitos No Funcionales

### RNF-01: Rendimiento

| ID       | Requisito                                                 | Implementación                           |
| -------- | --------------------------------------------------------- | ---------------------------------------- |
| RNF-01.1 | Inspección completa en < 30 segundos con buena señal      | Frontend optimizado, queries con índices |
| RNF-01.2 | Carga de lista de extintores en < 2 segundos              | Query directo a SQLite                   |
| RNF-01.3 | Compresión de fotos a JPEG 70% / 1200px max en el cliente | `offlineQueue.js`                        |

### RNF-02: Disponibilidad

| ID       | Requisito                                | Implementación                     |
| -------- | ---------------------------------------- | ---------------------------------- |
| RNF-02.1 | Funcionamiento offline para inspecciones | IndexedDB + Service Worker         |
| RNF-02.2 | Healthcheck cada 30 segundos             | Docker HEALTHCHECK + `/api/health` |
| RNF-02.3 | Restart automático del contenedor        | `restart: unless-stopped`          |

### RNF-03: Seguridad

| ID       | Requisito                                  | Implementación          |
| -------- | ------------------------------------------ | ----------------------- |
| RNF-03.1 | Hashing de contraseñas con Argon2id        | `authService.js`        |
| RNF-03.2 | Cookies httpOnly, secure, sameSite=lax     | `routes/auth.js`        |
| RNF-03.3 | Rate limiting: 10 login/15min, 300 API/min | `server/index.js`       |
| RNF-03.4 | CSP con Helmet                             | `server/index.js`       |
| RNF-03.5 | Inmutabilidad de inspecciones (HTTP 405)   | `routes/inspections.js` |
| RNF-03.6 | Auditoría append-only de toda mutación     | `auditService.js`       |

### RNF-04: Operación

| ID       | Requisito                                   | Implementación                   |
| -------- | ------------------------------------------- | -------------------------------- |
| RNF-04.1 | Backup consistente sin bloquear el servicio | `backupService.js` (VACUUM INTO) |
| RNF-04.2 | Métricas Prometheus para monitoreo          | `routes/metrics.js`              |
| RNF-04.3 | Logs estructurados en producción            | `middleware/logger.js`           |
| RNF-04.4 | Despliegue automatizado via CI/CD           | `.github/workflows/ci.yml`       |

---

## Archivos del código relacionados

- [server/routes/](file:///c:/antigravity/matafuegos/server/routes/) — Todos los módulos de API
- [server/services/](file:///c:/antigravity/matafuegos/server/services/) — Servicios de dominio
- [server/middleware/](file:///c:/antigravity/matafuegos/server/middleware/) — Auth, logger, errors
- [src/components/](file:///c:/antigravity/matafuegos/src/components/) — Componentes React
- [src/utils/offlineQueue.js](file:///c:/antigravity/matafuegos/src/utils/offlineQueue.js) — Cola offline
