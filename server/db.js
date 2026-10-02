const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure data directory exists
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'matafuegos.db');
const db = new DatabaseSync(DB_PATH);

// Helper to generate a clean, unguessable public ID (nanoid-like, 10 chars)
function generatePublicId() {
  return crypto.randomBytes(6).toString('hex').toLowerCase();
}

// Check if column exists in SQLite table
function hasColumn(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some(col => col.name === columnName);
}

// Add column if missing
function ensureColumn(tableName, columnName, columnDefinition) {
  if (!hasColumn(tableName, columnName)) {
    console.log(`Migración SQLite: agregando columna ${columnName} a ${tableName}`);
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
}

// Initialize database schema and migrations
function initSchema() {
  // Base Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS extinguishers (
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

    CREATE TABLE IF NOT EXISTS inspections (
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

    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      year_month TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'ABIERTA',
      opened_at TEXT DEFAULT (datetime('now', 'localtime')),
      closed_at TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS cases (
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

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      applicable_types TEXT DEFAULT 'ALL',
      is_required INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // --- MIGRATIONS FOR EXTIN噓UISHERS ---
  ensureColumn('extinguishers', 'public_id', 'TEXT');
  ensureColumn('extinguishers', 'building', "TEXT DEFAULT 'Edificio Central'");
  ensureColumn('extinguishers', 'location_ref', 'TEXT');
  ensureColumn('extinguishers', 'manufacturer', 'TEXT');
  ensureColumn('extinguishers', 'fab_year', 'INTEGER');
  ensureColumn('extinguishers', 'lifespan_limit', 'TEXT');
  ensureColumn('extinguishers', 'last_charge_date', 'TEXT');
  ensureColumn('extinguishers', 'collar_year_color', 'TEXT');
  ensureColumn('extinguishers', 'last_ph_date', 'TEXT');
  ensureColumn('extinguishers', 'supplier', 'TEXT');
  ensureColumn('extinguishers', 'certificate_number', 'TEXT');
  ensureColumn('extinguishers', 'reference_photo', 'TEXT');

  // --- MIGRATIONS FOR INSPECTIONS ---
  ensureColumn('inspections', 'round_id', 'INTEGER');
  ensureColumn('inspections', 'is_reinspection', 'INTEGER DEFAULT 0');
  ensureColumn('inspections', 'reinspection_reason', 'TEXT');
  ensureColumn('inspections', 'duration_seconds', 'INTEGER DEFAULT 0');
  ensureColumn('inspections', 'is_suspicious', 'INTEGER DEFAULT 0');
  ensureColumn('inspections', 'fraud_flags', 'TEXT');
  ensureColumn('inspections', 'latitude', 'REAL');
  ensureColumn('inspections', 'longitude', 'REAL');
  ensureColumn('inspections', 'geo_accuracy', 'REAL');
  ensureColumn('inspections', 'checklist_results', 'TEXT');

  // Ensure public_id is populated for existing extinguishers
  const extsWithoutPublicId = db.prepare("SELECT id FROM extinguishers WHERE public_id IS NULL OR public_id = ''").all();
  if (extsWithoutPublicId.length > 0) {
    const updateStmt = db.prepare("UPDATE extinguishers SET public_id = ? WHERE id = ?");
    for (const row of extsWithoutPublicId) {
      updateStmt.run(generatePublicId(), row.id);
    }
    console.log(`Migración: Se generaron ${extsWithoutPublicId.length} public_id para códigos QR.`);
  }

  // Ensure active round exists for current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const roundRow = db.prepare("SELECT * FROM rounds WHERE year_month = ?").get(currentMonth);
  if (!roundRow) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const roundName = `Ronda ${months[now.getMonth()]} ${now.getFullYear()}`;
    db.prepare(`
      INSERT INTO rounds (name, year_month, status, opened_at)
      VALUES (?, ?, 'ABIERTA', datetime('now', 'localtime'))
    `).run(roundName, currentMonth);
  }

  // Ensure standard checklist items exist
  const checklistCount = db.prepare("SELECT COUNT(*) as c FROM checklist_items").get().c;
  if (checklistCount === 0) {
    const insertChecklist = db.prepare(`
      INSERT INTO checklist_items (code, label, description, applicable_types, is_required, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertChecklist.run(
      'check_location',
      'Ubicación y Acceso Despejado',
      'En puesto reglamentario sin obstáculos que impidan el retiro rápido.',
      'ALL',
      1,
      1
    );

    insertChecklist.run(
      'check_pressure',
      'Presión / Manómetro en Verde (o Peso CO2)',
      'Manómetro en zona verde reglamentaria. En extintores de CO2 (sin manómetro): verificación de peso por balanza.',
      'ALL',
      1,
      2
    );

    insertChecklist.run(
      'check_seal',
      'Precinto y Pasador de Seguridad',
      'Traba metálica colocada y precinto plástico inviolado (sin signos de accionamiento previo).',
      'ALL',
      1,
      3
    );

    insertChecklist.run(
      'check_physical',
      'Cilindro, Manguera y Tobera',
      'Sin corrosión profunda ni abolladuras. Manguera flexible y tobera sin fisuras ni taponamientos.',
      'ALL',
      1,
      4
    );

    insertChecklist.run(
      'check_signage',
      'Señalización y Chapa Baliza',
      'Chapa baliza reglamentaria limpia y cartel visible a distancia adecuada.',
      'ALL',
      1,
      5
    );

    insertChecklist.run(
      'check_card',
      'Tarjeta de Control y Marbete Anual',
      'Tarjeta legible y marbete plástico en cuello con color correspondiente al año en curso.',
      'ALL',
      1,
      6
    );
  }

  // Default settings
  const checkSetting = db.prepare("SELECT value FROM settings WHERE key = ?");
  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");

  if (!checkSetting.get('company_name')) {
    insertSetting.run('company_name', 'Milicic S.A.');
  }
  if (!checkSetting.get('base_url')) {
    insertSetting.run('base_url', process.env.BASE_URL || 'http://localhost:3000');
  }
  if (!checkSetting.get('timezone')) {
    insertSetting.run('timezone', 'America/Argentina/Buenos_Aires');
  }
  if (!checkSetting.get('alert_days')) {
    insertSetting.run('alert_days', '60,30,15');
  }
}

// Function to generate 130 realistic extinguishers with enriched fields
function seed130Extinguishers() {
  const countRow = db.prepare("SELECT COUNT(*) as count FROM extinguishers").get();
  if (countRow.count > 0) return;

  console.log("Sembrando 130 matafuegos de Milicic S.A. con datos técnicos completos...");
  const insert = db.prepare(`
    INSERT INTO extinguishers (
      code, public_id, type, capacity, location, area, floor, building,
      location_ref, manufacturer, fab_year, lifespan_limit, last_charge_date,
      expiration_charge, collar_year_color, last_ph_date, expiration_ph,
      supplier, certificate_number, status, notes
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  const areas = [
    { name: "Cochera Subsuelo", floor: "Subsuelo", defaultType: "Polvo ABC", cap: "10 kg", count: 15 },
    { name: "Planta Baja - Recepción y Hall", floor: "Planta Baja", defaultType: "Polvo ABC", cap: "5 kg", count: 12 },
    { name: "Planta Baja - Comedor y Cocina", floor: "Planta Baja", defaultType: "Acetato K", cap: "6 L", count: 6 },
    { name: "Piso 1 - Oficinas Administrativas", floor: "Piso 1", defaultType: "Polvo ABC", cap: "5 kg", count: 20 },
    { name: "Piso 1 - Sala Servidores IT", floor: "Piso 1", defaultType: "CO2", cap: "5 kg", count: 4 },
    { name: "Piso 2 - Operaciones y Proyectos", floor: "Piso 2", defaultType: "Polvo ABC", cap: "5 kg", count: 20 },
    { name: "Piso 2 - Tableros Eléctricos", floor: "Piso 2", defaultType: "CO2", cap: "3.5 kg", count: 5 },
    { name: "Piso 3 - Auditorio y Capacitaciones", floor: "Piso 3", defaultType: "Polvo ABC", cap: "5 kg", count: 14 },
    { name: "Piso 4 - Dirección y Gerencias", floor: "Piso 4", defaultType: "Polvo ABC", cap: "5 kg", count: 14 },
    { name: "Depósito Logística y Obra", floor: "Exterior / Depósito", defaultType: "Polvo ABC", cap: "10 kg", count: 16 },
    { name: "Sala de Máquinas y Bombas", floor: "Subsuelo 2", defaultType: "CO2", cap: "5 kg", count: 4 }
  ];

  let currentId = 1;
  const now = new Date();

  for (const a of areas) {
    for (let i = 1; i <= a.count && currentId <= 130; i++) {
      const code = `MF-${String(currentId).padStart(3, '0')}`;
      const publicId = generatePublicId();
      const location = `${a.name} - Puesto #${i}`;
      
      const chargeOffsetDays = ((currentId * 17) % 360) - 30;
      const expChargeDate = new Date(now.getTime() + chargeOffsetDays * 86400000);
      const expChargeStr = expChargeDate.toISOString().split('T')[0];
      const lastChargeStr = new Date(expChargeDate.getTime() - 365 * 86400000).toISOString().split('T')[0];

      const phOffsetDays = 365 + ((currentId * 43) % (365 * 4));
      const expPhDate = new Date(now.getTime() + phOffsetDays * 86400000);
      const expPhStr = expPhDate.toISOString().split('T')[0];
      const lastPhStr = new Date(expPhDate.getTime() - 5 * 365 * 86400000).toISOString().split('T')[0];

      const fabYear = 2018 + (currentId % 7);
      const lifespanLimit = `${fabYear + 20}-12-31`; // 20 years lifespan
      const status = currentId === 42 ? 'EN_TALLER' : (currentId === 118 ? 'FUERA_DE_SERVICIO' : 'OPERATIVO');
      const note = currentId === 42 ? 'Retirado a taller certificado para prueba hidráulica' : '';

      insert.run(
        code,
        publicId,
        a.defaultType,
        a.cap,
        location,
        a.name,
        a.floor,
        'Base Central Rosario',
        `Puesto #${i} sobre columna balizada`,
        'Georgia / Melisam S.A.',
        fabYear,
        lifespanLimit,
        lastChargeStr,
        expChargeStr,
        '2026 - Marbete Naranja Oficial',
        lastPhStr,
        expPhStr,
        'Taller Certificado IRAM #1042',
        `REM-2026-${String(currentId).padStart(5, '0')}`,
        status,
        note
      );

      currentId++;
    }
  }

  console.log(`Se sembraron ${currentId - 1} matafuegos exitosamente.`);
}

initSchema();
seed130Extinguishers();

module.exports = {
  db,
  initSchema,
  seed130Extinguishers,
  generatePublicId
};
