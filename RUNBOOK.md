# RUNBOOK OPERATIVO | MILICIC FIRECONTROL 365

Manual de operaciones de infraestructura, mantenimiento, copias de seguridad, resolución de incidencias y actualización en producción.

---

## 1. Copias de Seguridad (Backups Consistentes)

El sistema utiliza la instrucción nativa `VACUUM INTO ?` de SQLite, que genera un archivo `.sqlite` completamente consistente, ACID y compactado, **sin bloquear las lecturas o escrituras de los inspectores en campo**.

### 1.1 Ejecución Manual de Backup

Dentro del contenedor o servidor:

```bash
node scripts/backup-db.js
```

Salida esperada:

```text
====================================================
🧯 Milicic FireControl 365 - Backup Consistente SQLite
====================================================
📦 Iniciando VACUUM INTO consistente...
✅ Backup generado exitosamente:
   - Archivo: firecontrol-backup-2026-10-02T19-51-09-461Z.sqlite
   - Tamaño: 248.00 KB
   - Duración: 7 ms
   - Integridad: OK (PRAGMA integrity_check verificado)
🧹 Poda de retención: se eliminaron 0 backups antiguos.
📊 Total de backups disponibles: 5
====================================================
```

### 1.2 Programación Automatizada (Cron en Servidor o Dokploy)

Agregar la siguiente entrada al crontab del host o tarea programada de Dokploy para ejecutar un backup diario a las 03:00 AM:

```bash
0 3 * * * docker exec milicic-matafuegos node scripts/backup-db.js >> /var/log/firecontrol-backups.log 2>&1
```

### 1.3 Política de Retención

- **Cantidad retenida**: Últimos 7 backups diarios mínimos.
- **Ventana de retención temporal**: 30 días calendario.
- Los archivos se almacenan dentro del volumen persistente en `/data/backups/`.

---

## 2. Procedimiento de Restauración (Disaster Recovery)

> [!WARNING]
> La restauración de una base de datos SQLite en producción debe realizarse con el servicio detenido temporalmente para evitar corrupción por bloqueos de archivos WAL (`EBUSY`).

### Pasos de Restauración:

1. **Detener el Contenedor o Servicio**:
   ```bash
   # En Dokploy o Docker:
   docker stop milicic-matafuegos
   ```
2. **Listar los Backups Disponibles**:
   ```bash
   ls -la /data/backups/
   ```
3. **Ejecutar la Restauración**:
   ```bash
   node scripts/restore-db.js /data/backups/firecontrol-backup-YYYY-MM-DD.sqlite --force
   ```
   El script verifica automáticamente `PRAGMA integrity_check` antes de sobreescribir el archivo de producción.
4. **Reiniciar el Contenedor**:
   ```bash
   docker start milicic-matafuegos
   ```
5. **Verificar el Estado de Salud**:
   ```bash
   curl http://localhost:3000/api/health
   # Debe responder "status": "healthy" y "checks.database.status": "healthy"
   ```

---

## 3. Actualización de Versión en Dokploy (Zero Data Loss)

Gracias al montaje de volumen persistente en `/data`, el código de la aplicación puede reconstruirse o actualizarse en cualquier momento sin perder datos:

1. **Push a la rama `main` de GitHub**:
   - El pipeline de GitHub Actions compila, corre lint, tests unitarios, de API y E2E.
   - Si todo está en verde, envía un webhook a Dokploy para disparar el redeploy.
2. **En Dokploy**:
   - Dokploy descarga el commit, ejecuta `docker build`, detiene el contenedor anterior y levanta el nuevo contenedor montando exactamente el mismo volumen `/data`.
3. **Migraciones Automáticas Idempotentes**:
   - Al iniciar, `server/db.js` corre `initSchema()` y `ensureColumn()` sobre las tablas existentes sin borrar información preexistente.

---

## 4. Guía de Resolución de Incidencias Frecuentes (Troubleshooting)

### 4.1 Error: `SQLITE_BUSY: database is locked`

- **Causa**: Múltiples escrituras simultáneas intentaron competir sin timeout adecuado.
- **Diagnóstico**: Revisar si algún proceso externo está accediendo directamente al archivo `matafuegos.db`.
- **Solución**: El sistema ya tiene configurado `PRAGMA busy_timeout = 5000;` y modo `WAL`. Si persiste, verificar que el volumen no esté montado sobre un sistema de archivos de red no compatible con bloqueos POSIX (evitar NFSv3; usar volúmenes locales SSD o bind mounts estándar).

### 4.2 Error: La cámara no abre en el celular del inspector

- **Causa**: Las políticas de seguridad de los navegadores móviles (Chrome/Safari) **bloquean el acceso a la cámara (`getUserMedia`) si el sitio no se sirve sobre HTTPS**.
- **Solución**:
  - Asegurar que la URL sea `https://` y no `http://`.
  - En pruebas locales en la red LAN de la empresa, usar los certificados de desarrollo provistos en `certs/` o ingresar vía túnel seguro Cloudflare.
  - Verificar que el usuario haya aceptado el permiso de cámara en el navegador móvil.

### 4.3 Inspecciones guardadas sin conexión no sincronizan

- **Causa**: Pérdida de conectividad persistente o token de sesión expirado.
- **Diagnóstico**: Abrir la pestaña de inspección en el celular. Se observará la notificación amarilla _"Inspecciones pendientes de sincronización (N)"_.
- **Solución**:
  - Tocar el botón manual **"Sincronizar Ahora"**.
  - Si el servidor reporta error de autenticación, iniciar sesión nuevamente; las inspecciones pendientes guardadas en IndexedDB **no se pierden al cerrar sesión**.

### 4.4 Alerta de Espacio en Disco en `/data`

- **Causa**: Acumulación de backups antiguos o fotos de anomalías.
- **Diagnóstico**: Consultar `GET /api/health`. El campo `checks.storage.freePercent` indicará el porcentaje disponible.
- **Solución**:
  - Correr `node scripts/backup-db.js` para que ejecute la poda automática de backups de más de 30 días.
  - Si es necesario, ampliar el volumen asignado en el servidor host.

---

## 5. Monitoreo y Observabilidad

### 5.1 Endpoint de Salud (`GET /api/health`)

Devuelve código HTTP 200 en estado normal o 503 si la base de datos no responde.
Campos monitoreados:

- `checks.database.status`: `healthy` / `unhealthy`.
- `checks.database.integrity`: Resultado de `PRAGMA quick_check`.
- `checks.storage.freeMb` y `freePercent`: Espacio en el volumen `/data`.
- `checks.memory.heapUsedMb`: Memoria utilizada por el proceso Node.js.

### 5.2 Scraping con Prometheus (`GET /api/metrics`)

Métricas exportadas para dashboards de Grafana:

- `firecontrol_inspections_total` (Contador)
- `firecontrol_inspections_today` (Gauge)
- `firecontrol_extinguishers_total` (Gauge)
- `firecontrol_round_coverage_ratio` (Gauge)
- `firecontrol_http_requests_total` (Contador)
- `firecontrol_http_errors_total` (Contador)
- `firecontrol_uptime_seconds` (Gauge)
