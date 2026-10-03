const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize configuration, database & migrations
const { config } = require('./config');
const { initSchema, db } = require('./db');
initSchema();

const helmet = require('helmet');
const { requestLogger } = require('./middleware/logger');

const app = express();
const PORT = config.PORT;

// Structured JSON request logger & metrics collector
app.use(requestLogger);

// Security headers with Helmet (configured for QR scanning, PWA, camera video & photos)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'http:', 'https:'],
        mediaSrc: ["'self'", 'blob:'],
        connectSrc: ["'self'", 'https:', 'wss:', 'http:'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: null
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// Rate limiter for authentication/login (brute force protection)
const loginAttemptsMap = new Map();
app.use('/api/auth/login', (req, res, next) => {
  if (req.method !== 'POST' || process.env.NODE_ENV === 'test') return next();
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const ip = String(rawIp).split(',')[0].trim();
  const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
  const limit = isLoopback ? 250 : 15;

  const now = Date.now();
  const entry = loginAttemptsMap.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + 15 * 60 * 1000;
  } else {
    entry.count++;
  }
  loginAttemptsMap.set(ip, entry);
  if (entry.count > limit) {
    return res.status(429).json({
      success: false,
      error: 'Demasiados intentos de autenticación. Intente nuevamente en 15 minutos.'
    });
  }
  next();
});

// Lightweight in-memory rate limiter for general /api routes
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = process.env.RATE_LIMIT_MAX 
  ? parseInt(process.env.RATE_LIMIT_MAX, 10) 
  : (process.env.NODE_ENV === 'test' ? 100000 : 300);

app.use('/api', (req, res, next) => {
  if (process.env.RATE_LIMIT_DISABLED === 'true') {
    return next();
  }
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  } else {
    const entry = rateLimitMap.get(ip);
    if (now > entry.resetAt) {
      entry.count = 1;
      entry.resetAt = now + RATE_LIMIT_WINDOW;
    } else {
      entry.count++;
      if (entry.count > MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
          success: false,
          error: 'Demasiadas solicitudes. Por favor espere unos segundos.'
        });
      }
    }
  }
  next();
});

const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
const cookieParser = require('cookie-parser');
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/extinguishers', require('./routes/extinguishers'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/rounds', require('./routes/rounds'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/checklist', require('./routes/checklist'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/qrs', require('./routes/qrs'));
app.use('/api/m365', require('./routes/m365'));

// Short URL redirection for physical QR labels: /m/:publicId
app.get('/m/:publicId', (req, res) => {
  const { publicId } = req.params;
  try {
    const ext = db.prepare('SELECT code, public_id FROM extinguishers WHERE public_id = ?').get(publicId.toLowerCase());
    if (ext) {
      return res.redirect(`/?code=${encodeURIComponent(ext.code)}#check`);
    } else {
      return res.status(404).send('Código QR no encontrado en el sistema de Milicic S.A.');
    }
  } catch (err) {
    return res.status(500).send('Error interno');
  }
});

// Healthcheck and Metrics endpoints
app.use('/api/health', require('./routes/health'));
app.use('/api/metrics', require('./routes/metrics'));

// Serve documentation portal
const docsPath = path.join(__dirname, '../documentacion');
if (fs.existsSync(docsPath)) {
  console.log(`Sirviendo portal de documentación desde ${docsPath}`);
  app.use('/documentacion', express.static(docsPath));
}

// Serve frontend in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  console.log(`Sirviendo archivos estáticos desde ${distPath}`);
  
  // Serve static assets with appropriate caching
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (filePath.includes(path.sep + 'assets' + path.sep)) {
        // Hashed assets can be cached
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // Universal SPA fallback for Express 5
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/m/') && !req.path.startsWith('/documentacion')) {
      // Si la URL apunta a un archivo específico (ej: .js, .css, .png) y no existió en static, devolver 404
      if (req.path.match(/\.[a-zA-Z0-9]+$/)) {
        return res.status(404).type('text/plain').send('Archivo no encontrado');
      }
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Centralized error handling and API 404
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
app.use('/api', notFoundHandler);
app.use(errorHandler);

const isHttps = process.env.HTTPS === 'true';
const sslCertFile = process.env.SSL_CERT_FILE || path.join(__dirname, '../certs/dev-cert.pem');
const sslKeyFile = process.env.SSL_KEY_FILE || path.join(__dirname, '../certs/dev-key.pem');

if (require.main === module) {
  if (isHttps && fs.existsSync(sslCertFile) && fs.existsSync(sslKeyFile)) {
    const https = require('https');
    const sslOptions = {
      key: fs.readFileSync(sslKeyFile),
      cert: fs.readFileSync(sslCertFile)
    };
    https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(`🧯 Milicic FireControl 365 Server (HTTPS Seguro)`);
      console.log(`📡 URL LAN: https://localhost:${PORT}`);
      console.log(`🏥 Healthcheck: https://localhost:${PORT}/api/health`);
      console.log(`🔒 Certificado: ${sslCertFile}`);
      console.log(`===============================================`);
    });
  } else {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(`🧯 Milicic FireControl 365 Server corriendo en puerto ${PORT}`);
      console.log(`📡 URL local: http://localhost:${PORT}`);
      console.log(`🏥 Healthcheck: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });
  }
}

module.exports = { app };
