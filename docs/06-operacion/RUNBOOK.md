# 📘 Manual de Operaciones (Runbook)

> **Para quién es**: Ingenieros de DevOps, administradores de infraestructura y personal de guardia técnica.  
> **Qué vas a entender al terminarlo**: Los procedimientos paso a paso para el arranque, mantenimiento diario, copias de respaldo, restauración ante desastres, rotación de credenciales y recuperación de emergencia de acceso del Superadmin.

---

## 1. Operación Diaria del Servicio

### 1.1 Inicio y Parada del Contenedor

```bash
# Iniciar la plataforma en segundo plano
docker compose up -d

# Ver el estado y consumo de recursos
docker compose ps
docker stats milicic-firecontrol

# Ver logs en tiempo real
docker compose logs -f --tail=100

# Reinicio controlado
docker compose restart
```

### 1.2 Verificación de Salud

```bash
# Comprobar el endpoint de healthcheck oficial
curl -s http://localhost:3000/api/health | jq .
```

Debe retornar código HTTP 200 con `status: "healthy"` y comprobación de base de datos íntegra.

---

## 2. Gestión de Copias de Seguridad (Backups)

El sistema utiliza la instrucción de bajo nivel `VACUUM INTO` de SQLite para generar copias en caliente consistentes sin detener las operaciones.

### 2.1 Ejecución Manual de Backup

```bash
npm run backup
```

Esto genera un archivo con timestamp: `data/backups/matafuegos_backup_YYYYMMDD_HHMMSS.db`.

### 2.2 Restauración ante Corrupción o Desastre

```bash
# Listar los backups disponibles y restaurar el más reciente
npm run restore
```

_El script solicita confirmación y genera automáticamente una copia de seguridad preventiva del archivo actual antes de sustituirlo._

---

## 3. Procedimiento de Recuperación de Emergencia del Superadmin

Si se pierden todas las credenciales de los administradores o Microsoft Entra ID sufre una caída global prolongada:

```bash
# En el servidor host o dentro del contenedor:
npm run crear-admin
```

El script solicitará por consola o argumentos el email, contraseña temporal y datos del administrador para inicializar o restablecer un Superadmin activo con acceso garantizado.

---

## 4. Rotación de Secretos

Para rotar secretos corporativos:

1. Actualizar las variables correspondientes en el archivo `.env` o en el panel de Dokploy:
   - `SESSION_SECRET` (invalida todas las sesiones activas actuales, forzando re-login seguro).
   - `ENTRA_CLIENT_SECRET` (generado en el portal de Azure / Entra ID).
2. Reiniciar el contenedor:
   ```bash
   docker compose up -d --force-recreate
   ```

---

## Archivos del código relacionados

- [`scripts/backup-db.js`](file:///c:/antigravity/matafuegos/scripts/backup-db.js) — Script de generación de backups SQLite en caliente.
- [`scripts/restore-db.js`](file:///c:/antigravity/matafuegos/scripts/restore-db.js) — Script de restauración asistida.
- [`scripts/crear-admin.js`](file:///c:/antigravity/matafuegos/scripts/crear-admin.js) — Inicializador de emergencia de Superadmin.
- [`docker-compose.yml`](file:///c:/antigravity/matafuegos/docker-compose.yml) — Manifiesto de despliegue Docker.
