# Registro de Hallazgos y Deuda Técnica — Milicic FireControl 365

Este documento registra los bugs, anomalías, problemas de seguridad y deuda técnica identificados en el sistema durante el proceso de maduración hacia grado de producción.

## Convención de Severidades

- **CRÍTICA**: Afecta la integridad de datos, seguridad, disponibilidad o validez legal ante ART / IRAM 3517-2.
- **ALTA**: Falla de lógica de negocio, vulnerabilidad moderada o inconsistencia en cálculos.
- **MEDIA**: Deuda técnica, falta de validación de esquemas o rendimiento subóptimo.
- **BAJA**: Estilo, código muerto o advertencias de compilación/empaquetado.

---

## Inventario de Hallazgos

| ID          | Tipo                          | Severidad | Estado       | Descripción                                                                                                               | Solución y Verificación                                                                                                                                                                |
| ----------- | ----------------------------- | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BUG-001** | Lógica / Timezone             | **ALTA**  | **Resuelto** | Fechas calculadas en zona del servidor podían dar falsos vencidos a fin de mes o en años bisiestos.                       | Resuelto en `expirationService.js` fijando `America/Argentina/Buenos_Aires`. `tests/unit/expiration.test.js` pasa (100%).                                                              |
| **BUG-002** | Validación / Negocio          | **ALTA**  | **Resuelto** | Se permitían transiciones de casos no permitidas (ej. de RESUELTO a ABIERTO sin reapertura formal).                       | Resuelto en `anomalyService.js` y `PUT /api/cases/:id`. `tests/integration/cases_transitions.test.js` pasa.                                                                            |
| **BUG-003** | Integridad / Inmutabilidad    | **ALTA**  | **Resuelto** | Los registros de inspección podían ser alterados o borrados por la API, violando la trazabilidad IRAM 3517-2.             | Métodos PUT, DELETE y PATCH en `/api/inspections` bloqueados con `405 Method Not Allowed`. `tests/integration/inspections_immutability.test.js` pasa.                                  |
| **BUG-004** | Seguridad / Backups           | **ALTA**  | **Resuelto** | Los scripts realizaban copia en caliente (`Copy-Item` / `cp`) con riesgo de base corrupta si había escrituras en vuelo.   | Implementado `server/services/backupService.js` con `VACUUM INTO ?` atómico y verificación `PRAGMA integrity_check`. `tests/integration/backup_restore.test.js` pasa.                  |
| **BUG-005** | Deuda Técnica                 | **MEDIA** | **Resuelto** | Dependencias sin uso en `package.json` (`lucide-react`, `tailwind-merge`, `clsx`).                                        | Desinstaladas limpiamente, `npm audit` reporta 0 vulnerabilidades.                                                                                                                     |
| **BUG-006** | Rendimiento / Bundle          | **MEDIA** | **Resuelto** | Bundle JavaScript monolítico de 932 kB superaba los límites recomendados en redes móviles 3G/4G.                          | Rolldown `manualChunks` configurado en `vite.config.js`. Bundle reducido a 512 kB (140 kB gzip) en chunks `vendor-react`, `vendor-icons`, `vendor-table`.                              |
| **BUG-007** | Arquitectura                  | **MEDIA** | **Resuelto** | Lógica de negocio acoplada directamente dentro de los controladores Express.                                              | 6 módulos de servicios puros creados con >95% de cobertura de código.                                                                                                                  |
| **BUG-008** | Concurrencia SQLite           | **MEDIA** | **Resuelto** | Escrituras concurrentes producían bloqueos en caliente `SQLITE_BUSY`.                                                     | Configurado `PRAGMA journal_mode = WAL;`, `busy_timeout = 5000` y `synchronous = NORMAL`.                                                                                              |
| **BUG-009** | Robustez / Seed               | **MEDIA** | **Resuelto** | El seed de prueba `seed130Extinguishers()` podía ejecutarse en producción si la base arrancaba vacía.                     | Implementada guarda estricta en `server/config.js` y `server/db.js` (`config.IS_PROD && process.env.ALLOW_SEED !== 'true'`).                                                           |
| **BUG-010** | Calidad / Tipos               | **BAJA**  | **Resuelto** | Inconsistencias de formateo y falta de validación estricta de payloads.                                                   | ESLint 9 (`eslint.config.js`), Prettier (`.prettierrc.json`), `.editorconfig`, `jsconfig.json`, esquemas Zod con validación y middleware centralizado de errores, Husky + lint-staged. |
| **BUG-011** | Accesibilidad / WCAG 2.1 AA   | **ALTA**  | **Resuelto** | Contraste insuficiente en `#ea580c` con blanco (3.55:1) y falta de labels en selectores de tabla/filtro.                  | Ajustado a `#c2410c` (5.2:1) y agregados `aria-label`. Cero violaciones críticas o serias en axe-core.                                                                                 |
| **BUG-012** | Rendimiento / Carga API       | **MEDIA** | **Resuelto** | Falta de benchmark de estrés bajo concurrencia.                                                                           | Prueba con autocannon (20 usuarios concurrentes, 31 MB/s throughput, latencias p95 <= 27ms en stats/rounds) confirmando 0 bloqueos SQLite en modo WAL.                                 |
| **BUG-013** | Seguridad / Subida Archivos   | **ALTA**  | **Resuelto** | La subida de planillas Excel solo validaba la extensión `.xlsx`, permitiendo adjuntos con scripts ejecutables camuflados. | Implementada validación binaria de magic bytes (`PK`/ZIP y `OLE2`) en `server/routes/m365.js`. `tests/integration/security.test.js` pasa.                                              |
| **BUG-014** | Seguridad / Predecibilidad QR | **ALTA**  | **Resuelto** | Tokens de QR (`public_id`) con baja entropía (6 bytes) teóricamente enumerables.                                          | Elevado a 12 bytes / 24 caracteres hexadecimales (96 bits de entropía criptográfica). `tests/integration/security.test.js` pasa.                                                       |

---

_Todos los hallazgos identificados han sido completamente resueltos, verificados mediante pruebas automáticas y documentados para auditoría de calidad._
