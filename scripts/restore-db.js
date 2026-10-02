#!/usr/bin/env node
/**
 * Milicic FireControl 365 - SQLite Restore CLI
 * Usage: node scripts/restore-db.js <path-to-backup.sqlite> [--force]
 */

const path = require('path');
const { config } = require('../server/config');
const { restoreBackup, verifyBackupIntegrity } = require('../server/services/backupService');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Uso: node scripts/restore-db.js <ruta-al-backup.sqlite> [--force]');
  process.exit(1);
}

const backupPath = path.resolve(args[0]);
const force = args.includes('--force');

console.log('====================================================');
console.log('🧯 Milicic FireControl 365 - Restauración de Base SQLite');
console.log('====================================================');
console.log(`Origen: ${backupPath}`);
console.log(`Destino: ${config.DB_PATH}`);

if (!force && process.env.NODE_ENV === 'production') {
  console.error('ADVERTENCIA: Para restaurar en producción debe pasar la bandera --force.');
  process.exit(1);
}

try {
  console.log('🔍 Verificando integridad del archivo de backup...');
  const check = verifyBackupIntegrity(backupPath);
  if (!check.ok) {
    throw new Error(`El archivo de backup está dañado o no es válido: ${check.error}`);
  }
  console.log(`✅ Integridad confirmada. Tablas detectadas: ${check.tableCount}`);

  console.log('🔄 Ejecutando restauración...');
  const res = restoreBackup(backupPath, config.DB_PATH);
  console.log(`✅ Base de datos restaurada con éxito en ${res.restoredPath}`);
  console.log('====================================================');
  process.exit(0);
} catch (err) {
  console.error(`❌ Error durante la restauración: ${err.message}`);
  process.exit(1);
}
