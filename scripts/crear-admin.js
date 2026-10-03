/**
 * Milicic FireControl 365 - Script CLI para Inicializar o Restablecer Superadmin
 * Uso:
 *   node scripts/crear-admin.js
 * O mediante variables:
 *   ADMIN_EMAIL=ti@milicic.com.ar ADMIN_PASSWORD=MiClaveSegura2026! node scripts/crear-admin.js
 */

const readline = require('readline');
const crypto = require('crypto');
const { db } = require('../server/db');
const { ROLES } = require('../server/config/permissions');
const { hashPassword, validatePasswordStrength } = require('../server/services/authService');
const { recordAudit } = require('../server/services/auditService');

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function main() {
  console.log('====================================================');
  console.log('🛡️  Milicic FireControl 365 - Inicializador Superadmin');
  console.log('====================================================\n');

  let email = process.env.ADMIN_EMAIL || process.env.ADMIN_INITIAL_EMAIL;
  let password = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
  let nombre = process.env.ADMIN_NOMBRE || 'Administrador';
  let apellido = process.env.ADMIN_APELLIDO || 'TI';

  if (!email) {
    email = await askQuestion('Ingrese email del Superadmin (ej: ti@milicic.com.ar): ');
  }
  if (!password) {
    password = await askQuestion('Ingrese contraseña segura (mínimo 10 caracteres): ');
  }

  email = (email || '').trim().toLowerCase();
  password = (password || '').trim();

  if (!email || !email.includes('@')) {
    console.error('❌ Error: El email ingresado no es válido.');
    process.exit(1);
  }

  const passCheck = validatePasswordStrength(password);
  if (!passCheck.valid) {
    console.error(`❌ Error en la contraseña: ${passCheck.error}`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  // Verificar si ya existe usuario con ese email
  const existing = db.prepare('SELECT * FROM usuarios WHERE organizacion_id = 1 AND email = ?').get(email);

  if (existing) {
    console.log(`⚠️  El usuario ${email} ya existe en el sistema. Actualizando a rol SUPERADMIN y actualizando contraseña...`);
    db.prepare(`
      UPDATE usuarios 
      SET rol = ?, password_hash = ?, activo = 1, intentos_fallidos = 0, bloqueado_hasta = NULL, debe_cambiar_password = 0
      WHERE id = ?
    `).run(ROLES.SUPERADMIN, passwordHash, existing.id);

    recordAudit(db, {
      usuario_id: existing.id,
      usuario_nombre_snapshot: `${existing.nombre} ${existing.apellido}`.trim(),
      accion: 'RESTABLECER_SUPERADMIN_CLI',
      entidad: 'usuario',
      entidad_id: existing.id,
      datos_despues: { email, rol: ROLES.SUPERADMIN }
    });

    console.log(`✅ Superadmin ${email} actualizado con éxito.`);
  } else {
    const newId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO usuarios (
        id, organizacion_id, nombre, apellido, email, origen, password_hash, rol, activo, debe_cambiar_password
      ) VALUES (
        ?, 1, ?, ?, ?, 'local', ?, ?, 1, 0
      )
    `).run(newId, nombre, apellido, email, passwordHash, ROLES.SUPERADMIN);

    recordAudit(db, {
      usuario_id: newId,
      usuario_nombre_snapshot: `${nombre} ${apellido}`.trim(),
      accion: 'CREAR_SUPERADMIN_CLI',
      entidad: 'usuario',
      entidad_id: newId,
      datos_despues: { email, rol: ROLES.SUPERADMIN }
    });

    console.log(`✅ Superadmin creado con éxito. ID: ${newId} (${email})`);
  }

  console.log('\nOperación completada exitosamente.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error inesperado:', err);
  process.exit(1);
});
