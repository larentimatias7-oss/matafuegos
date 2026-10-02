#!/usr/bin/env bash
# ==============================================================================
# Milicic S.A. - Script de Backup de Base de Datos SQLite (Matafuegos)
# Uso en Dokploy / Docker: docker exec -it <container_id> /app/scripts/backup.sh
# O ejecutado desde el host montando el volumen /data
# ==============================================================================

set -euo pipefail

DATA_DIR="${DATA_DIR:-/data}"
BACKUP_DIR="${BACKUP_DIR:-$DATA_DIR/backups}"
DB_FILE="$DATA_DIR/matafuegos.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/matafuegos_backup_${TIMESTAMP}.db"

echo "=== Iniciando Backup de Base de Datos Milicic Matafuegos ==="
echo "Origen: $DB_FILE"

if [ ! -f "$DB_FILE" ]; then
    echo "ERROR: El archivo de base de datos $DB_FILE no existe."
    exit 1
fi

mkdir -p "$BACKUP_DIR"

# SQLite hot-backup usando CLI de sqlite3 si está disponible, o copia segura
if command -v sqlite3 >/dev/null 2>&1; then
    echo "Ejecutando sqlite3 .backup online..."
    sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
else
    echo "Copiando archivo de base de datos de forma directa..."
    cp "$DB_FILE" "$BACKUP_FILE"
fi

# Comprimir en gzip para optimizar almacenamiento
gzip -f "$BACKUP_FILE"
echo "Backup completado con éxito: ${BACKUP_FILE}.gz"

# Retener solo los últimos 14 backups diarios
echo "Purgando backups antiguos (> 14 días)..."
find "$BACKUP_DIR" -name "matafuegos_backup_*.db.gz" -type f -mtime +14 -delete || true

echo "=== Proceso de Backup finalizado exitosamente ==="
