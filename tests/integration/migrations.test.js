import { describe, it, expect } from 'vitest';
const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');

describe('API Integration: Migraciones de Esquema SQLite', () => {

  function generatePublicId() {
    return crypto.randomBytes(6).toString('hex').toLowerCase();
  }

  function hasColumn(db, tableName, columnName) {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return columns.some(col => col.name === columnName);
  }

  function ensureColumn(db, tableName, columnName, columnDefinition) {
    if (!hasColumn(db, tableName, columnName)) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  }

  it('debe inicializar el esquema completo desde cero en una base vacía', () => {
    const memDb = new DatabaseSync(':memory:');

    // Ejecutar creación base
    memDb.exec(`
      CREATE TABLE extinguishers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        capacity TEXT NOT NULL,
        location TEXT NOT NULL,
        area TEXT,
        floor TEXT,
        expiration_charge TEXT NOT NULL,
        expiration_ph TEXT NOT NULL,
        status TEXT DEFAULT 'OPERATIVO',
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        extinguisher_id INTEGER NOT NULL,
        extinguisher_code TEXT NOT NULL,
        inspector_name TEXT NOT NULL,
        inspection_date TEXT NOT NULL,
        year_month TEXT NOT NULL,
        passed INTEGER NOT NULL,
        check_location INTEGER NOT NULL DEFAULT 1,
        check_pressure INTEGER NOT NULL DEFAULT 1,
        check_seal INTEGER NOT NULL DEFAULT 1,
        check_physical INTEGER NOT NULL DEFAULT 1,
        check_signage INTEGER NOT NULL DEFAULT 1,
        check_card INTEGER NOT NULL DEFAULT 1,
        observations TEXT,
        photo_url TEXT,
        synced_m365 INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE rounds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        year_month TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'ABIERTA',
        opened_at TEXT DEFAULT (datetime('now', 'localtime')),
        closed_at TEXT,
        notes TEXT
      );

      CREATE TABLE cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        extinguisher_id INTEGER NOT NULL,
        extinguisher_code TEXT NOT NULL,
        inspection_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'ABIERTO',
        priority TEXT DEFAULT 'MEDIA',
        assigned_to TEXT,
        temp_replacement_code TEXT,
        photo_url TEXT,
        opened_at TEXT DEFAULT (datetime('now', 'localtime')),
        closed_at TEXT,
        resolution_notes TEXT
      );

      CREATE TABLE checklist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        label TEXT NOT NULL,
        description TEXT,
        applicable_types TEXT DEFAULT 'ALL',
        is_required INTEGER DEFAULT 1,
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Aplicar migraciones incrementales
    ensureColumn(memDb, 'extinguishers', 'public_id', 'TEXT');
    ensureColumn(memDb, 'extinguishers', 'building', "TEXT DEFAULT 'Edificio Central'");
    ensureColumn(memDb, 'extinguishers', 'location_ref', 'TEXT');
    ensureColumn(memDb, 'inspections', 'duration_seconds', 'INTEGER DEFAULT 0');
    ensureColumn(memDb, 'inspections', 'is_suspicious', 'INTEGER DEFAULT 0');

    // Verificar que todas las tablas y columnas existen
    const tables = memDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    expect(tables).toContain('extinguishers');
    expect(tables).toContain('inspections');
    expect(tables).toContain('rounds');
    expect(tables).toContain('cases');
    expect(tables).toContain('checklist_items');
    expect(tables).toContain('settings');

    expect(hasColumn(memDb, 'extinguishers', 'public_id')).toBe(true);
    expect(hasColumn(memDb, 'extinguishers', 'building')).toBe(true);
    expect(hasColumn(memDb, 'inspections', 'is_suspicious')).toBe(true);
  });

  it('debe migrar una base antigua sin perder datos existentes y poblar public_id', () => {
    const memDb = new DatabaseSync(':memory:');

    // 1. Crear esquema legado antiguo (sin public_id, sin building, etc.)
    memDb.exec(`
      CREATE TABLE extinguishers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        capacity TEXT NOT NULL,
        location TEXT NOT NULL,
        expiration_charge TEXT NOT NULL,
        expiration_ph TEXT NOT NULL
      );
    `);

    // 2. Insertar registros legados
    memDb.prepare(`
      INSERT INTO extinguishers (code, type, capacity, location, expiration_charge, expiration_ph)
      VALUES 
        ('MF-001', 'Polvo ABC', '5 kg', 'Puesto 1 Antiguo', '2026-12-01', '2030-12-01'),
        ('MF-002', 'CO2', '5 kg', 'Puesto 2 Antiguo', '2026-11-01', '2029-11-01')
    `).run();

    // 3. Ejecutar migración incremental
    ensureColumn(memDb, 'extinguishers', 'public_id', 'TEXT');
    ensureColumn(memDb, 'extinguishers', 'building', "TEXT DEFAULT 'Base Rosario'");
    ensureColumn(memDb, 'extinguishers', 'notes', 'TEXT');

    // Poblar public_id faltantes
    const unpopulated = memDb.prepare("SELECT id FROM extinguishers WHERE public_id IS NULL OR public_id = ''").all();
    expect(unpopulated.length).toBe(2);

    const updateStmt = memDb.prepare("UPDATE extinguishers SET public_id = ? WHERE id = ?");
    for (const row of unpopulated) {
      updateStmt.run(generatePublicId(), row.id);
    }

    // 4. Verificar integridad de datos
    const records = memDb.prepare("SELECT * FROM extinguishers ORDER BY id ASC").all();
    expect(records.length).toBe(2);

    // Los datos originales permanecen intactos
    expect(records[0].code).toBe('MF-001');
    expect(records[0].location).toBe('Puesto 1 Antiguo');
    expect(records[0].expiration_charge).toBe('2026-12-01');

    // Se asignó public_id no nulo ni vacío
    expect(records[0].public_id).toBeDefined();
    expect(records[0].public_id.length).toBeGreaterThan(6);
    expect(records[1].public_id).toBeDefined();
    expect(records[0].public_id).not.toBe(records[1].public_id);

    // Nuevas columnas tienen sus valores por defecto
    expect(records[0].building).toBe('Base Rosario');
  });
});
