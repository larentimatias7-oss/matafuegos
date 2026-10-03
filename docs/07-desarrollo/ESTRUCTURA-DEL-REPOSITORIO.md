# 📂 Estructura del Repositorio y Arquitectura de Carpetas

> **Para quién es**: Desarrolladores que necesitan orientarse rápidamente en el árbol de directorios de Milicic FireControl 365.  
> **Qué vas a entender al terminarlo**: La organización modular del backend, del frontend React, de las pruebas automatizadas, scripts de mantenimiento y documentación técnica.

---

## 1. Árbol de Carpetas Comentado

```text
matafuegos/
├── server/                         # Backend en Node.js 22 (CommonJS)
│   ├── index.js                    # Servidor Express, pipeline de middlewares y montaje de rutas
│   ├── config.js                   # Validación y tipado de variables de entorno
│   ├── db.js                       # Conexión SQLite (node:sqlite DatabaseSync), WAL mode y DDL
│   ├── logger.js                   # Logger estructurado con X-Request-ID (JSON o texto)
│   ├── config/
│   │   └── permissions.js          # Fuente única de verdad de la matriz RBAC
│   ├── middleware/
│   │   ├── auth.js                 # authenticate, requirePermiso, requireSectorScope, verifyNotLastSuperadmin
│   │   └── errorHandler.js         # Manejador centralizado de errores y 404
│   ├── routes/                     # Controladores de rutas de la API REST
│   │   ├── auth.js                 # Login, cambio de PIN, logout, sesiones
│   │   ├── users.js                # CRUD de usuarios, roles y alcance sectorial
│   │   ├── audit.js                # Consulta y exportación de bitácora inmutable
│   │   ├── extinguishers.js        # Inventario de extintores y exportaciones
│   │   ├── inspections.js          # Control mensual inmutable (IRAM 3517-2)
│   │   ├── rounds.js               # Ciclo de vida de rondas mensuales
│   │   ├── cases.js                # Gestión de anomalías y derivación a taller
│   │   ├── qr.js                   # Generación de códigos QR y redirección /m/:id
│   │   ├── health.js               # Endpoint /api/health
│   │   ├── metrics.js              # Endpoint /api/metrics (Prometheus)
│   │   └── m365.js                 # Webhook a Teams y Power Automate
│   ├── services/                   # Lógica pura de negocio y dominio
│   │   ├── authService.js          # Hashing Argon2id, bloqueo temporal, sesiones
│   │   ├── antifraudService.js     # Reglas heurísticas antifraude en inspecciones
│   │   ├── expirationService.js    # Cálculo de vencimientos de carga y PH (IRAM)
│   │   ├── casesService.js         # Máquina de estados de casos de falla
│   │   ├── roundsService.js        # Lógica de rondas y cobertura
│   │   ├── auditService.js         # Inserción append-only de auditoría
│   │   └── m365Service.js          # Integración HTTP con Microsoft 365
│   ├── validators/                 # Validación de esquemas con Zod
│   └── migrations/                 # Migraciones versionadas y reversibles de base de datos
│
├── src/                            # Frontend en React 19 + Vite (ESM)
│   ├── main.jsx                    # Punto de entrada ReactDOM
│   ├── App.jsx                     # Router hash, orquestación de vistas y estado
│   ├── index.css                   # Sistema de diseño Milicic, variables CSS y dark/light
│   ├── components/                 # Componentes de UI modulares
│   │   ├── Navbar.jsx              # Barra superior con identidad institucional y menú
│   │   ├── Dashboard.jsx           # Panel de control de KPIs y cobertura mensual
│   │   ├── ExtinguisherList.jsx    # Grilla de inventario con filtros y semáforos
│   │   ├── ExtinguisherDetail.jsx  # Ficha técnica individual y controles históricos
│   │   ├── InspectionForm.jsx      # Formulario ágil de inspección en <= 3 toques
│   │   ├── Scanner.jsx             # Lector de QR mediante cámara web/móvil
│   │   ├── UsersList.jsx           # Gestión de usuarios y roles
│   │   ├── UserModal.jsx           # Creación y edición de usuario y alcance
│   │   ├── UserProfileModal.jsx    # Mi perfil, cambio de contraseña y PIN
│   │   ├── AuditViewer.jsx         # Visor y filtro de bitácora de auditoría
│   │   ├── LoginModal.jsx          # Login con Microsoft Entra ID o Local
│   │   ├── QuickPinSwitchModal.jsx # Cambio rápido por PIN en terminal compartida
│   │   └── ExcelExportButton.jsx   # Generación de planillas Excel oficiales
│   └── utils/
│       └── offlineQueue.js         # Cola de inspecciones offline en IndexedDB y cuarentena
│
├── tests/                          # Suite de pruebas automatizadas
│   ├── unit/                       # Pruebas unitarias de servicios y validadores (Vitest)
│   ├── integration/                # Pruebas de integración API, RBAC, IDOR e inmutabilidad
│   ├── e2e/                        # Pruebas End-to-End multi-dispositivo (Playwright)
│   └── perf/                       # Pruebas de carga y estrés con Autocannon
│
├── scripts/                        # Utilidades operativas y de mantenimiento
│   ├── backup-db.js                # Generador de backup caliente con VACUUM INTO
│   ├── restore-db.js               # Restaurador asistido de copias de seguridad
│   └── crear-admin.js              # Inicializador de emergencia de Superadmin
│
├── docs/                           # Documentación técnica completa (Docs-as-Code)
├── data/                           # Directorio persistente de SQLite (ignorado en git)
├── Dockerfile                      # Manifiesto multi-stage de contenedor Docker
└── docker-compose.yml              # Orquestación de producción
```

---

## Archivos del código relacionados

- [`package.json`](file:///c:/antigravity/matafuegos/package.json)
- [`server/index.js`](file:///c:/antigravity/matafuegos/server/index.js)
- [`src/App.jsx`](file:///c:/antigravity/matafuegos/src/App.jsx)
