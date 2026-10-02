/**
 * Prometheus Metrics Route
 * Milicic FireControl 365
 * Standard plain text format (OpenMetrics / Prometheus version 0.0.4)
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { getMetrics } = require('../middleware/logger');

router.get('/', (req, res) => {
  const lines = [];

  // Helper to format Prometheus metrics
  function metric(name, help, type, value, labels = '') {
    lines.push(`# HELP ${name} ${help}`);
    lines.push(`# TYPE ${name} ${type}`);
    const labelStr = labels ? `{${labels}}` : '';
    lines.push(`${name}${labelStr} ${value}`);
  }

  // 1. Uptime and Process Metrics
  metric('firecontrol_uptime_seconds', 'Uptime in seconds', 'gauge', Math.floor(process.uptime()));
  const mem = process.memoryUsage();
  metric('firecontrol_memory_heap_bytes', 'Node.js heap used in bytes', 'gauge', mem.heapUsed);
  metric('firecontrol_memory_rss_bytes', 'Node.js RSS memory in bytes', 'gauge', mem.rss);

  // 2. HTTP Request Counters from in-memory logger
  const httpMetrics = getMetrics();
  metric('firecontrol_http_requests_total', 'Total HTTP requests received', 'counter', httpMetrics.totalRequests);
  metric('firecontrol_http_errors_total', 'Total HTTP 4xx/5xx responses', 'counter', httpMetrics.errorResponses);
  metric('firecontrol_sync_operations_total', 'Total M365 sync operations', 'counter', httpMetrics.syncOperations);

  // 3. Business / Database Metrics
  try {
    const totalExt = db.prepare('SELECT COUNT(*) as count FROM extinguishers').get().count;
    metric('firecontrol_extinguishers_total', 'Total extinguishers in inventory', 'gauge', totalExt);

    const extByStatus = db.prepare('SELECT status, COUNT(*) as count FROM extinguishers GROUP BY status').all();
    for (const s of extByStatus) {
      lines.push(`firecontrol_extinguishers_by_status{status="${s.status}"} ${s.count}`);
    }

    const totalInspections = db.prepare('SELECT COUNT(*) as count FROM inspections').get().count;
    metric('firecontrol_inspections_total', 'Total recorded inspections', 'counter', totalInspections);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayInspections = db.prepare('SELECT COUNT(*) as count FROM inspections WHERE inspection_date >= ?').get(todayStr).count;
    metric('firecontrol_inspections_today', 'Inspections recorded today', 'gauge', todayInspections);

    const openCases = db.prepare("SELECT COUNT(*) as count FROM cases WHERE status != 'RESUELTO'").get().count;
    metric('firecontrol_open_cases_total', 'Current open anomaly cases', 'gauge', openCases);

    // Active round coverage
    const activeRound = db.prepare("SELECT year_month FROM rounds WHERE status = 'ABIERTA' ORDER BY id DESC LIMIT 1").get();
    if (activeRound && totalExt > 0) {
      const inspectedInRound = db.prepare('SELECT COUNT(DISTINCT extinguisher_id) as count FROM inspections WHERE year_month = ?').get(activeRound.year_month).count;
      const coverageRatio = Math.round((inspectedInRound / totalExt) * 1000) / 1000;
      metric('firecontrol_round_coverage_ratio', 'Coverage ratio of active inspection round (0.0 to 1.0)', 'gauge', coverageRatio, `year_month="${activeRound.year_month}"`);
    }
  } catch (dbErr) {
    lines.push(`# Error querying database metrics: ${dbErr.message}`);
  }

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(lines.join('\n') + '\n');
});

module.exports = router;
