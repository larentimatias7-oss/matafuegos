const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Helper to notify M365 Power Automate Webhook if configured
async function notifyM365Webhook(payload) {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'm365_webhook_url'").get();
    const webhookUrl = row ? row.value : null;

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return false;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (err) {
    console.error('Error enviando datos al webhook de M365 Power Automate:', err.message);
    return false;
  }
}

// GET all inspections with optional month or extinguisher filter
router.get('/', (req, res) => {
  try {
    const { month, code, limit } = req.query;
    let query = `
      SELECT i.*, e.location, e.type, e.capacity, e.floor, e.area
      FROM inspections i
      LEFT JOIN extinguishers e ON i.extinguisher_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (month) {
      query += ' AND i.year_month = ?';
      params.push(month);
    }
    if (code) {
      query += ' AND i.extinguisher_code = ?';
      params.push(code.toUpperCase());
    }

    query += ' ORDER BY i.inspection_date DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(Number(limit));
    } else {
      query += ' LIMIT 200';
    }

    const rows = db.prepare(query).all(...params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET statistics for dashboard
router.get('/stats', (req, res) => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    // Dates for upcoming expirations (30 and 60 days)
    const in30Days = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0];
    const in60Days = new Date(now.getTime() + 60 * 86400000).toISOString().split('T')[0];
    const in90Days = new Date(now.getTime() + 90 * 86400000).toISOString().split('T')[0];

    const totalExtinguishers = db.prepare("SELECT COUNT(*) as c FROM extinguishers WHERE status = 'OPERATIVO'").get().c;
    const allTotal = db.prepare("SELECT COUNT(*) as c FROM extinguishers").get().c;

    // Distinct extinguishers inspected this month
    const inspectedDistinct = db.prepare(`
      SELECT COUNT(DISTINCT extinguisher_id) as c 
      FROM inspections 
      WHERE year_month = ?
    `).get(currentMonth).c;

    // Passed vs Failed this month
    const failedThisMonth = db.prepare(`
      SELECT COUNT(DISTINCT extinguisher_id) as c 
      FROM inspections 
      WHERE year_month = ? AND passed = 0
    `).get(currentMonth).c;

    // Expired charges (already expired)
    const expiredCharges = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE expiration_charge < ? AND status = 'OPERATIVO'
    `).get(todayStr).c;

    // Expiring charges soon (between today and 30 days)
    const expiringChargeSoon = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE expiration_charge >= ? AND expiration_charge <= ? AND status = 'OPERATIVO'
    `).get(todayStr, in30Days).c;

    // Expiring PH soon (between today and 90 days)
    const expiringPhSoon = db.prepare(`
      SELECT COUNT(*) as c FROM extinguishers 
      WHERE expiration_ph >= ? AND expiration_ph <= ? AND status = 'OPERATIVO'
    `).get(todayStr, in90Days).c;

    const pendingThisMonth = Math.max(0, totalExtinguishers - inspectedDistinct);
    const coveragePercentage = totalExtinguishers > 0 
      ? Math.round((inspectedDistinct / totalExtinguishers) * 100) 
      : 0;

    // Recent activity
    const recentActivity = db.prepare(`
      SELECT i.*, e.location, e.type, e.capacity
      FROM inspections i
      LEFT JOIN extinguishers e ON i.extinguisher_id = e.id
      ORDER BY i.id DESC LIMIT 6
    `).all();

    res.json({
      success: true,
      currentMonth,
      metrics: {
        allTotal,
        totalOperative: totalExtinguishers,
        inspectedThisMonth: inspectedDistinct,
        pendingThisMonth,
        failedThisMonth,
        coveragePercentage,
        expiredCharges,
        expiringChargeSoon,
        expiringPhSoon
      },
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST register new inspection
router.post('/', async (req, res) => {
  try {
    const {
      extinguisher_id,
      extinguisher_code,
      inspector_name,
      check_location = 1,
      check_pressure = 1,
      check_seal = 1,
      check_physical = 1,
      check_signage = 1,
      check_card = 1,
      observations = '',
      photo_url = ''
    } = req.body;

    let ext;
    if (extinguisher_id) {
      ext = db.prepare('SELECT * FROM extinguishers WHERE id = ?').get(extinguisher_id);
    } else if (extinguisher_code) {
      ext = db.prepare('SELECT * FROM extinguishers WHERE code = ?').get(extinguisher_code.toUpperCase());
    }

    if (!ext) {
      return res.status(404).json({ success: false, error: 'Matafuego no encontrado' });
    }

    // Determine if all checks passed
    const passed = (
      Number(check_location) === 1 &&
      Number(check_pressure) === 1 &&
      Number(check_seal) === 1 &&
      Number(check_physical) === 1 &&
      Number(check_signage) === 1 &&
      Number(check_card) === 1
    ) ? 1 : 0;

    const now = new Date();
    const inspection_date = now.toISOString().replace('T', ' ').substring(0, 19);
    const year_month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const inspector = (inspector_name || 'Inspector').trim();

    const insert = db.prepare(`
      INSERT INTO inspections (
        extinguisher_id, extinguisher_code, inspector_name, inspection_date, year_month,
        passed, check_location, check_pressure, check_seal, check_physical, check_signage, check_card,
        observations, photo_url, synced_m365
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    const result = insert.run(
      ext.id,
      ext.code,
      inspector,
      inspection_date,
      year_month,
      passed,
      Number(check_location),
      Number(check_pressure),
      Number(check_seal),
      Number(check_physical),
      Number(check_signage),
      Number(check_card),
      observations.trim(),
      photo_url
    );

    const inspectionId = result.lastInsertRowid;

    // Trigger async sync to Microsoft 365 Webhook
    const m365Payload = {
      event: 'INSPECTION_COMPLETED',
      id: inspectionId,
      extinguisher_code: ext.code,
      location: ext.location,
      area: ext.area,
      floor: ext.floor,
      type: ext.type,
      capacity: ext.capacity,
      inspector: inspector,
      date: inspection_date,
      month: year_month,
      result: passed === 1 ? 'APROBADO' : 'CON ANOMALÍAS',
      checks: {
        ubicacion_despejada: check_location === 1 ? 'OK' : 'FALLA',
        manometro_presion: check_pressure === 1 ? 'OK' : 'FALLA',
        precinto_seguridad: check_seal === 1 ? 'OK' : 'FALLA',
        estado_fisico_manguera: check_physical === 1 ? 'OK' : 'FALLA',
        chapa_baliza_cartel: check_signage === 1 ? 'OK' : 'FALLA',
        tarjeta_vencimiento: check_card === 1 ? 'OK' : 'FALLA'
      },
      observations: observations.trim() || 'Sin observaciones'
    };

    notifyM365Webhook(m365Payload).then(synced => {
      if (synced) {
        db.prepare("UPDATE inspections SET synced_m365 = 1 WHERE id = ?").run(inspectionId);
      }
    });

    res.status(201).json({
      success: true,
      message: passed === 1 ? 'Inspección registrada con éxito (OK)' : 'Inspección registrada con observaciones / anomalías',
      passed: passed === 1,
      inspectionId
    });
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
