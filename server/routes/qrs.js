const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { db } = require('../db');

// Helper to get base URL
function getBaseUrl() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'base_url'").get();
  return row ? row.value : 'http://localhost:3000';
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

    const baseUrl = getBaseUrl();
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
router.get('/batch', async (req, res) => {
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

    const baseUrl = getBaseUrl();

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
