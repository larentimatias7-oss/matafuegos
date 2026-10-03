/**
 * Milicic FireControl 365 - Servicio de Autenticación, Hashing Argon2id y Sesiones
 */

const crypto = require('crypto');
const argon2 = require('argon2');
const { ROLES } = require('../config/permissions');
const { recordAudit } = require('./auditService');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const DEFAULT_SESSION_HOURS = 12;

// Lista de contraseñas comunes prohibidas
const COMMON_PASSWORDS = new Set([
  '1234567890',
  '123456789012',
  'password123',
  'admin12345',
  'milicic123',
  'milicic2024',
  'milicic2025',
  'milicic2026',
  'contraseña123',
  'seguridad123',
  'matafuegos123',
  'operaciones123',
  'qwertyuiop'
]);

/**
 * Valida la robustez de una contraseña local.
 * Política: mínimo 10 caracteres, no estar en lista de comunes.
 */
function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'La contraseña es obligatoria' };
  }
  if (password.length < 10) {
    return { valid: false, error: 'La contraseña debe tener al menos 10 caracteres' };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase().trim())) {
    return { valid: false, error: 'La contraseña elegida es demasiado común o predecible' };
  }
  return { valid: true };
}

/**
 * Valida formato de PIN para cambio rápido en dispositivo compartido (4 a 6 dígitos numéricos).
 */
function validatePinFormat(pin) {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, error: 'El PIN es obligatorio' };
  }
  if (!/^\d{4,6}$/.test(pin.trim())) {
    return { valid: false, error: 'El PIN debe contener exactamente entre 4 y 6 números' };
  }
  return { valid: true };
}

/**
 * Genera hash Argon2id de alta seguridad.
 */
async function hashPassword(password) {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1
  });
}

/**
 * Verifica contraseña contra hash Argon2id.
 */
async function verifyPassword(hash, password) {
  if (!hash || !password) return false;
  try {
    return await argon2.verify(hash, password);
  } catch (e) {
    return false;
  }
}

/**
 * Genera hash Argon2id para PIN.
 */
async function hashPin(pin) {
  return await argon2.hash(pin.trim(), {
    type: argon2.argon2id,
    memoryCost: 2 ** 15,
    timeCost: 2,
    parallelism: 1
  });
}

/**
 * Verifica PIN contra hash.
 */
async function verifyPin(hash, pin) {
  if (!hash || !pin) return false;
  try {
    return await argon2.verify(hash, pin.trim());
  } catch (e) {
    return false;
  }
}

/**
 * Genera un ID de sesión opaco criptográficamente aleatorio (64 caracteres hexadecimales = 32 bytes).
 */
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Crea una sesión activa en la base de datos y calcula su expiración.
 */
