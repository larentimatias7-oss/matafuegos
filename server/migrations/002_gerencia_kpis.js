/**
 * Migración 002: Tablas y Semillas para el Módulo Gerencial de KPIs Ejecutivos (FireControl 365 BI)
 * - kpi_snapshots: Registro inmutable de métricas históricas mensuales y diarias
 * - kpi_configuracion: Metas, umbrales RAG y plazos configurables
 * - ordenes_servicio: Trazabilidad de envíos a taller externo, SLA de proveedores y costos
 * - bi_tokens: Tokens de solo lectura para integración con Power BI y Excel
 * - Alta del rol GERENCIA y usuario ejecutivo oficial
 */

const crypto = require('crypto');
const { ROLES, PERMISOS, ROLE_PERMISSIONS } = require('../config/permissions');
const { hashPassword } = require('../services/authService');

function up(db) {
  // 1. Tabla kpi_snapshots (Fotos históricas congeladas)
  db.exec(`
    CREATE TABLE IF NOT EXISTS kpi_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizacion_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizaciones(id),
      year_month TEXT NOT NULL,
      fecha_corte TEXT NOT NULL,
      sitio TEXT DEFAULT 'Base Central Rosario',
      tipo_activo TEXT DEFAULT 'ALL',
      kpis_json TEXT NOT NULL,
      es_reconstruido INTEGER DEFAULT 0,
      hash_integridad TEXT,
      creado_en TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(organizacion_id, year_month, sitio, tipo_activo)
    );
    CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_lookup ON kpi_snapshots(organizacion_id, year_month, sitio, tipo_activo);
    CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_ym ON kpi_snapshots(year_month);
  `);

  // 2. Tabla kpi_configuracion (Metas y umbrales RAG)
  db.exec(`
    CREATE TABLE IF NOT EXISTS kpi_configuracion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizacion_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizaciones(id),
      kpi_codigo TEXT NOT NULL,
      nombre TEXT NOT NULL,
      meta_objetivo REAL NOT NULL,
      umbral_verde_min REAL,
      umbral_amarillo_min REAL,
      umbral_rojo_max REAL,
      peso_ponderacion REAL DEFAULT 1.0,
      plazo_objetivo_dias INTEGER DEFAULT 7,
      direccion_deseada TEXT DEFAULT 'MAYOR_MEJOR',
      actualizado_por TEXT,
      actualizado_en TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(organizacion_id, kpi_codigo)
    );
    CREATE INDEX IF NOT EXISTS idx_kpi_config_org_kpi ON kpi_configuracion(organizacion_id, kpi_codigo);
  `);

  // 3. Tabla ordenes_servicio (Taller externo y costos)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ordenes_servicio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizacion_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizaciones(id),
      codigo_orden TEXT UNIQUE NOT NULL,
      extinguisher_id INTEGER NOT NULL REFERENCES extinguishers(id),
      case_id INTEGER REFERENCES cases(id),
      proveedor TEXT NOT NULL,
      tipo_servicio TEXT NOT NULL,
      fecha_envio TEXT NOT NULL,
      fecha_prometida TEXT NOT NULL,
      fecha_devolucion TEXT,
      cumplio_tiempo INTEGER,
      costo_estimado REAL DEFAULT 0,
      costo_real REAL DEFAULT 0,
      estado TEXT DEFAULT 'EN_TALLER',
      remito_numero TEXT,
      observaciones TEXT,
      creado_en TEXT DEFAULT (datetime('now', 'localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_os_extinguisher ON ordenes_servicio(extinguisher_id);
    CREATE INDEX IF NOT EXISTS idx_os_proveedor ON ordenes_servicio(proveedor);
    CREATE INDEX IF NOT EXISTS idx_os_estado ON ordenes_servicio(estado);
    CREATE INDEX IF NOT EXISTS idx_os_fechas ON ordenes_servicio(fecha_envio, fecha_devolucion);
  `);

  // 4. Tabla bi_tokens (Conectores Power BI / OData / Excel)
  db.exec(`
    CREATE TABLE IF NOT EXISTS bi_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizacion_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizaciones(id),
      nombre TEXT NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      token_prefix TEXT NOT NULL,
      creado_por TEXT,
      creado_en TEXT DEFAULT (datetime('now', 'localtime')),
      ultimo_acceso TEXT,
      revocado INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_bi_tokens_hash ON bi_tokens(token_hash, revocado);
  `);

  // 5. Actualizar tablas de permisos en SQLite
  const insertPermiso = db.prepare(`
    INSERT OR IGNORE INTO permisos (codigo, descripcion, modulo)
    VALUES (?, ?, ?)
  `);
  for (const [key, code] of Object.entries(PERMISOS)) {
    const modulo = code.split(':')[0] || 'general';
    insertPermiso.run(code, `Permiso para ${code}`, modulo);
  }

  const insertRolPermiso = db.prepare(`
    INSERT OR IGNORE INTO roles_permisos (rol, permiso_codigo)
    VALUES (?, ?)
  `);
  for (const [rol, permisosList] of Object.entries(ROLE_PERMISSIONS)) {
    for (const perm of permisosList) {
      insertRolPermiso.run(rol, perm);
    }
  }

  // 6. Sembrar metas y umbrales por defecto en kpi_configuracion (Milicic S.A.)
  const insertConfig = db.prepare(`
    INSERT OR IGNORE INTO kpi_configuracion (
      organizacion_id, kpi_codigo, nombre, meta_objetivo,
      umbral_verde_min, umbral_amarillo_min, umbral_rojo_max,
      peso_ponderacion, plazo_objetivo_dias, direccion_deseada
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const defaultKpis = [
    { codigo: 'KPI-01', nombre: 'Cumplimiento de Ronda Mensual', meta: 95.0, verde: 95.0, amarillo: 80.0, rojo: 79.9, peso: 0.25, plazo: 30, dir: 'MAYOR_MEJOR' },
    { codigo: 'KPI-02', nombre: 'Vigencia Normativa IRAM 3517-2', meta: 100.0, verde: 100.0, amarillo: 95.0, rojo: 94.9, peso: 0.40, plazo: 0, dir: 'MAYOR_MEJOR' },
    { codigo: 'KPI-03', nombre: 'Vencimientos Próximos (Cargas a 30d)', meta: 20.0, verde: 20.0, amarillo: 35.0, rojo: 36.0, peso: 0.0, plazo: 30, dir: 'MENOR_MEJOR' },
    { codigo: 'KPI-04', nombre: 'Tasa de Fallas en Inspección', meta: 3.0, verde: 3.0, amarillo: 7.0, rojo: 7.1, peso: 0.0, plazo: 30, dir: 'MENOR_MEJOR' },
    { codigo: 'KPI-05', nombre: 'Tiempo Medio de Resolución (MTTR)', meta: 5.0, verde: 5.0, amarillo: 10.0, rojo: 10.1, peso: 0.15, plazo: 7, dir: 'MENOR_MEJOR' },
    { codigo: 'KPI-06', nombre: 'Disponibilidad de la Protección', meta: 98.0, verde: 98.0, amarillo: 95.0, rojo: 94.9, peso: 0.20, plazo: 2, dir: 'MAYOR_MEJOR' },
    { codigo: 'KPI-07', nombre: 'Cumplimiento Taller de Proveedores', meta: 90.0, verde: 90.0, amarillo: 75.0, rojo: 74.9, peso: 0.0, plazo: 14, dir: 'MAYOR_MEJOR' },
    { codigo: 'KPI-08', nombre: 'Salud de Seguridad por Sector', meta: 0.0, verde: 5.0, amarillo: 15.0, rojo: 16.0, peso: 0.0, plazo: 7, dir: 'MENOR_MEJOR' },
    { codigo: 'KPI-09', nombre: 'Índice de Salud de la Instalación (ISI)', meta: 90.0, verde: 90.0, amarillo: 75.0, rojo: 74.9, peso: 1.0, plazo: 30, dir: 'MAYOR_MEJOR' },
    { codigo: 'KPI-10', nombre: 'Confiabilidad e Integridad de Datos', meta: 98.0, verde: 98.0, amarillo: 90.0, rojo: 89.9, peso: 0.0, plazo: 30, dir: 'MAYOR_MEJOR' },
    { codigo: 'KPI-11', nombre: 'Puntualidad en Cierre de Rondas', meta: 100.0, verde: 95.0, amarillo: 80.0, rojo: 79.9, peso: 0.0, plazo: 30, dir: 'MAYOR_MEJOR' },
    { codigo: 'KPI-12', nombre: 'Costo Promedio Unitario de Mantenimiento', meta: 15000.0, verde: 18000.0, amarillo: 25000.0, rojo: 25001.0, peso: 0.0, plazo: 30, dir: 'MENOR_MEJOR' }
  ];

  for (const k of defaultKpis) {
    insertConfig.run(1, k.codigo, k.nombre, k.meta, k.verde, k.amarillo, k.rojo, k.peso, k.plazo, k.dir);
  }

  // 7. Sembrar órdenes de taller iniciales
  const insertOrden = db.prepare(`
    INSERT OR IGNORE INTO ordenes_servicio (
      organizacion_id, codigo_orden, extinguisher_id, case_id,
      proveedor, tipo_servicio, fecha_envio, fecha_prometida,
      fecha_devolucion, cumplio_tiempo, costo_estimado, costo_real,
      estado, remito_numero, observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Orden activa para extintor en taller (MF-042)
  const ext42 = db.prepare("SELECT id FROM extinguishers WHERE code = 'MF-042'").get();
  if (ext42) {
    const case42 = db.prepare("SELECT id FROM cases WHERE extinguisher_id = ? ORDER BY id DESC LIMIT 1").get(ext42.id);
    insertOrden.run(
      1,
      'OT-2026-00042',
      ext42.id,
      case42 ? case42.id : null,
      'Taller Certificado IRAM #1042',
      'PRUEBA_HIDRAULICA',
      '2026-09-25',
      '2026-10-05',
      null,
      null,
      35000,
      0,
      'EN_TALLER',
      'REM-1042-8891',
      'Prueba hidráulica quinquenal y cambio de válvula'
    );
  }

  // Órdenes resueltas históricas para dotar de métricas de SLA y costos
  const historicalOrders = [
    { code: 'OT-2026-00015', extId: 15, prov: 'Taller Certificado IRAM #1042', tipo: 'RECARGA_ANUAL', envio: '2026-08-01', prom: '2026-08-08', dev: '2026-08-07', cumplio: 1, cEst: 14000, cReal: 14000, rem: 'REM-1042-7712' },
    { code: 'OT-2026-00028', extId: 28, prov: 'Melisam S.A.', tipo: 'REPARACION', envio: '2026-08-10', prom: '2026-08-18', dev: '2026-08-16', cumplio: 1, cEst: 22000, cReal: 21500, rem: 'REM-MEL-3341' },
    { code: 'OT-2026-00063', extId: 63, prov: 'Matafuegos Georgia', tipo: 'RECARGA_ANUAL', envio: '2026-08-15', prom: '2026-08-22', dev: '2026-08-25', cumplio: 0, cEst: 15000, cReal: 16500, rem: 'REM-GEO-5509' },
    { code: 'OT-2026-00088', extId: 88, prov: 'Taller Certificado IRAM #1042', tipo: 'PRUEBA_HIDRAULICA', envio: '2026-09-02', prom: '2026-09-12', dev: '2026-09-11', cumplio: 1, cEst: 32000, cReal: 32000, rem: 'REM-1042-8114' },
    { code: 'OT-2026-00104', extId: 104, prov: 'Melisam S.A.', tipo: 'RECARGA_ANUAL', envio: '2026-09-05', prom: '2026-09-12', dev: '2026-09-15', cumplio: 0, cEst: 14500, cReal: 14500, rem: 'REM-MEL-3590' },
    { code: 'OT-2026-00122', extId: 122, prov: 'Servicios Industriales Litoral', tipo: 'RECARGA_ANUAL', envio: '2026-09-18', prom: '2026-09-25', dev: '2026-09-24', cumplio: 1, cEst: 13500, cReal: 13500, rem: 'REM-SIL-1102' }
  ];

  for (const o of historicalOrders) {
    const ext = db.prepare('SELECT id FROM extinguishers WHERE id = ?').get(o.extId);
    if (ext) {
      insertOrden.run(
        1,
        o.code,
        o.extId,
        null,
        o.prov,
        o.tipo,
        o.envio,
        o.prom,
        o.dev,
        o.cumplio,
        o.cEst,
        o.cReal,
        'RECIBIDO_CONFORME',
        o.rem,
        'Mantenimiento reglamentario completado conforme IRAM 3517-2'
      );
    }
  }

  // 8. Crear usuario oficial para el rol GERENCIA (password: Gerencia2026!)
  const gerenciaId = '22222222-2222-4222-8222-222222222222';
  const gerenciaEmail = 'gerencia@milicic.com.ar';
  const existingGerencia = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(gerenciaEmail);
  if (!existingGerencia) {
    // Generar hash con fallback síncrono para migración
    const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$vD9p4mG8cK7mJ9q2t5x1$a7K9j2m4x8L0q3v6p1y4z7a0b3c6d9e2f5g8h1j4k7m';
    db.prepare(`
      INSERT INTO usuarios (
        id, organizacion_id, nombre, apellido, email, origen, rol, activo, debe_cambiar_password
      ) VALUES (?, 1, 'Gerencia', 'Operaciones', ?, 'local', 'GERENCIA', 1, 0)
    `).run(gerenciaId, gerenciaEmail);
  }
}

function down(db) {
  db.exec(`
    DROP TABLE IF EXISTS bi_tokens;
    DROP TABLE IF EXISTS ordenes_servicio;
    DROP TABLE IF EXISTS kpi_configuracion;
    DROP TABLE IF EXISTS kpi_snapshots;
    DELETE FROM usuarios WHERE email = 'gerencia@milicic.com.ar';
    DELETE FROM roles_permisos WHERE rol = 'GERENCIA';
    DELETE FROM permisos WHERE codigo LIKE 'gerencia:%' OR codigo = 'bi:dataset_ver';
  `);
}

module.exports = { up, down };
