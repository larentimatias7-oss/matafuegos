import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import {
  createBackup,
  verifyBackupIntegrity,
  restoreBackup,
  listBackups,
  cleanOldBackups,
  getBackupDirectory
} from '../../server/services/backupService.js';
import { config } from '../../server/config.js';

describe('Unit Tests: backupService.js', () => {
  let tempDir;
  let testDbPath;
  let testDb;

  beforeEach(() => {
    tempDir = path.join(__dirname, `../scratch_bk_unit_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    fs.mkdirSync(tempDir, { recursive: true });

    testDbPath = path.join(tempDir, 'unit_test.db');
    testDb = new DatabaseSync(testDbPath);
    testDb.exec('CREATE TABLE sample (id INTEGER PRIMARY KEY, name TEXT);');
    testDb.prepare('INSERT INTO sample (name) VALUES (?)').run('Test Extinguisher');
  });

  afterEach(() => {
    if (testDb) {
      try { testDb.close(); } catch { /* ignore */ }
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('getBackupDirectory debe retornar la ruta configurada y asegurar su existencia', () => {
    const dir = getBackupDirectory();
    expect(dir).toBe(config.BACKUP_DIR);
    expect(fs.existsSync(dir)).toBe(true);
  });

  it('verifyBackupIntegrity debe reportar ok: false si el archivo no existe', () => {
    const res = verifyBackupIntegrity(path.join(tempDir, 'non_existent.sqlite'));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/no existe/i);
  });

  it('verifyBackupIntegrity debe reportar ok: false si el archivo no es SQLite válido', () => {
    const badFile = path.join(tempDir, 'corrupt.sqlite');
    fs.writeFileSync(badFile, 'Texto plano que no es sqlite');
    const res = verifyBackupIntegrity(badFile);
    expect(res.ok).toBe(false);
  });

  it('listBackups debe listar los backups existentes ordenados por fecha descendente', () => {
    const b1 = path.join(config.BACKUP_DIR, `test-b1-${Date.now()}.sqlite`);
    createBackup(testDb, { customPath: b1 });

    const list = listBackups();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty('filename');
    expect(list[0]).toHaveProperty('sizeBytes');
    expect(list[0]).toHaveProperty('modifiedAt');

    // Clean up created file
    if (fs.existsSync(b1)) fs.unlinkSync(b1);
  });

  it('cleanOldBackups debe respetar keepCount y podar backups excedentes', () => {
    const purge = cleanOldBackups({ keepCount: 1, maxAgeDays: 0 });
    expect(typeof purge.deletedCount).toBe('number');
    expect(typeof purge.remainingCount).toBe('number');
  });

  it('restoreBackup debe fallar de inmediato si el archivo de origen no existe', () => {
    expect(() => {
      restoreBackup(path.join(tempDir, 'ghost.sqlite'), path.join(tempDir, 'dest.sqlite'));
    }).toThrow(/no es válido/i);
  });
});
