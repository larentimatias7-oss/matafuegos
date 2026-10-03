# 🔄 Plan de Continuidad Operativa y Recuperación ante Desastres (DRP)

> **Para quién es**: Directores de TI, coordinadores de contingencias operativas e ingenieros de confiabilidad (SRE).  
> **Qué vas a entender al terminarlo**: Los objetivos métricos de recuperación (RPO y RTO), los árboles de decisión ante fallas críticas y los protocolos de respuesta para asegurar que el control de extintores nunca se detenga.

---

## 1. Métricas Objetivas del Servicio

| Métrica                            | Definición                        |                           Objetivo Comprometido (SLA)                           | Justificación Técnica                                                                                                                                                                                  |
| ---------------------------------- | --------------------------------- | :-----------------------------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **RPO** (Recovery Point Objective) | Máxima pérdida tolerable de datos | **< 24 horas** (en catástrofe de disco)<br>**0 minutos** (en crash del proceso) | El modo WAL garantiza atomicidad total en transacciones; los backups automáticos nocturnos cubren fallas físicas de hardware. Además, las inspecciones offline permanecen en los dispositivos móviles. |
| **RTO** (Recovery Time Objective)  | Tiempo para restaurar el servicio |                                 **< 5 minutos**                                 | La imagen Docker pesa menos de 150 MB y el script `npm run restore` recupera la base SQLite en segundos.                                                                                               |

---

## 2. Escenarios de Falla Crítica y Protocolos de Respuesta

### Escenario A: Caída Global de Microsoft Entra ID (OIDC)

- **Síntoma**: El botón "Ingresar con Microsoft" arroja error 500/504 o la página de Microsoft no responde.
- **Acción Inmediata**: Habilitar el acceso local (`AUTH_LOCAL_ENABLED=true` si estaba restringido). Los supervisores e inspectores con contraseña local o PIN continúan operando normalmente.
- **Impacto Operativo**: Nulo para inspecciones en campo.

### Escenario B: Pérdida Total de Conectividad a Internet en Planta / Obra

- **Síntoma**: Los dispositivos móviles de los inspectores se quedan sin señal 3G/4G/WiFi.
- **Respuesta del Sistema**: La PWA conmuta de inmediato a modo offline; las lecturas de QR y checklists se almacenan en el IndexedDB local del navegador sin interrupción del trabajo.
- **Resolución**: Al retornar al campamento o zona con red, la sincronización se dispara de forma automática.

### Escenario C: Corrupción Severa del Archivo SQLite (`SQLITE_CORRUPT`)

- **Síntoma**: `GET /api/health` retorna `status: "unhealthy"` con `integrity: "failed"`.
- **Protocolo de Acción**:
  1. Detener el contenedor: `docker compose down`.
  2. Ejecutar restauración del último backup íntegro: `npm run restore`.
  3. Verificar integridad con `sqlite3 /data/matafuegos.db "PRAGMA integrity_check;"`.
  4. Reiniciar el servicio: `docker compose up -d`.

### Escenario D: Falla de Hardware o Servidor Físico en Dokploy

- **Respuesta**: El orquestador Dokploy o Docker Compose (`restart: unless-stopped`) reinicia el contenedor de manera automática. Al utilizar volúmenes mapeados, no hay pérdida de estado.

---

## Archivos del código relacionados

- [`server/db.js`](file:///c:/antigravity/matafuegos/server/db.js) — Integridad de SQLite y modo WAL.
- [`src/utils/offlineQueue.js`](file:///c:/antigravity/matafuegos/src/utils/offlineQueue.js) — Resiliencia offline en cliente.
- [`scripts/restore-db.js`](file:///c:/antigravity/matafuegos/scripts/restore-db.js) — Restauración rápida de backups.
