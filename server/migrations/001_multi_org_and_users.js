/**
 * Migración 001: Modelo Multitenant (organizaciones), Usuarios, Roles, Permisos,
 * Alcance Sectorial, Sesiones, Auditoría Append-Only, Tokens de Seguridad y
 * Migración Histórica de Inspecciones sin pérdida de datos.
 */

const crypto = require('crypto');
const { ROLES, PERMISOS, ROLE_PERMISSIONS } = require('../config/permissions');

function hasColumn(db, tableName, columnName) {
  try {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return columns.some(col => col.name === columnName);
  } catch (e) {
    return false;
  }
}

function ensureColumn(db, tableName, columnName, columnDefinition) {
  if (!hasColumn(db, tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
}

function up(db) {
  // 1. Organizaciones
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      cuit TEXT,
      activa INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Asegurar organización inicial de Milicic S.A.
  const existingOrg = db.prepare('SELECT id FROM organizaciones WHERE id = 1').get();
  if (!existingOrg) {
    db.prepare(`
      INSERT INTO organizaciones (id, nombre, cuit, activa)
      VALUES (1, 'Milicic S.A.', '30-58079213-9', 1)
    `).run();
  }

  // 2. Permisos y Roles-Permisos
  db.exec(`
    CREATE TABLE IF NOT EXISTS permisos (
      codigo TEXT PRIMARY KEY,
      descripcion TEXT,
      modulo TEXT
    );

    CREATE TABLE IF NOT EXISTS roles_permisos (
      rol TEXT NOT NULL,
      permiso_codigo TEXT NOT NULL REFERENCES permisos(codigo),
      PRIMARY KEY (rol, permiso_codigo)
    );
  `);

  // Sembrar permisos definidos en config/permissions.js
  const insertPermiso = db.prepare(`
    INSERT OR IGNORE INTO permisos (codigo, descripcion, modulo)
    VALUES (?, ?, ?)
  `);

  for (const [key, code] of Object.entries(PERMISOS)) {
    const modulo = code.split(':')[0] || 'general';
    insertPermiso.run(code, `Permiso para ${code}`, modulo);
  }

  // Sembrar matriz roles_permisos
  const insertRolPermiso = db.prepare(`
    INSERT OR IGNORE INTO roles_permisos (rol, permiso_codigo)
    VALUES (?, ?)
  `);

  for (const [rol, permisosList] of Object.entries(ROLE_PERMISSIONS)) {
    for (const perm of permisosList) {
      insertRolPermiso.run(rol, perm);
    }
  }

  // 3. Usuarios
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      organizacion_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizaciones(id),
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      email TEXT NOT NULL,
      origen TEXT NOT NULL DEFAULT 'local',
      entra_oid TEXT,
      password_hash TEXT,
      pin_hash TEXT,
      pin_intentos_fallidos INTEGER DEFAULT 0,
      pin_bloqueado_hasta TEXT,
      rol TEXT NOT NULL DEFAULT 'INSPECTOR',
      activo INTEGER DEFAULT 1,
      debe_cambiar_password INTEGER DEFAULT 0,
      intentos_fallidos INTEGER DEFAULT 0,
      bloqueado_hasta TEXT,
      ultimo_acceso TEXT,
      creado_por TEXT,
      creado_en TEXT DEFAULT (datetime('now', 'localtime')),
      desactivado_en TEXT,
      UNIQUE(organizacion_id, email)
    );
    CREATE INDEX IF NOT EXISTS idx_usuarios_org_email ON usuarios(organizacion_id, email);
    CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
  `);

  // 4. Alcance Sectorial (usuarios_sectores)
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios_sectores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      sector TEXT,
      piso TEXT,
      edificio TEXT,
      creado_en TEXT DEFAULT (datetime('now', 'localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_usuarios_sectores_uid ON usuarios_sectores(usuario_id);
  `);

  // 5. Sesiones Activas
  db.exec(`
    CREATE TABLE IF NOT EXISTS sesiones (
      id TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      dispositivo TEXT,
      ip TEXT,
      user_agent TEXT,
      creada_en TEXT DEFAULT (datetime('now', 'localtime')),
      ultimo_uso TEXT DEFAULT (datetime('now', 'localtime')),
      expira_en TEXT NOT NULL,
      revocada INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_sesiones_uid ON sesiones(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_sesiones_validas ON sesiones(revocada, expira_en);
  `);

  // 6. Auditoría Append-Only
  db.exec(`
    CREATE TABLE IF NOT EXISTS auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT DEFAULT (datetime('now', 'localtime')),
      usuario_id TEXT,
      usuario_nombre_snapshot TEXT,
      organizacion_id INTEGER DEFAULT 1,
      accion TEXT NOT NULL,
      entidad TEXT NOT NULL,
      entidad_id TEXT NOT NULL,
      datos_antes TEXT,
      datos_despues TEXT,
      ip TEXT,
      user_agent TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria(entidad, entidad_id);
    CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha);
  `);

  // 7. Tokens de Seguridad (Invitaciones, Reset de Clave, Autorización de Dispositivo)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tokens_seguridad (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT UNIQUE NOT NULL,
      usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,
      datos_extra TEXT,
      usado INTEGER DEFAULT 0,
      expira_en TEXT NOT NULL,
      creado_en TEXT DEFAULT (datetime('now', 'localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_tokens_hash ON tokens_seguridad(token_hash);
  `);

  // 8. Alterar tablas de negocio para incorporar organizacion_id y trazabilidad
  ensureColumn(db, 'extinguishers', 'organizacion_id', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn(db, 'rounds', 'organizacion_id', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn(db, 'cases', 'organizacion_id', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn(db, 'cases', 'usuario_id', 'TEXT');
  ensureColumn(db, 'cases', 'usuario_nombre_snapshot', 'TEXT');
  ensureColumn(db, 'checklist_items', 'organizacion_id', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn(db, 'inspections', 'organizacion_id', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn(db, 'inspections', 'usuario_id', 'TEXT');
  ensureColumn(db, 'inspections', 'inspector_name_snapshot', 'TEXT');

  // 9. Backfill y Alta de Usuarios del Sistema
  const santiagoId = '11111111-1111-4111-8111-111111111111';
  const historicoId = '00000000-0000-0000-0000-000000000001';

  // Usuario Santiago Amaya (Inspector de campo operativo)
  const santiagoExists = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(santiagoId);
  if (!santiagoExists) {
    db.prepare(`
      INSERT INTO usuarios (
        id, organizacion_id, nombre, apellido, email, origen, rol, activo, debe_cambiar_password
      ) VALUES (
        ?, 1, 'Santiago', 'Amaya', 'santiago.amaya@milicic.com.ar', 'local', 'INSPECTOR', 1, 0
      )
    `).run(santiagoId);
  }

  // Usuario Sistema Histórico (Para asociar inspecciones previas y preservar trazabilidad)
  const historicoExists = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(historicoId);
  if (!historicoExists) {
    db.prepare(`
      INSERT INTO usuarios (
        id, organizacion_id, nombre, apellido, email, origen, rol, activo, debe_cambiar_password
      ) VALUES (
        ?, 1, 'Sistema', 'Histórico', 'sistema.historico@milicic.com.ar', 'local', 'AUDITOR', 1, 0
      )
    `).run(historicoId);
  }

  // 10. Actualización retroactiva de datos existentes sin pérdida de registros
  db.exec(`
    UPDATE extinguishers SET organizacion_id = 1 WHERE organizacion_id IS NULL OR organizacion_id = 0;
    UPDATE rounds SET organizacion_id = 1 WHERE organizacion_id IS NULL OR organizacion_id = 0;
    UPDATE cases SET organizacion_id = 1 WHERE organizacion_id IS NULL OR organizacion_id = 0;
    UPDATE checklist_items SET organizacion_id = 1 WHERE organizacion_id IS NULL OR organizacion_id = 0;
    UPDATE inspections SET organizacion_id = 1 WHERE organizacion_id IS NULL OR organizacion_id = 0;
  `);

  // Asociar inspecciones existentes al usuario correspondiente y asegurar snapshot
  db.prepare(`
    UPDATE inspections
    SET 
      usuario_id = CASE 
        WHEN inspector_name LIKE '%Amaya%' THEN ? 
        ELSE ? 
      END,
      inspector_name_snapshot = COALESCE(inspector_name_snapshot, inspector_name)
    WHERE usuario_id IS NULL
  `).run(santiagoId, historicoId);

  db.exec(`
    UPDATE inspections 
    SET inspector_name_snapshot = inspector_name 
    WHERE inspector_name_snapshot IS NULL OR inspector_name_snapshot = '';
  `);
}

function down(db) {
  // Rollback reversible
  db.exec(`
    DROP TABLE IF EXISTS tokens_seguridad;
    DROP TABLE IF EXISTS auditoria;
    DROP TABLE IF EXISTS sesiones;
    DROP TABLE IF EXISTS usuarios_sectores;
    DROP TABLE IF EXISTS roles_permisos;
    DROP TABLE IF EXISTS permisos;
    DROP TABLE IF EXISTS usuarios;
    DROP TABLE IF EXISTS organizaciones;
  `);
}

module.exports = {
  up,
  down
};
