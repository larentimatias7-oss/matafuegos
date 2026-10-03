const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { db } = require('../db');
const { authenticate, requirePermiso } = require('../middleware/auth');
const { PERMISOS } = require('../config/permissions');

// Helper to get base URL dynamically from request, env, or settings
function getBaseUrl(req) {
  if (req) {
    const forwardedHost = req.get('x-forwarded-host');
    const host = forwardedHost || req.get('host');
    const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      return `${proto}://${host}`;
    }
  }

  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, '');
  }

  const row = db.prepare("SELECT value FROM settings WHERE key = 'base_url'").get();
  if (row && row.value && row.value.startsWith('http')) {
    return row.value.replace(/\/$/, '');
  }

  if (req) {
    const host = req.get('x-forwarded-host') || req.get('host');
    const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
    return `${proto}://${host}`;
  }

  return 'http://localhost:3000';
}

// GET single QR data URL
router.get('/single/:codeOrPublicId', async (req, res) => {
  try {
    const { codeOrPublicId } = req.params;
    let ext = db.prepare('SELECT * FROM extinguishers WHERE code = ?').get(codeOrPublicId.toUpperCase());
    if (!ext) {
      ext = db.prepare('SELECT * FROM extinguishers WHERE public_id = ?').get(codeOrPublicId.toLowerCase());
    }

    if (!ext) {
      return res.status(404).json({ success: false, error: 'Matafuego no encontrado' });
    }

    const baseUrl = getBaseUrl(req);
    const qrTargetUrl = `${baseUrl}/m/${ext.public_id}`;

    // Level H error correction (30% damage resistance)
    const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      code: ext.code,
      public_id: ext.public_id,
      url: qrTargetUrl,
      qrDataUrl,
      extinguisher: ext
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET batch QRs with filters (floor, area, building)
router.get('/batch', authenticate, requirePermiso(PERMISOS.QR_IMPRIMIR), async (req, res) => {
  try {
    const { floor, area, building, codes, format = 'grid' } = req.query;
    let query = "SELECT * FROM extinguishers WHERE status != 'FUERA_DE_SERVICIO'";
    const params = [];

    if (floor) {
      query += ' AND floor = ?';
      params.push(floor);
    }
    if (area) {
      query += ' AND area = ?';
      params.push(area);
    }
    if (building) {
      query += ' AND building = ?';
      params.push(building);
    }
    if (codes) {
      const codeList = codes.split(',').map(c => c.trim().toUpperCase());
      const placeholders = codeList.map(() => '?').join(',');
      query += ` AND code IN (${placeholders})`;
      params.push(...codeList);
    }

    query += ' ORDER BY code ASC';
    const extinguishers = db.prepare(query).all(...params);

    const baseUrl = getBaseUrl(req);

    // Generate QRs with Error Correction Level H
    const results = await Promise.all(
      extinguishers.map(async (ext) => {
        const qrTargetUrl = `${baseUrl}/m/${ext.public_id}`;
        const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 280,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });

        return {
          id: ext.id,
          code: ext.code,
          public_id: ext.public_id,
          type: ext.type,
          capacity: ext.capacity,
          location: ext.location,
          floor: ext.floor,
          area: ext.area,
          building: ext.building,
          manufacturer: ext.manufacturer,
          expiration_charge: ext.expiration_charge,
          expiration_ph: ext.expiration_ph,
          qrTargetUrl,
          qrDataUrl
        };
      })
    );

    res.json({
      success: true,
      total: results.length,
      format,
      data: results
    });
  } catch (error) {
    console.error('Error generating batch QRs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
