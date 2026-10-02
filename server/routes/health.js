/**
 * Healthcheck Route with Database & Storage Verification
 * Milicic FireControl 365
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const { db } = require('../db');
const { config } = require('../config');

router.get('/', (req, res) => {
  const startTime = Date.now();
  const checks = {
    database: { status: 'down' },
    storage: { status: 'unknown' },
    memory: { status: 'healthy' }
  };

  let isHealthy = true;

  // 1. Check Database connectivity & integrity
  try {
    const ping = db.prepare('SELECT 1 as alive').get();
    if (ping && ping.alive === 1) {
      const integrity = db.prepare('PRAGMA quick_check;').get();
      checks.database = {
        status: integrity.quick_check === 'ok' ? 'healthy' : 'degraded',
        integrity: integrity.quick_check
      };
      if (integrity.quick_check !== 'ok') {
        isHealthy = false;
      }
    }
  } catch (dbErr) {
    checks.database = {
      status: 'unhealthy',
      error: dbErr.message
    };
    isHealthy = false;
  }

  // 2. Check Disk Storage (fs.statfsSync available in Node 18+)
  try {
    if (typeof fs.statfsSync === 'function') {
      const stats = fs.statfsSync(config.DATA_DIR);
      const totalBytes = stats.bsize * stats.blocks;
      const freeBytes = stats.bsize * stats.bfree;
      const freePercent = (freeBytes / totalBytes) * 100;
      
      checks.storage = {
        status: freePercent > 5 ? 'healthy' : 'low_space',
        totalMb: Math.round(totalBytes / (1024 * 1024)),
        freeMb: Math.round(freeBytes / (1024 * 1024)),
        freePercent: Math.round(freePercent * 10) / 10
      };

      if (freePercent <= 1) {
        isHealthy = false;
      }
    } else {
      checks.storage = { status: 'healthy', note: 'statfs_not_supported' };
    }
  } catch (storageErr) {
    checks.storage = { status: 'healthy', note: storageErr.message };
  }

  // 3. Process Memory
  const mem = process.memoryUsage();
  checks.memory = {
    status: 'healthy',
    rssMb: Math.round(mem.rss / (1024 * 1024)),
    heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
    heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024))
  };

  const responseTimeMs = Date.now() - startTime;
  const statusCode = isHealthy ? 200 : 503;

  const nowIso = new Date().toISOString();
  return res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    system: 'Milicic FireControl 365',
    environment: config.NODE_ENV,
    timestamp: nowIso,
    time: nowIso,
    uptime: Math.floor(process.uptime()),
    uptimeSeconds: Math.floor(process.uptime()),
    responseTimeMs,
    node: process.version,
    nodeVersion: process.version,
    checks
  });
});

module.exports = router;
