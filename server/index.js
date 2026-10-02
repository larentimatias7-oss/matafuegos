const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize database
const { initSchema } = require('./db');
initSchema();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/extinguishers', require('./routes/extinguishers'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/qrs', require('./routes/qrs'));
app.use('/api/m365', require('./routes/m365'));

// Healthcheck endpoint for Dokploy / Docker healthchecks
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
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
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🧯 FireControl 365 Server corriendo en puerto ${PORT}`);
  console.log(`📡 URL local: http://localhost:${PORT}`);
  console.log(`🏥 Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
