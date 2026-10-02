const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { db } = require('../db');

// Helper to get base URL
function getBaseUrl() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'base_url'").get();
  return row ? row.value : 'http://localhost:5173';
}

// GET single QR data URL
router.get('/single/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const ext = db.prepare('SELECT * FROM extinguishers WHERE code = ?').get(code.toUpperCase());

    if (!ext) {
      return res.status(404).json({ success: false, error: 'Matafuego no encontrado' });
    }

    const baseUrl = getBaseUrl();
    const qrTargetUrl = `${baseUrl}/?code=${encodeURIComponent(ext.code)}#check`;

    const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      code: ext.code,
      url: qrTargetUrl,
      qrDataUrl,
      extinguisher: ext
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET batch QRs for all extinguishers (or filter by floor/area)
router.get('/batch', async (req, res) => {
  try {
    const { floor, area, codes } = req.query;
    let query = "SELECT * FROM extinguishers WHERE status != 'BAJA'";
    const params = [];

    if (floor) {
      query += ' AND floor = ?';
      params.push(floor);
    }
    if (area) {
      query += ' AND area = ?';
      params.push(area);
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

    // Generate QRs
    const results = await Promise.all(
      extinguishers.map(async (ext) => {
        const qrTargetUrl = `${baseUrl}/?code=${encodeURIComponent(ext.code)}#check`;
        const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 250,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });

        return {
          id: ext.id,
          code: ext.code,
          type: ext.type,
          capacity: ext.capacity,
          location: ext.location,
          floor: ext.floor,
          area: ext.area,
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
      data: results
    });
  } catch (error) {
    console.error('Error generating batch QRs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
