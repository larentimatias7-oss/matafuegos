const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'matafuegos.db');
const db = new DatabaseSync(DB_PATH);

// Initialize database schema
function initSchema() {
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

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Default settings
  const checkSetting = db.prepare("SELECT value FROM settings WHERE key = ?");
  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");

  if (!checkSetting.get('m365_webhook_url')) {
    insertSetting.run('m365_webhook_url', process.env.M365_WEBHOOK_URL || '');
  }
  if (!checkSetting.get('company_name')) {
    insertSetting.run('company_name', 'Control Matafuegos 365');
  }
  if (!checkSetting.get('base_url')) {
    insertSetting.run('base_url', process.env.BASE_URL || 'http://localhost:5173');
  }
}

// Function to generate 130 realistic extinguishers if empty
function seed130Extinguishers() {
  const countRow = db.prepare("SELECT COUNT(*) as count FROM extinguishers").get();
  if (countRow.count > 0) return;

  console.log("Sembrando 130 matafuegos de prueba con ubicaciones y fechas reales...");
  const insert = db.prepare(`
    INSERT INTO extinguishers (code, type, capacity, location, area, floor, expiration_charge, expiration_ph, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const areas = [
    { name: "Cochera Subsuelo", floor: "Subsuelo", defaultType: "Polvo ABC", cap: "10 kg", count: 15 },
    { name: "Planta Baja - Recepción y Hall", floor: "Planta Baja", defaultType: "Polvo ABC", cap: "5 kg", count: 12 },
    { name: "Planta Baja - Comedor y Cocina", floor: "Planta Baja", defaultType: "Acetato K", cap: "6 L", count: 6 },
    { name: "Piso 1 - Oficinas Administrativas", floor: "Piso 1", defaultType: "Polvo ABC", cap: "5 kg", count: 20 },
    { name: "Piso 1 - Sala Servidores IT", floor: "Piso 1", defaultType: "CO2", cap: "5 kg", count: 4 },
    { name: "Piso 2 - Operaciones y Call Center", floor: "Piso 2", defaultType: "Polvo ABC", cap: "5 kg", count: 20 },
    { name: "Piso 2 - Tableros Eléctricos", floor: "Piso 2", defaultType: "CO2", cap: "3.5 kg", count: 5 },
    { name: "Piso 3 - Auditorio y Capacitaciones", floor: "Piso 3", defaultType: "Polvo ABC", cap: "5 kg", count: 14 },
    { name: "Piso 4 - Dirección y Gerencias", floor: "Piso 4", defaultType: "Polvo ABC", cap: "5 kg", count: 14 },
    { name: "Depósito Logística y Cargas", floor: "Exterior / Depósito", defaultType: "Polvo ABC", cap: "10 kg", count: 16 },
    { name: "Sala de Máquinas y Bombas", floor: "Subsuelo 2", defaultType: "CO2", cap: "5 kg", count: 4 }
  ];

  let currentId = 1;
  const now = new Date();

  for (const a of areas) {
    for (let i = 1; i <= a.count && currentId <= 130; i++) {
      const code = `MF-${String(currentId).padStart(3, '0')}`;
      const location = `${a.name} - Puesto #${i}`;
      
      // Calculate realistic expiration dates (some upcoming, some expired, some next year)
      // Expiration charge: between -30 days to +330 days
      const chargeOffsetDays = ((currentId * 17) % 360) - 30; // some are expired or expiring soon
      const expChargeDate = new Date(now.getTime() + chargeOffsetDays * 86400000);
      const expChargeStr = expChargeDate.toISOString().split('T')[0];

      // PH expiration: 1 to 4 years ahead
      const phOffsetDays = 365 + ((currentId * 43) % (365 * 4));
      const expPhDate = new Date(now.getTime() + phOffsetDays * 86400000);
      const expPhStr = expPhDate.toISOString().split('T')[0];

      const status = currentId === 42 ? 'EN_TALLER' : (currentId === 118 ? 'BAJA' : 'OPERATIVO');
      const note = currentId === 42 ? 'Enviado a prueba hidráulica en taller' : (currentId === 118 ? 'Reemplazado por remodelación' : '');

      insert.run(
        code,
        a.defaultType,
        a.cap,
        location,
        a.name,
        a.floor,
        expChargeStr,
        expPhStr,
        status,
        note
      );

      // Add a couple of sample inspections for demonstration
      if (currentId <= 45) {
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const inspectionDate = new Date(now.getTime() - ((currentId % 10) * 86400000)).toISOString().replace('T', ' ').substring(0, 19);
        const passed = currentId === 12 ? 0 : 1;
        const checkPres = currentId === 12 ? 0 : 1;
        const obs = currentId === 12 ? 'Manómetro bajo en zona roja, requiere recarga urgente' : 'Control mensual normal conforme IRAM 3517-2';

        db.prepare(`
          INSERT INTO inspections (
            extinguisher_id, extinguisher_code, inspector_name, inspection_date, year_month,
            passed, check_location, check_pressure, check_seal, check_physical, check_signage, check_card,
            observations, synced_m365
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          currentId,
          code,
          'Santi (Inspector HyS)',
          inspectionDate,
          yearMonth,
          passed,
          1,
          checkPres,
          1,
          1,
          1,
          1,
          obs,
          1
        );
      }

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
  seed130Extinguishers
};
