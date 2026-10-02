const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize database & migrations
const { initSchema, db } = require('./db');
initSchema();

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Lightweight in-memory rate limiter for /api routes
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 300;

app.use('/api', (req, res, next) => {
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
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/extinguishers', require('./routes/extinguishers'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/rounds', require('./routes/rounds'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/checklist', require('./routes/checklist'));
app.use('/api/auth', require('./routes/auth'));
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

// Healthcheck endpoint for Dokploy / Docker healthchecks
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Milicic FireControl 365',
    time: new Date().toISOString(),
    uptime: process.uptime(),
    node: process.version
  });
});

// Serve frontend in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  console.log(`Sirviendo archivos estáticos desde ${distPath}`);
  app.use(express.static(distPath));

  // Universal SPA fallback for Express 5
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/m/')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🧯 Milicic FireControl 365 Server corriendo en puerto ${PORT}`);
  console.log(`📡 URL local: http://localhost:${PORT}`);
  console.log(`🏥 Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
