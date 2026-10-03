# 🔍 Hallazgos de Documentación

> Observaciones, ambigüedades y posibles defectos detectados durante la auditoría del código.
> Última actualización: 2026-10-02

---

## H-001: Dos tablas de auditoría coexisten

**Archivos**: `server/db.js:108-117`, `server/migrations/001_multi_org_and_users.js:143-162`, `server/services/auditService.js:50-73`.

**Observación**: Existen dos tablas de auditoría:

1. `audit_logs` (legacy, creada en `db.js`).
2. `auditoria` (nueva, creada en migración 001).

El `auditService.recordAudit()` **escribe en ambas** por retrocompatibilidad. Esto duplica datos de auditoría.

**Impacto**: Consumo innecesario de almacenamiento. Potencial confusión sobre cuál tabla consultar.

**Recomendación**: Evaluar la eliminación de `audit_logs` en una migración futura, una vez que todos los consumidores lean de `auditoria`.

---

## H-002: Migraciones inline en `db.js` + migraciones versionadas en `migrations/`

**Archivos**: `server/db.js:136-166` (ensureColumn), `server/migrations/index.js`.

**Observación**: La función `initSchema()` en `db.js` contiene migraciones "inline" con `ensureColumn()` (ej: `public_id`, `building`, `manufacturer`, campos de inspección). Estas corren **antes** que las migraciones versionadas de `migrations/`.

**Impacto**: Dos mecanismos de migración coexisten. Las migraciones inline no tienen rollback ni registro en `schema_migrations`.

**Recomendación**: A futuro, consolidar las migraciones inline como migraciones versionadas con número, para tener un único punto de control.

---

## H-003: Rate limiter en memoria (no persistente)

**Archivo**: `server/index.js:41-95`.

**Observación**: Los contadores de rate limiting (login y API general) se almacenan en `Map` en memoria. Se resetean al reiniciar el servidor o el contenedor.

**Impacto**: Bajo en el contexto actual (un solo contenedor, pocos usuarios). Podría ser un problema si se implementa auto-scaling.

---

## H-004: Schema Zod `ExtinguisherSchema.code` permite `MF-\d{3,}` pero el validador de negocio solo acepta `MF-\d{3,4}`

**Archivos**: `server/validators/schemas.js:7` vs `server/validators/dataValidators.js:6`.

**Observación**:

- Zod schema: `/^MF-\d{3,}$/` (3 o más dígitos, sin límite superior).
- Data validator: `/^MF-\d{3,4}$/i` (3 o 4 dígitos, máximo MF-9999).

**Impacto**: Inconsistencia en la validación. Un código como `MF-12345` pasaría el schema Zod pero fallaría en el data validator (o viceversa, según cuál se ejecute primero).

**Recomendación**: Unificar la regex en ambos lugares a `/^MF-\d{3,4}$/i`.

---

## H-005: Seed de 130 extintores con fabricantes hardcodeados

**Archivo**: `server/db.js:269-361`.

**Observación**: La función `seed130Extinguishers()` contiene datos de prueba con fabricantes, áreas y fechas calculadas algorítmicamente. No se ejecuta en producción (`IS_PROD && ALLOW_SEED !== 'true'`), pero los datos están hardcodeados en el código.

**Impacto**: Ninguno en producción. Datos de prueba suficientemente realistas para desarrollo.

---

## H-006: `ExtinguisherSchema` define `status` con enum diferente al usado en el código

**Archivo**: `server/validators/schemas.js:33`.

**Observación**: El schema Zod define estados válidos como `['OPERATIVO', 'FUERA_DE_SERVICIO', 'EN_TALLER', 'DE_BAJA']`. El seed y el código de negocio también usan estos estados. Parece consistente.

**Estado**: ✅ Sin problema detectado. Registrado para referencia.

---

## H-007: `CaseUpdateSchema` define estado `REEMPLAZADO` pero el servicio usa `TEMP_REPLACED`

**Archivos**: `server/validators/schemas.js:57` vs `server/services/anomalyService.js:9`.

**Observación**:

- Zod: `z.enum(['ABIERTO', 'EN_TALLER', 'REEMPLAZADO', 'RESUELTO'])`
- AnomalyService: `CASE_STATUSES.TEMP_REPLACED = 'TEMP_REPLACED'`

**Impacto**: Un request con `status: 'TEMP_REPLACED'` pasaría la validación del servicio pero podría ser rechazado por el schema si este se aplica primero (o viceversa).

**Recomendación**: Alinear los nombres. Probable intención: `REEMPLAZADO` es la versión en español y `TEMP_REPLACED` la interna. Elegir una convención.

---

## H-008: `checkUserSectorScope` permite acceso global si no hay sectores asignados

**Archivo**: `server/middleware/auth.js:241`.

**Observación**: `if (sectores.length === 0) return true;` — un usuario sin sectores asignados tiene **alcance global**. Esto es intencional para el flujo actual (usuarios recién creados sin restricción), pero podría ser un riesgo si se esperara lo contrario.

**Estado**: ✅ Comportamiento documentado como intencional (`isGlobalScope: true`).

---

## H-009: El campo `synced_m365` en inspecciones no se actualiza tras envío exitoso al webhook

**Archivo**: `server/routes/inspections.js:22-43`.

**Observación**: La función `notifyM365Webhook()` envía datos al webhook pero no actualiza el campo `synced_m365` en la tabla `inspections`. El campo existe pero se inicializa en 0 y no se modifica.

**Impacto**: No se puede determinar qué inspecciones fueron notificadas exitosamente a M365.

**Recomendación**: Actualizar `synced_m365 = 1` tras un envío exitoso del webhook.

---

## H-010: OpenAPI spec en `docs/openapi.yaml` puede estar desactualizada

**Archivo**: `docs/openapi.yaml`.

**Observación**: Existe un archivo OpenAPI pero no se verificó si está sincronizado con los endpoints reales. No hay mecanismo de generación automática.

**Recomendación**: Verificar y mantener manualmente, o generar desde el código.

---

## H-011: Documentación existente en raíz vs `/docs`

**Archivos raíz**: `ARQUITECTURA.md`, `CHANGELOG.md`, `DESIGN.md`, `GUIA_INSPECTOR.md`, `HALLAZGOS.md`, `README.md`, `RUNBOOK.md`.

**Observación**: Varios documentos técnicos están en la raíz del proyecto junto al README, mientras que la documentación técnica nueva se organiza en `docs/`. También existe una carpeta `documentacion/` servida como portal web.

**Recomendación**: Consolidar la documentación en `docs/` y mantener solo el `README.md` en la raíz con enlaces a `docs/`.
