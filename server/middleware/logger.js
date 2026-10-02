const crypto = require('crypto');

const LOG_LEVELS = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4
};

const currentLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const minLevelValue = LOG_LEVELS[currentLevel] || LOG_LEVELS.info;

function logStructured(level, message, meta = {}) {
  const levelValue = LOG_LEVELS[level.toLowerCase()] || LOG_LEVELS.info;
  if (levelValue < minLevelValue) return;

  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...meta
  };

  // En producción emitir JSON estructurado puro
  if (process.env.NODE_ENV === 'production') {
    process.stdout.write(JSON.stringify(logEntry) + '\n');
  } else {
    // En desarrollo formato limpio y legible
    const reqInfo = meta.requestId ? `[${meta.requestId.slice(0, 8)}] ` : '';
    const statusInfo = meta.statusCode ? ` ${meta.statusCode}` : '';
    const durInfo = meta.durationMs ? ` (${meta.durationMs}ms)` : '';
    console.log(`[${logEntry.timestamp}] [${logEntry.level}] ${reqInfo}${message}${statusInfo}${durInfo}`);
  }
}

const httpMetrics = {
  totalRequests: 0,
  errorResponses: 0,
  syncOperations: 0
};

function getMetrics() {
  return { ...httpMetrics };
}

function incrementSyncOperations() {
  httpMetrics.syncOperations++;
}

/**
 * Middleware para asignar Request ID y registrar latencia de peticiones
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  httpMetrics.totalRequests++;

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const isError = res.statusCode >= 400;

    if (isError) {
      httpMetrics.errorResponses++;
    }

    const level = isError ? (res.statusCode >= 500 ? 'ERROR' : 'WARN') : 'INFO';
    logStructured(level, `${req.method} ${req.originalUrl}`, {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
    });
  });

  next();
}

module.exports = {
  requestLogger,
  logStructured,
  getMetrics,
  incrementSyncOperations
};
