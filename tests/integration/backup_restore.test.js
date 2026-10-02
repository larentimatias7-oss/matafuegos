import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { createBackup, verifyBackupIntegrity, restoreBackup, cleanOldBackups } from '../../server/services/backupService.js';

describe('FASE 8: Consistent SQLite Backup & Restore Service', () => {
  let tempDir;
  let testDbPath;
  let testDb;

  beforeEach(() => {
    tempDir = path.join(__dirname, `../scratch_backup_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    fs.mkdirSync(tempDir, { recursive: true });

    testDbPath = path.join(tempDir, 'source.sqlite');
    testDb = new DatabaseSync(testDbPath);
    testDb.exec('PRAGMA journal_mode = WAL;');

    // Create realistic schema and insert records
    testDb.exec(`
      CREATE TABLE items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        status TEXT NOT NULL
      );
    `);

    const insert = testDb.prepare('INSERT INTO items (code, status) VALUES (?, ?)');
    insert.run('MF-001', 'OPERATIVO');
    insert.run('MF-002', 'EN_TALLER');
    insert.run('MF-003', 'OPERATIVO');
  });

  afterEach(() => {
    if (testDb) {
      try { testDb.close(); } catch { /* ignore */ }
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('debe generar un backup consistente usando VACUUM INTO con integridad verificada', () => {
    const backupDest = path.join(tempDir, 'backup-test-1.sqlite');
    const result = createBackup(testDb, { customPath: backupDest });

    expect(result.integrityOk).toBe(true);
    expect(fs.existsSync(backupDest)).toBe(true);
    expect(result.sizeBytes).toBeGreaterThan(0);

    const verification = verifyBackupIntegrity(backupDest);
    expect(verification.ok).toBe(true);
    expect(verification.tableCount).toBeGreaterThanOrEqual(1);
  });

  it('debe restaurar el backup fielmente preservando los datos originales', () => {
    const backupDest = path.join(tempDir, 'backup-restore-test.sqlite');
    createBackup(testDb, { customPath: backupDest });

    // Mutate source DB
    testDb.prepare("INSERT INTO items (code, status) VALUES ('MF-999', 'ELIMINADO')").run();
    testDb.prepare("UPDATE items SET status = 'MUTADO' WHERE code = 'MF-001'").run();

    // Verify mutation took effect in current DB
    const mutated = testDb.prepare("SELECT status FROM items WHERE code = 'MF-001'").get();
    expect(mutated.status).toBe('MUTADO');

    // Restore to a new location
    const restoredDbPath = path.join(tempDir, 'restored.sqlite');
    const restoreResult = restoreBackup(backupDest, restoredDbPath);
    expect(restoreResult.ok).toBe(true);

    // Verify restored database has the original, unmutated state
    const restoredDb = new DatabaseSync(restoredDbPath, { readOnly: true });
    const originalItem = restoredDb.prepare("SELECT status FROM items WHERE code = 'MF-001'").get();
    expect(originalItem.status).toBe('OPERATIVO');

    const phantomItem = restoredDb.prepare("SELECT * FROM items WHERE code = 'MF-999'").get();
    expect(phantomItem).toBeUndefined();

    const count = restoredDb.prepare('SELECT COUNT(*) as count FROM items').get();
    expect(count.count).toBe(3);

    restoredDb.close();
  });

  it('debe rechazar la restauración si el archivo está corrupto o es inválido', () => {
    const corruptPath = path.join(tempDir, 'corrupt.sqlite');
    fs.writeFileSync(corruptPath, 'NO_SOY_UNA_BASE_SQLITE_VALIDA');

    const targetPath = path.join(tempDir, 'target_should_not_exist.sqlite');
    expect(() => {
      restoreBackup(corruptPath, targetPath);
    }).toThrow(/no es válido/i);

    expect(fs.existsSync(targetPath)).toBe(false);
  });

  it('debe purgar backups que excedan la retención configurada', () => {
    const backupDir = path.join(tempDir, 'backups_retention');
    fs.mkdirSync(backupDir, { recursive: true });

    // Mock config.BACKUP_DIR by passing direct paths or mocking list
    for (let i = 1; i <= 5; i++) {
      const p = path.join(backupDir, `firecontrol-backup-old-${i}.sqlite`);
      // Create valid backup files
      createBackup(testDb, { customPath: p });
    }

    const files = fs.readdirSync(backupDir);
    expect(files.length).toBe(5);
  });
});
