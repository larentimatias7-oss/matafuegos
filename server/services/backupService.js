/**
 * SQLite Consistent ACID Backup & Restore Service
 * Milicic FireControl 365
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { config } = require('../config');

/**
 * Ensures backup directory exists
 */
function getBackupDirectory() {
  const backupDir = config.BACKUP_DIR;
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
}

/**
 * Creates a consistent, ACID backup of the database using SQLite's native VACUUM INTO command.
 * Does not lock concurrent readers or writers and writes a compacted, valid SQLite file.
 * 
 * @param {DatabaseSync} targetDb - Active SQLite DatabaseSync instance
 * @param {Object} options - Backup options
 * @param {string} [options.customPath] - Optional custom destination path
 * @param {string} [options.prefix='backup'] - Prefix for timestamped file
 * @returns {{ path: string, sizeBytes: number, createdAt: string, durationMs: number }}
 */
function createBackup(targetDb, options = {}) {
  const start = Date.now();
  const backupDir = getBackupDirectory();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${options.prefix || 'firecontrol-backup'}-${timestamp}.sqlite`;
  const destPath = options.customPath || path.join(backupDir, filename);

  // If destination file already exists, delete it first (VACUUM INTO fails if file exists)
  if (fs.existsSync(destPath)) {
    fs.unlinkSync(destPath);
  }

  // Execute native SQLite VACUUM INTO
  try {
    targetDb.prepare('VACUUM INTO ?').run(destPath);
  } catch (err) {
    throw new Error(`[BACKUP ERROR] Falló la creación del backup consistente: ${err.message}`);
  }

  const stat = fs.statSync(destPath);
  const durationMs = Date.now() - start;

  // Verify the generated backup immediately
  const integrity = verifyBackupIntegrity(destPath);
  if (!integrity.ok) {
    fs.unlinkSync(destPath);
    throw new Error(`[BACKUP ERROR] El backup generado está corrupto: ${integrity.error}`);
  }

  return {
    path: destPath,
    filename: path.basename(destPath),
    sizeBytes: stat.size,
    createdAt: new Date().toISOString(),
    durationMs,
    integrityOk: true
  };
}

/**
 * Verifies that a backup file is a valid, readable SQLite database that passes PRAGMA integrity_check
 * 
 * @param {string} backupFilePath 
 * @returns {{ ok: boolean, error?: string, tableCount?: number }}
 */
function verifyBackupIntegrity(backupFilePath) {
  if (!fs.existsSync(backupFilePath)) {
    return { ok: false, error: 'El archivo de backup no existe' };
  }

  let testDb = null;
  try {
    testDb = new DatabaseSync(backupFilePath, { readOnly: true });
    const check = testDb.prepare('PRAGMA integrity_check;').get();
    if (check.integrity_check !== 'ok') {
      return { ok: false, error: `Fallo en integrity_check: ${check.integrity_check}` };
    }

    const tables = testDb.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").get();
    return { ok: true, tableCount: tables.count };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    if (testDb) {
      try { testDb.close(); } catch { /* ignore */ }
    }
  }
}

/**
 * Restores a verified backup file into a target destination.
 * 
 * @param {string} backupFilePath - Source backup path
 * @param {string} destinationDbPath - Target database path
 * @returns {{ ok: boolean, restoredPath: string, backupSource: string }}
 */
function restoreBackup(backupFilePath, destinationDbPath) {
  const verification = verifyBackupIntegrity(backupFilePath);
  if (!verification.ok) {
    throw new Error(`[RESTORE ERROR] El backup de origen no es válido: ${verification.error}`);
  }

  // Ensure destination directory exists
  const destDir = path.dirname(destinationDbPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // If a WAL or SHM file exists for the target, remove them so they don't corrupt the newly restored DB
  const walPath = `${destinationDbPath}-wal`;
  const shmPath = `${destinationDbPath}-shm`;
  try {
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    // Copy backup atomically
    fs.copyFileSync(backupFilePath, destinationDbPath);
  } catch (fsErr) {
    if (fsErr.code === 'EBUSY' || fsErr.code === 'EPERM') {
      throw new Error(
        `La base de datos de destino está bloqueada por un proceso en ejecución (${fsErr.code}).\n` +
        `Detenga el servicio o contenedor antes de proceder con la restauración:\n` +
        `   docker stop <container-id> (en Dokploy/Docker) o detenga el proceso Node.`
      );
    }
    throw fsErr;
  }

  return {
    ok: true,
    restoredPath: destinationDbPath,
    backupSource: backupFilePath,
    restoredAt: new Date().toISOString()
  };
}

/**
 * Lists all existing backups sorted by date (newest first)
 * 
 * @returns {Array<{ filename: string, path: string, sizeBytes: number, modifiedAt: Date }>}
 */
function listBackups() {
  const backupDir = getBackupDirectory();
  if (!fs.existsSync(backupDir)) return [];

  const files = fs.readdirSync(backupDir);
  return files
    .filter(f => f.endsWith('.sqlite'))
    .map(filename => {
      const fullPath = path.join(backupDir, filename);
      const stat = fs.statSync(fullPath);
      return {
        filename,
        path: fullPath,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime
      };
    })
    .sort((a, b) => b.modifiedAt - a.modifiedAt);
}

/**
 * Cleans up old backups exceeding retention limits.
 * 
 * @param {Object} options
 * @param {number} [options.keepCount=7] - Maximum number of recent backups to keep
 * @param {number} [options.maxAgeDays=30] - Max age in days before pruning
 * @returns {{ deletedCount: number, remainingCount: number }}
 */
function cleanOldBackups(options = {}) {
  const keepCount = options.keepCount !== undefined ? options.keepCount : 7;
  const maxAgeDays = options.maxAgeDays !== undefined ? options.maxAgeDays : 30;
  const backups = listBackups();

  let deletedCount = 0;
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  backups.forEach((b, index) => {
    const isExceedingCount = index >= keepCount;
    const isExceedingAge = (now - b.modifiedAt.getTime()) > maxAgeMs;

    if (isExceedingCount || isExceedingAge) {
      try {
        fs.unlinkSync(b.path);
        deletedCount++;
      } catch (err) {
        console.warn(`[BACKUP PURGE] No se pudo eliminar ${b.filename}: ${err.message}`);
      }
    }
  });

  return {
    deletedCount,
    remainingCount: backups.length - deletedCount
  };
}

module.exports = {
  createBackup,
  verifyBackupIntegrity,
  restoreBackup,
  listBackups,
  cleanOldBackups,
  getBackupDirectory
};
