const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const multer = require('multer');
const { db } = require('../db');

const upload = multer({ storage: multer.memoryStorage() });

// GET export full workbook formatted for Microsoft 365 Excel
router.get('/export-excel', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FireControl 365';
    workbook.created = new Date();
    workbook.properties.date1904 = true;

    // --- SHEET 1: INVENTARIO DE MATAFUEGOS ---
    const extSheet = workbook.addWorksheet('Inventario Matafuegos', {
      views: [{ state: 'frozen', ySplit: 3 }]
    });

    // Title banner
    extSheet.mergeCells('A1:J1');
    const titleCell = extSheet.getCell('A1');
    titleCell.value = 'CONTROL Y SEGUIMIENTO DE EXTINTORES - NORMA IRAM 3517-2';
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Deep Microsoft Blue
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    extSheet.getRow(1).height = 30;

    // Subtitle / Date
    extSheet.mergeCells('A2:J2');
    const subCell = extSheet.getCell('A2');
    subCell.value = `Exportado el: ${new Date().toLocaleString('es-AR')} | Compatible con Excel 365 Online & SharePoint`;
    subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF475569' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    extSheet.getRow(2).height = 20;

    // Column Headers
    const headers = [
      { key: 'code', header: 'Código', width: 14 },
      { key: 'type', header: 'Tipo Extintor', width: 16 },
      { key: 'capacity', header: 'Capacidad', width: 14 },
      { key: 'location', header: 'Ubicación Detallada', width: 32 },
      { key: 'floor', header: 'Piso / Nivel', width: 16 },
      { key: 'area', header: 'Sector / Área', width: 22 },
      { key: 'expiration_charge', header: 'Vto. Recarga Anual', width: 18 },
      { key: 'expiration_ph', header: 'Vto. Prueba Hidráulica', width: 20 },
      { key: 'status', header: 'Estado Físico', width: 16 },
      { key: 'monthly_status', header: 'Estado Mes Actual', width: 20 }
    ];

    const headerRow = extSheet.getRow(3);
    headers.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      extSheet.getColumn(idx + 1).width = col.width;
    });
    headerRow.height = 24;

    // Query all extinguishers
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    const extinguishers = db.prepare('SELECT * FROM extinguishers ORDER BY code ASC').all();

    extinguishers.forEach((ext, index) => {
      const rowNum = index + 4;
      const row = extSheet.getRow(rowNum);

      // Check current month inspection
      const lastInsp = db.prepare(`
        SELECT * FROM inspections 
        WHERE extinguisher_id = ? AND year_month = ?
        ORDER BY id DESC LIMIT 1
      `).get(ext.id, currentMonth);

      let monthlyLabel = 'Pendiente';
      let statusColor = 'FFFEF08A'; // Yellow

      if (ext.expiration_charge < todayStr) {
        monthlyLabel = 'Carga Vencida';
        statusColor = 'FFFECACA'; // Red
      } else if (lastInsp) {
        if (lastInsp.passed === 1) {
          monthlyLabel = 'Controlado OK';
          statusColor = 'FFBBF7D0'; // Green
        } else {
          monthlyLabel = 'Con Anomalías';
          statusColor = 'FFFECACA'; // Red
        }
      }

      row.values = [
        ext.code,
        ext.type,
        ext.capacity,
        ext.location,
        ext.floor,
        ext.area,
        ext.expiration_charge,
        ext.expiration_ph,
        ext.status,
        monthlyLabel
      ];

      // Border and alignment
      for (let colIdx = 1; colIdx <= 10; colIdx++) {
        const cell = row.getCell(colIdx);
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: colIdx === 4 ? 'left' : 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }

      // Highlight monthly status cell
      const statusCell = row.getCell(10);
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: statusColor }
      };
      statusCell.font = { name: 'Segoe UI', size: 10, bold: true };

      row.height = 20;
    });

    // --- SHEET 2: HISTORIAL DE INSPECCIONES ---
    const inspSheet = workbook.addWorksheet('Historial Inspecciones', {
      views: [{ state: 'frozen', ySplit: 2 }]
    });

    inspSheet.mergeCells('A1:L1');
    const inspTitle = inspSheet.getCell('A1');
    inspTitle.value = 'REGISTRO AUDITABLE DE INSPECCIONES MENSUALES';
    inspTitle.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    inspTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F766E' } // Teal
    };
    inspTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    inspSheet.getRow(1).height = 28;

    const inspHeaders = [
      { header: 'ID', width: 8 },
      { header: 'Código', width: 14 },
      { header: 'Fecha y Hora', width: 20 },
      { header: 'Inspector', width: 22 },
      { header: 'Mes Auditoría', width: 15 },
      { header: 'Resultado', width: 16 },
      { header: 'Acceso Libre', width: 14 },
      { header: 'Manómetro OK', width: 15 },
      { header: 'Precinto OK', width: 14 },
      { header: 'Cilindro/Manguera', width: 16 },
      { header: 'Señalización', width: 14 },
      { header: 'Observaciones', width: 35 }
    ];

    const inspHeaderRow = inspSheet.getRow(2);
    inspHeaders.forEach((col, idx) => {
      const cell = inspHeaderRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF14B8A6' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      inspSheet.getColumn(idx + 1).width = col.width;
    });
    inspHeaderRow.height = 22;

    const inspections = db.prepare(`
      SELECT * FROM inspections 
      ORDER BY inspection_date DESC 
      LIMIT 1000
    `).all();

    inspections.forEach((insp, index) => {
      const row = inspSheet.getRow(index + 3);
      row.values = [
        insp.id,
        insp.extinguisher_code,
        insp.inspection_date,
        insp.inspector_name,
        insp.year_month,
        insp.passed === 1 ? 'APROBADO' : 'CON ANOMALÍAS',
        insp.check_location === 1 ? 'OK' : 'FALLA',
        insp.check_pressure === 1 ? 'OK' : 'FALLA',
        insp.check_seal === 1 ? 'OK' : 'FALLA',
        insp.check_physical === 1 ? 'OK' : 'FALLA',
        insp.check_signage === 1 ? 'OK' : 'FALLA',
        insp.observations || 'Sin observaciones'
      ];

      for (let colIdx = 1; colIdx <= 12; colIdx++) {
        const cell = row.getCell(colIdx);
        cell.font = { name: 'Segoe UI', size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: colIdx === 12 ? 'left' : 'center' };
      }

      const resCell = row.getCell(6);
      resCell.font = { name: 'Segoe UI', size: 9, bold: true };
      resCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: insp.passed === 1 ? 'FFBBF7D0' : 'FFFECACA' }
      };

      row.height = 18;
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Control_Matafuegos_${currentMonth}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating M365 Excel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST import extinguishers from Excel
router.post('/import-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se envió ningún archivo Excel' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return res.status(400).json({ success: false, error: 'La hoja de cálculo está vacía' });
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    const upsertStmt = db.prepare(`
      INSERT INTO extinguishers (code, type, capacity, location, floor, area, expiration_charge, expiration_ph, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        type = excluded.type,
        capacity = excluded.capacity,
        location = excluded.location,
        floor = excluded.floor,
        area = excluded.area,
        expiration_charge = excluded.expiration_charge,
        expiration_ph = excluded.expiration_ph,
        status = excluded.status,
        notes = excluded.notes,
        updated_at = datetime('now', 'localtime')
    `);

    worksheet.eachRow((row, rowNumber) => {
      // Skip header rows
      if (rowNumber <= 3) return;

      const code = row.getCell(1).text ? row.getCell(1).text.trim().toUpperCase() : null;
      if (!code || !code.startsWith('MF-')) {
        skipped++;
        return;
      }

      const type = row.getCell(2).text ? row.getCell(2).text.trim() : 'Polvo ABC';
      const capacity = row.getCell(3).text ? row.getCell(3).text.trim() : '5 kg';
      const location = row.getCell(4).text ? row.getCell(4).text.trim() : 'Sin ubicación';
      const floor = row.getCell(5).text ? row.getCell(5).text.trim() : 'Planta Baja';
      const area = row.getCell(6).text ? row.getCell(6).text.trim() : 'General';
      
      let expCharge = row.getCell(7).text ? row.getCell(7).text.trim() : '';
      let expPh = row.getCell(8).text ? row.getCell(8).text.trim() : '';

      // Normalize dates if in DD/MM/YYYY
      if (expCharge.includes('/')) {
        const parts = expCharge.split('/');
        if (parts.length === 3) expCharge = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      if (expPh.includes('/')) {
        const parts = expPh.split('/');
        if (parts.length === 3) expPh = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }

      if (!expCharge) {
        expCharge = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
      }
      if (!expPh) {
        expPh = new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0];
      }

      const status = row.getCell(9).text ? row.getCell(9).text.trim() : 'OPERATIVO';

      try {
        upsertStmt.run(code, type, capacity, location, floor, area, expCharge, expPh, status, '');
        inserted++;
      } catch (e) {
        console.error('Error insertando fila:', code, e.message);
        skipped++;
      }
    });

    res.json({
      success: true,
      message: `Procesamiento completado: ${inserted} procesados, ${skipped} omitidos.`
    });
  } catch (error) {
    console.error('Error importing Excel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET settings
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST save settings
router.post('/settings', (req, res) => {
  try {
    const { m365_webhook_url, base_url, company_name } = req.body;
    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    if (m365_webhook_url !== undefined) upsert.run('m365_webhook_url', m365_webhook_url.trim());
    if (base_url !== undefined) upsert.run('base_url', base_url.trim());
    if (company_name !== undefined) upsert.run('company_name', company_name.trim());

    res.json({ success: true, message: 'Configuraciones guardadas' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST test M365 Power Automate Webhook
router.post('/test-webhook', async (req, res) => {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'm365_webhook_url'").get();
    const webhookUrl = row ? row.value : null;

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return res.status(400).json({
        success: false,
        error: 'No hay configurada una URL de webhook válida para Microsoft 365'
      });
    }

    const testPayload = {
      event: 'TEST_CONNECTION',
      message: 'Prueba de conectividad desde FireControl 365 a Power Automate / Excel 365',
      timestamp: new Date().toISOString(),
      sample_data: {
        extinguisher_code: 'MF-001',
        location: 'Prueba de conexión exitosa',
        inspector: 'Admin',
        status: 'OK'
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    if (response.ok) {
      res.json({ success: true, message: '¡Conexión exitosa! El webhook de Microsoft 365 respondió correctamente.' });
    } else {
      res.status(response.status).json({
        success: false,
        error: `El webhook respondió con código HTTP ${response.status}: ${response.statusText}`
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: `Error conectando con Microsoft 365: ${error.message}` });
  }
});

module.exports = router;
