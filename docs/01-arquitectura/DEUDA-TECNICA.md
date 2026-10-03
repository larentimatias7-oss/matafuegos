# 💳 Deuda Técnica y Riesgos Conocidos

> **Para quién es**: Arquitectos de software, tech leads y desarrolladores que planifican mejoras, refactorizaciones y escalabilidad del sistema.  
> **Qué vas a entender al terminarlo**: Cuáles son las limitaciones arquitectónicas actuales de Milicic FireControl 365, los compromisos de diseño asumidos (trade-offs), los riesgos de seguridad y operación conocidos, y el backlog priorizado de mejoras técnicas.

---

## 1. Matriz de Deuda Técnica Priorizada

| ID         | Área                   | Descripción                                                                                       | Impacto                                                                  | Esfuerzo                   | Prioridad |
| ---------- | ---------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------- | :-------: |
| **DT-001** | Persistencia           | SQLite embebido limita el escalamiento horizontal (single-node)                                   | Alto a largo plazo (si se suman múltiples plantas con alta concurrencia) | Alto (migrar a PostgreSQL) | **Media** |
| **DT-002** | Seguridad / Integridad | Falta de anclaje externo de hashes criptográficos (ej. RFC 3161 Timestamping o Git commit diario) | Medio (auditorías forenses externas rigurosas)                           | Bajo                       | **Alta**  |
| **DT-003** | Sesiones               | Depuración de sesiones expiradas en `sesiones` requiere tarea cron automática                     | Bajo (crecimiento innecesario de filas)                                  | Bajo                       | **Media** |
| **DT-004** | Offline                | Resolución de conflictos en sincronización offline asume "last-write-wins" para extintores        | Medio (si dos inspectores editan simultáneamente sin red)                | Medio                      | **Baja**  |
| **DT-005** | Notificaciones         | Fallo en webhook de M365 reintenta en memoria sin cola persistente distribuida                    | Medio (pérdida de alerta inmediata si el contenedor reinicia)            | Medio                      | **Media** |
| **DT-006** | Testing                | Pruebas de integración Vitest requieren `fileParallelism: false` por locking de SQLite            | Bajo (tiempo de CI incrementado ligeramente)                             | Bajo                       | **Baja**  |

---

## 2. Detalle de Riesgos y Limitaciones

### DT-001: Escalabilidad Mononodo (SQLite WAL)

- **Contexto**: Se optó por SQLite en modo WAL (`server/db.js`) por simplicidad operativa, cero configuración en Dokploy y rendimiento óptimo para el volumen de Milicic (130 extintores, ~10 inspectores).
- **Riesgo**: Si la empresa decide utilizar la misma instancia para todas las operaciones mineras y civiles del país con cientos de inspectores concurrentes en el mismo segundo, el cerrojo de escritura único de SQLite (`SQLITE_BUSY`) podría degradar el tiempo de respuesta.
- **Mitigación actual**: `PRAGMA busy_timeout = 5000` y transacciones cortas con statements preparados.
- **Acción futura**: Abstraer la capa DAO para permitir driver PostgreSQL si la concurrencia supera los 50 writes/segundo sostenidos.

### DT-002: Anclaje Externo de Evidencia Criptográfica

- **Contexto**: Cada inspección y cierre de ronda se registra con snapshot inmutable y hashes SHA-256.
- **Riesgo**: Un atacante con acceso `root` al sistema operativo o volumen de SQLite podría teóricamente modificar una fila y recalcular hashes hacia adelante si no hay un testigo externo.
- **Mitigación recomendada**: Exportar diariamente un digest Merkle Root al canal seguro de auditoría o repositorio Git externo autenticado.

### DT-003: Limpieza Automática de Sesiones y Auditoría

- **Contexto**: Las sesiones revocadas y expiradas se mantienen en la tabla `sesiones` para trazabilidad de seguridad forense.
- **Riesgo**: A lo largo de los años, la tabla puede acumular cientos de miles de filas obsoletas.
- **Acción recomendada**: Implementar un job programado (`node-cron` o endpoint interno seguro) que archive o purgue sesiones inactivas de más de 90 días.

---

## Archivos del código relacionados

- [`server/db.js`](file:///c:/antigravity/matafuegos/server/db.js) — Configuración de SQLite, WAL mode y busy timeout.
- [`server/services/authService.js`](file:///c:/antigravity/matafuegos/server/services/authService.js) — Manejo de sesiones y revocación.
- [`server/routes/m365.js`](file:///c:/antigravity/matafuegos/server/routes/m365.js) — Webhook a Power Automate.
- [`server/middleware/auth.js`](file:///c:/antigravity/matafuegos/server/middleware/auth.js) — Autenticación y control RBAC.
