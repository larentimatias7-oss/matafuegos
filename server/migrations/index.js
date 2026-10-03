/**
 * Milicic FireControl 365 - Sistema de Migraciones Versionadas y Reversibles
 */

const fs = require('fs');
const path = require('path');

function initMigrationTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);
}

function getAppliedMigrations(db) {
  initMigrationTable(db);
  const rows = db.prepare('SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC').all();
  return new Map(rows.map(r => [r.version, r]));
}

function getMigrationFiles() {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.match(/^\d{3}_.*\.js$/))
    .sort();

  return files.map(file => {
    const version = parseInt(file.split('_')[0], 10);
    const migration = require(path.join(migrationsDir, file));
    return {
      version,
      name: file,
      up: migration.up,
      down: migration.down
    };
  });
}

function runMigrations(db) {
  initMigrationTable(db);
  const applied = getAppliedMigrations(db);
  const migrations = getMigrationFiles();

  let count = 0;
  for (const m of migrations) {
    if (!applied.has(m.version)) {
      console.log(`[MIGRATION] Aplicando versión ${m.version}: ${m.name}...`);
      try {
        m.up(db);
        db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(m.version, m.name);
        console.log(`[MIGRATION] Versión ${m.version} aplicada con éxito.`);
        count++;
      } catch (err) {
        console.error(`[MIGRATION ERROR] Error aplicando versión ${m.version} (${m.name}):`, err);
        throw err;
      }
    }
  }

  if (count > 0) {
    console.log(`[MIGRATION] Total de migraciones aplicadas: ${count}`);
  }
}

function rollbackLastMigration(db) {
  initMigrationTable(db);
  const lastApplied = db.prepare('SELECT version, name FROM schema_migrations ORDER BY version DESC LIMIT 1').get();
  if (!lastApplied) {
    console.log('[MIGRATION] No hay migraciones aplicadas para revertir.');
    return false;
  }

  const migrations = getMigrationFiles();
  const target = migrations.find(m => m.version === lastApplied.version);
  if (!target || typeof target.down !== 'function') {
    throw new Error(`No se encontró función de rollback (down) para la versión ${lastApplied.version}`);
  }

  console.log(`[MIGRATION ROLLBACK] Revertiendo versión ${target.version}: ${target.name}...`);
  target.down(db);
  db.prepare('DELETE FROM schema_migrations WHERE version = ?').run(target.version);
  console.log(`[MIGRATION ROLLBACK] Versión ${target.version} revertida exitosamente.`);
  return true;
}

module.exports = {
  runMigrations,
  rollbackLastMigration,
  getAppliedMigrations
};
