# CHANGELOG | MILICIC FIRECONTROL 365

Todas las modificaciones notables de este proyecto están documentadas en este archivo según el estándar [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [2.5.0] - 2026-10-02 (Production Ready & Enterprise Hardening)

### Agregado

- **Fase 1 (Pruebas Unitarias de Lógica de Negocio)**:
  - 86 pruebas unitarias con Vitest cubriendo vencimientos IRAM 3517-2, años bisiestos (29 de febrero), zona horaria estricta `America/Argentina/Buenos_Aires`, cálculo de semáforo con prioridades, rondas mensuales, anomalías, reglas antifraude y validadores de datos.
  - Cobertura de lógica de negocio superior al 95%.
- **Fase 2 (Pruebas de API e Integración)**:
  - Pruebas con Supertest sobre base SQLite transaccional aislada.
  - Implementación de inmutabilidad estricta: `405 Method Not Allowed` al intentar editar o borrar inspecciones normativas.
  - Control de acceso por roles (RBAC: `ADMIN`, `INSPECTOR`, `LECTURA`).
  - Pruebas de importación y exportación de planillas Excel de 5 hojas compatibles con Microsoft 365.
- **Fase 3 (Pruebas End-to-End Playwright)**:
  - 48 pruebas E2E automatizadas sobre Chromium y WebKit en viewports de escritorio (1280x800) y móviles (360x640 y 390x844).
  - Verificación del flujo del inspector en 3 toques, registro con fotos, generación de etiquetas QR y sincronización offline.
- **Fase 4 (Accesibilidad y Rendimiento)**:
  - Integración de `axe-core` en pruebas E2E: 0 violaciones críticas o serias en Dashboard, Inspección, Inventario y Documentación.
  - Ajuste de contraste para tokens `--milicic-orange` (5.2:1) y `--status-pending-text` (7.2:1).
  - Code splitting optimizado con Rolldown en Vite 8: bundle reducido de 932 kB a 512 kB.
  - Benchmark de carga con Autocannon (20 conexiones concurrentes): 0 errores, 0 timeouts y p95 <= 27ms.
- **Fase 5 (Calidad de Código y Estándares)**:
  - Configuración estricta de ESLint 9 Flat Config, Prettier y `.editorconfig`.
  - Validación de payloads HTTP con esquemas Zod centralizados.
  - Manejo uniforme de errores en español sin filtrar trazas de stack internas.
  - Hooks de pre-commit con Husky y lint-staged.
- **Fase 6 (Seguridad y Resiliencia)**:
  - Cabeceras de seguridad con Helmet y Content-Security-Policy adaptada a cámara y PWA.
  - Rate limiting diferenciado (10 intentos / 15 min en login).
  - Validación binaria de magic bytes (`PK`/`ZIP` y `OLE2`) en subidas de Excel.
  - QRs criptográficos de 24 caracteres hexadecimales (96 bits de entropía).
  - Contenedor Docker configurado con usuario no-root `node`.
- **Fase 7 (Integración Continua CI/CD)**:
  - Pipeline GitHub Actions con caché, auditoría, linting, tests unitarios, API, E2E, Docker build y webhook automático a Dokploy en branch `main`.
  - Configuración de dependencias automatizadas con Dependabot.
- **Fase 8 (Operabilidad y Observabilidad)**:
  - Structured JSON Logger con identificador de petición `X-Request-ID`.
  - Healthcheck enriquecido en `/api/health` con verificación de base SQLite, integridad `PRAGMA quick_check`, memoria y espacio libre en disco.
  - Endpoint de métricas estándar Prometheus en `/api/metrics`.
  - Servicio de backups consistentes con `VACUUM INTO` y retención configurable.
  - CLI `scripts/backup-db.js` y `scripts/restore-db.js`.
- **Fase 9 (Documentación Técnica)**:
  - `ARQUITECTURA.md`, `RUNBOOK.md`, `GUIA_INSPECTOR.md`, `HALLAZGOS.md` y especificación OpenAPI.

---

## [2.0.0] - 2026-09-15

- Rediseño visual institucional basado en la Skill Milicic: Naranja Industrial, Slate Dark, tipografía corporativa.
- Flujo de inspección ergonómico con botón flotante "Todo OK" en la zona del pulgar.
- Motor de impresión de etiquetas QR con 30% de redundancia (Nivel H) y formato A4 / individual.
- Modo sin conexión (PWA) con almacenamiento en IndexedDB.

---

## [1.0.0] - 2026-08-01

- Lanzamiento inicial del sistema de gestión de extintores contra incendio con React, Express y SQLite.
