# ==============================================================================
# Milicic S.A. - Script de Backup de Base de Datos SQLite (Windows PowerShell)
# ==============================================================================

param(
    [string]$DataDir = "c:\antigravity\matafuegos\data",
    [string]$BackupDir = "c:\antigravity\matafuegos\data\backups"
)

$ErrorActionPreference = "Stop"

$dbFile = Join-Path $DataDir "matafuegos.db"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

if (-not (Test-Path $dbFile)) {
    Write-Error "No se encontró el archivo de base de datos en $dbFile"
    exit 1
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$destFile = Join-Path $BackupDir "matafuegos_backup_$timestamp.db"
Write-Host "Iniciando respaldo de base de datos..." -ForegroundColor Cyan
Copy-Item -Path $dbFile -Destination $destFile -Force

Write-Host "Respaldo creado exitosamente: $destFile" -ForegroundColor Green