function createSession(db, { usuario_id, req = null, durationHours = DEFAULT_SESSION_HOURS }) {
  const sessionId = generateSessionId();
  const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1') : '127.0.0.1';
  const userAgent = req ? (req.headers['user-agent'] || 'App / Browser') : 'App / Browser';
  const device = req?.headers['x-device-name'] || (userAgent.includes('Mobile') ? 'Dispositivo Móvil' : 'Estación de Trabajo');

  const expDate = new Date(Date.now() + durationHours * 3600 * 1000);
  const expiraEn = expDate.toISOString().replace('T', ' ').substring(0, 19);

  db.prepare(`
    INSERT INTO sesiones (id, usuario_id, dispositivo, ip, user_agent, expira_en, revocada)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(sessionId, usuario_id, device, ip, userAgent, expiraEn);

  // Actualizar último acceso del usuario
  db.prepare("UPDATE usuarios SET ultimo_acceso = datetime('now', 'localtime') WHERE id = ?").run(usuario_id);

  return {
    sessionId,
    expiraEn,
    maxAgeMs: durationHours * 3600 * 1000
  };
}

/**
 * Revoca una sesión individual.
 */
function revokeSession(db, sessionId) {
  db.prepare('UPDATE sesiones SET revocada = 1 WHERE id = ?').run(sessionId);
}

/**
 * Revoca todas las sesiones de un usuario.
 */
function revokeAllUserSessions(db, userId) {
  db.prepare('UPDATE sesiones SET revocada = 1 WHERE usuario_id = ?').run(userId);
}

/**
 * Maneja intento fallido de login local e incrementa contador con bloqueo temporal si corresponde.
 */
function handleFailedLogin(db, user) {
  if (!user) return;
  const newAttempts = (user.intentos_fallidos || 0) + 1;
  let bloqueadoHasta = null;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockDate = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    bloqueadoHasta = lockDate.toISOString().replace('T', ' ').substring(0, 19);
  }

  db.prepare(`
    UPDATE usuarios 
    SET intentos_fallidos = ?, bloqueado_hasta = ?
    WHERE id = ?
  `).run(newAttempts, bloqueadoHasta, user.id);
}

/**
 * Restablece contador de intentos fallidos tras login exitoso.
 */
function resetFailedLogin(db, userId) {
  db.prepare(`
    UPDATE usuarios 
    SET intentos_fallidos = 0, bloqueado_hasta = NULL 
    WHERE id = ?
  `).run(userId);
}

/**
 * Aprovisionamiento Just-in-Time (JIT) para usuarios de Microsoft Entra ID.
 */
function provisionEntraUser(db, { oid, email, nombre, apellido, rolesFromEntra = [] }) {
  const normalizedEmail = email.toLowerCase().trim();
  const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || 'milicic.com.ar')
    .split(',')
    .map(d => d.trim().toLowerCase());

  const emailDomain = normalizedEmail.split('@')[1];
  if (!allowedDomains.includes(emailDomain)) {
    throw new Error(`Acceso denegado: El dominio de correo '${emailDomain}' no está autorizado para acceder a este tenant.`);
  }

  // Mapeo opcional de grupos o roles de Entra
  let mappedRole = ROLES.INSPECTOR;
  if (rolesFromEntra.includes('Admin') || rolesFromEntra.includes('Milicic-HyS-Admins')) {
    mappedRole = ROLES.ADMIN;
  } else if (rolesFromEntra.includes('SuperAdmin') || rolesFromEntra.includes('Milicic-TI-Admins')) {
    mappedRole = ROLES.SUPERADMIN;
  } else if (rolesFromEntra.includes('Supervisor') || rolesFromEntra.includes('Milicic-Supervisores')) {
    mappedRole = ROLES.SUPERVISOR;
  }

  // Buscar si ya existe por entra_oid o por email
  let user = db.prepare('SELECT * FROM usuarios WHERE entra_oid = ? OR (organizacion_id = 1 AND email = ?)').get(oid, normalizedEmail);

  if (user) {
    // Si ya existe pero le faltaba el oid, asociarlo
    if (!user.entra_oid && oid) {
      db.prepare("UPDATE usuarios SET entra_oid = ?, origen = 'entra' WHERE id = ?").run(oid, user.id);
      user.entra_oid = oid;
    }
    return user;
  }

  // Crear usuario JIT nuevo
  const newUserId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO usuarios (
      id, organizacion_id, nombre, apellido, email, origen, entra_oid, rol, activo, debe_cambiar_password
    ) VALUES (
      ?, 1, ?, ?, ?, 'entra', ?, ?, 1, 0
    )
  `).run(newUserId, nombre || 'Usuario', apellido || 'Milicic', normalizedEmail, oid, mappedRole);

  recordAudit(db, {
    usuario_id: newUserId,
    usuario_nombre_snapshot: `${nombre} ${apellido}`.trim(),
    accion: 'APROVISIONAMIENTO_JIT',
    entidad: 'usuario',
    entidad_id: newUserId,
    datos_despues: { email: normalizedEmail, rol: mappedRole, origen: 'entra' }
  });

  return db.prepare('SELECT * FROM usuarios WHERE id = ?').get(newUserId);
}

module.exports = {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_MINUTES,
  DEFAULT_SESSION_HOURS,
  validatePasswordStrength,
  validatePinFormat,
  hashPassword,
  verifyPassword,
  hashPin,
  verifyPin,
  generateSessionId,
  createSession,
  revokeSession,
  revokeAllUserSessions,
  handleFailedLogin,
  resetFailedLogin,
  provisionEntraUser
};
