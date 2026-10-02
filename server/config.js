/**
 * Server Configuration & Environment Variable Validation
 * Milicic FireControl 365
 */

const path = require('path');
const fs = require('fs');

function validateConfig() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(NODE_ENV)) {
    throw new Error(`[CONFIG ERROR] NODE_ENV inválido: "${NODE_ENV}". Debe ser uno de: ${validEnvs.join(', ')}`);
  }

  const rawPort = process.env.PORT || '3000';
  const PORT = parseInt(rawPort, 10);
  if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error(`[CONFIG ERROR] PORT inválido: "${rawPort}". Debe ser un número entre 1 y 65535`);
  }

  const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    throw new Error(`[CONFIG ERROR] No se puede crear o acceder a DATA_DIR en "${DATA_DIR}": ${err.message}`);
  }

  // Security warning/check in production
  if (NODE_ENV === 'production') {
    const sessionSecret = process.env.SESSION_SECRET;
    if (sessionSecret && sessionSecret.length < 16) {
      console.warn('[CONFIG ADVERTENCIA] SESSION_SECRET es demasiado corto. Se recomiendan al menos 32 caracteres.');
    }
  }

  return {
    NODE_ENV,
    PORT,
    DATA_DIR,
    DB_PATH: path.join(DATA_DIR, 'matafuegos.db'),
    BACKUP_DIR: path.join(DATA_DIR, 'backups'),
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    LOG_LEVEL: process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug'),
    IS_PROD: NODE_ENV === 'production',
    IS_TEST: NODE_ENV === 'test'
  };
}

const config = validateConfig();

module.exports = {
  config,
  validateConfig
};
