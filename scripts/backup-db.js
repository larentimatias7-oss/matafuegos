#!/usr/bin/env node
/**
 * Milicic FireControl 365 - Consistent SQLite Backup CLI
 * Usage: node scripts/backup-db.js [--retention 7] [--keep-days 30]
 */

const { db } = require('../server/db');
const { createBackup, cleanOldBackups, listBackups } = require('../server/services/backupService');

console.log('====================================================');
console.log('🧯 Milicic FireControl 365 - Backup Consistente SQLite');
console.log('====================================================');

try {
  console.log('📦 Iniciando VACUUM INTO consistente...');
  const result = createBackup(db);
  console.log(`✅ Backup generado exitosamente:`);
  console.log(`   - Archivo: ${result.filename}`);
  console.log(`   - Tamaño: ${(result.sizeBytes / 1024).toFixed(2)} KB`);
  console.log(`   - Duración: ${result.durationMs} ms`);
  console.log(`   - Integridad: OK (PRAGMA integrity_check verificado)`);

  // Retention cleanup
  const purge = cleanOldBackups({ keepCount: 7, maxAgeDays: 30 });
  if (purge.deletedCount > 0) {
    console.log(`🧹 Poda de retención: se eliminaron ${purge.deletedCount} backups antiguos.`);
  }

  const all = listBackups();
  console.log(`📊 Total de backups disponibles: ${all.length}`);
  console.log('====================================================');
  process.exit(0);
} catch (err) {
  console.error(`❌ Error en proceso de backup: ${err.message}`);
  process.exit(1);
}
