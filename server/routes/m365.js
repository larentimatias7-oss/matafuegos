const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const multer = require('multer');
const { db } = require('../db');
const { authenticate, requirePermiso } = require('../middleware/auth');
const { PERMISOS } = require('../config/permissions');
const { recordAudit } = require('../services/auditService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max
  },
  fileFilter: (_req, file, cb) => {
    const isXlsx = file.originalname.toLowerCase().endsWith('.xlsx') || file.originalname.toLowerCase().endsWith('.xls');
    if (isXlsx) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de planilla Excel (.xlsx, .xls)'));
    }
  }
});

// GET export full workbook formatted for Microsoft 365 Excel
router.get('/export-excel', authenticate, requirePermiso(PERMISOS.REPORTE_EXPORTAR), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Milicic S.A. - Control de Extintores';
    workbook.created = new Date();
    workbook.properties.date1904 = true;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    // Datos generales
    const round = db.prepare("SELECT * FROM rounds WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1").get();
    const totalExt = db.prepare('SELECT COUNT(*) as c FROM extinguishers').get().c;
    const inspectedCount = round 
      ? db.prepare('SELECT COUNT(DISTINCT extinguisher_id) as c FROM inspections WHERE round_id = ?').get(round.id).c 
      : 0;
    const passedCount = round
      ? db.prepare('SELECT COUNT(DISTINCT extinguisher_id) as c FROM inspections WHERE round_id = ? AND passed = 1').get(round.id).c
      : 0;
    const failedCount = round
      ? db.prepare('SELECT COUNT(DISTINCT extinguisher_id) as c FROM inspections WHERE round_id = ? AND passed = 0').get(round.id).c
      : 0;
    const openCasesCount = db.prepare("SELECT COUNT(*) as c FROM cases WHERE status IN ('OPEN', 'IN_WORKSHOP', 'TEMP_REPLACED')").get().c;

    // --- HOJA 1: RESUMEN EJECUTIVO (AUDITORÍA & ART) ---
    const sumSheet = workbook.addWorksheet('Resumen Ejecutivo', {
      views: [{ showGridLines: true }]
    });

    sumSheet.mergeCells('A1:G1');
    const titleCell = sumSheet.getCell('A1');
    titleCell.value = 'MILICIC S.A. | INFORME MENSUAL DE CONTROL DE EXTINTORES - IRAM 3517-2';
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sumSheet.getRow(1).height = 36;

    sumSheet.mergeCells('A2:G2');
    const subCell = sumSheet.getCell('A2');
    subCell.value = `Ronda Activa: ${round ? round.title : currentMonth} | Emisión: ${new Date().toLocaleDateString('es-AR')} | Válido para ART y Auditorías`;
    subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF475569' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sumSheet.getRow(2).height = 22;

    // KPI Table
    const kpis = [
      ['Total Equipos en Parque', totalExt, 'Total de extintores inventariados'],
      ['Equipos Inspeccionados en el Mes', inspectedCount, `${totalExt > 0 ? Math.round((inspectedCount/totalExt)*100) : 0}% de cobertura`],
      ['Inspecciones Conformes (OK)', passedCount, 'Sin anomalías registradas'],
      ['Inspecciones con Falla / No Conformes', failedCount, 'Requieren acción correctiva'],
      ['Casos de Anomalías en Gestión', openCasesCount, 'Abiertos, en taller o con reemplazo']
    ];

    sumSheet.getCell('A4').value = 'MÉTRICA DE GESTIÓN';
    sumSheet.getCell('A4').font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' } };
    sumSheet.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA580C' } };
    sumSheet.mergeCells('A4:C4');

    sumSheet.getCell('D4').value = 'VALOR';
    sumSheet.getCell('D4').font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' } };
    sumSheet.getCell('D4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA580C' } };
    sumSheet.getCell('D4').alignment = { horizontal: 'center' };

    sumSheet.getCell('E4').value = 'DETALLE / OBSERVACIÓN';
    sumSheet.getCell('E4').font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' } };
    sumSheet.getCell('E4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA580C' } };
    sumSheet.mergeCells('E4:G4');

    kpis.forEach((kpi, idx) => {
      const rNum = 5 + idx;
      sumSheet.mergeCells(`A${rNum}:C${rNum}`);
      sumSheet.getCell(`A${rNum}`).value = kpi[0];
      sumSheet.getCell(`A${rNum}`).font = { name: 'Segoe UI', bold: true };
      
      sumSheet.getCell(`D${rNum}`).value = kpi[1];
      sumSheet.getCell(`D${rNum}`).font = { name: 'Segoe UI', bold: true, size: 12 };
      sumSheet.getCell(`D${rNum}`).alignment = { horizontal: 'center' };

      sumSheet.mergeCells(`E${rNum}:G${rNum}`);
      sumSheet.getCell(`E${rNum}`).value = kpi[2];
      sumSheet.getCell(`E${rNum}`).font = { name: 'Segoe UI', italic: true, color: { argb: 'FF64748B' } };
      sumSheet.getRow(rNum).height = 24;
    });

    // Cuadro de Firmas
    const signRow = 12;
    sumSheet.mergeCells(`A${signRow}:C${signRow}`);
    sumSheet.getCell(`A${signRow}`).value = 'RESPONSABLE HIGIENE Y SEGURIDAD LABORAL';
    sumSheet.getCell(`A${signRow}`).font = { name: 'Segoe UI', bold: true, size: 9 };
    sumSheet.getCell(`A${signRow}`).alignment = { horizontal: 'center' };

    sumSheet.mergeCells(`E${signRow}:G${signRow}`);
    sumSheet.getCell(`E${signRow}`).value = 'FIRMA Y SELLO / AUDITORÍA ART';
    sumSheet.getCell(`E${signRow}`).font = { name: 'Segoe UI', bold: true, size: 9 };
    sumSheet.getCell(`E${signRow}`).alignment = { horizontal: 'center' };

    sumSheet.mergeCells(`A${signRow + 3}:C${signRow + 3}`);
    sumSheet.getCell(`A${signRow + 3}`).value = 'Aclaración / Matrícula Profesional';
    sumSheet.getCell(`A${signRow + 3}`).border = { top: { style: 'thin' } };
    sumSheet.getCell(`A${signRow + 3}`).alignment = { horizontal: 'center' };

    sumSheet.mergeCells(`E${signRow + 3}:G${signRow + 3}`);
    sumSheet.getCell(`E${signRow + 3}`).value = 'Fecha y Conformidad';
    sumSheet.getCell(`E${signRow + 3}`).border = { top: { style: 'thin' } };
    sumSheet.getCell(`E${signRow + 3}`).alignment = { horizontal: 'center' };

    // --- HOJA 2: INVENTARIO DE MATAFUEGOS ---
    const extSheet = workbook.addWorksheet('Inventario Matafuegos', {
      views: [{ state: 'frozen', ySplit: 2 }]
    });

    const headers = [
      { key: 'code', header: 'Código', width: 14 },
      { key: 'type', header: 'Tipo Extintor', width: 16 },
      { key: 'capacity', header: 'Capacidad', width: 14 },
      { key: 'location', header: 'Ubicación Detallada', width: 30 },
      { key: 'floor', header: 'Piso / Nivel', width: 16 },
      { key: 'area', header: 'Sector / Área', width: 20 },
      { key: 'manufacturer', header: 'Fabricante', width: 16 },
      { key: 'fab_year', header: 'Año Fab.', width: 12 },
      { key: 'expiration_charge', header: 'Vto. Recarga Anual', width: 18 },
      { key: 'expiration_ph', header: 'Vto. Prueba Hidr. (5a)', width: 22 },
      { key: 'collar_year_color', header: 'Marbete/Collarín', width: 18 },
      { key: 'status', header: 'Estado Físico', width: 16 },
      { key: 'monthly_status', header: 'Control del Mes', width: 18 }
    ];

    const headerRow = extSheet.getRow(2);
    headers.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA580C' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      extSheet.getColumn(idx + 1).width = col.width;
    });
    headerRow.height = 24;

    const extinguishers = db.prepare('SELECT * FROM extinguishers ORDER BY code ASC').all();

    extinguishers.forEach((ext, index) => {
      const rowNum = index + 3;
      const row = extSheet.getRow(rowNum);

      const lastInsp = db.prepare(`
        SELECT * FROM inspections 
        WHERE extinguisher_id = ? AND (round_id = ? OR year_month = ?)
        ORDER BY id DESC LIMIT 1
      `).get(ext.id, round?.id || 0, currentMonth);

      let monthlyLabel = 'Pendiente';
      let statusColor = 'FFFEF08A';

      if (ext.expiration_charge < todayStr) {
        monthlyLabel = 'Carga Vencida';
        statusColor = 'FFFECACA';
      } else if (lastInsp) {
        if (lastInsp.passed === 1) {
          monthlyLabel = 'Conforme OK';
          statusColor = 'FFBBF7D0';
        } else {
          monthlyLabel = 'Con Falla';
          statusColor = 'FFFECACA';
        }
      }

      row.values = [
        ext.code,
        ext.type,
        ext.capacity,
        ext.location,
        ext.floor,
        ext.area,
        ext.manufacturer || 'N/A',
        ext.fab_year || 'N/A',
        ext.expiration_charge,
        ext.expiration_ph,
        ext.collar_year_color || 'Vigente',
        ext.status,
        monthlyLabel
      ];

      for (let colIdx = 1; colIdx <= 13; colIdx++) {
        const cell = row.getCell(colIdx);
        cell.font = { name: 'Segoe UI', size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: colIdx === 4 ? 'left' : 'center' };
      }

      const statusCell = row.getCell(13);
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColor } };
      statusCell.font = { name: 'Segoe UI', size: 9, bold: true };
      row.height = 20;
    });

    // --- HOJA 3: HISTORIAL DE INSPECCIONES ---
    const inspSheet = workbook.addWorksheet('Inspecciones Mensuales', {
      views: [{ state: 'frozen', ySplit: 2 }]
    });

    const inspHeaders = [
      { header: 'ID', width: 8 },
      { header: 'Código', width: 14 },
      { header: 'Fecha y Hora', width: 20 },
      { header: 'Inspector', width: 22 },
      { header: 'Ronda', width: 18 },
      { header: 'Resultado', width: 16 },
      { header: 'Reinspección', width: 16 },
      { header: 'Tiempo (seg)', width: 14 },
      { header: 'Antifraude', width: 14 },
      { header: 'Observaciones / Detalle', width: 40 }
    ];

    const inspHeaderRow = inspSheet.getRow(2);
    inspHeaders.forEach((col, idx) => {
      const cell = inspHeaderRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      inspSheet.getColumn(idx + 1).width = col.width;
    });
    inspHeaderRow.height = 24;

    const inspections = db.prepare(`
      SELECT * FROM inspections 
      ORDER BY id DESC 
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
        insp.passed === 1 ? 'CONFORME' : 'CON ANOMALÍA',
        insp.is_reinspection ? `Sí (${insp.reinspection_reason || ''})` : 'No',
        insp.duration_seconds || 'N/D',
        insp.is_suspicious === 1 ? 'SOSPECHOSA' : 'OK',
        insp.observations || 'Sin observaciones'
      ];

      for (let colIdx = 1; colIdx <= 10; colIdx++) {
        const cell = row.getCell(colIdx);
        cell.font = { name: 'Segoe UI', size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: colIdx === 10 ? 'left' : 'center' };
      }

      const resCell = row.getCell(6);
      resCell.font = { name: 'Segoe UI', size: 9, bold: true };
      resCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: insp.passed === 1 ? 'FFBBF7D0' : 'FFFECACA' }
      };

      row.height = 19;
    });

    // --- HOJA 4: CASOS Y ANOMALÍAS ---
    const caseSheet = workbook.addWorksheet('Casos de Anomalías', {
      views: [{ state: 'frozen', ySplit: 2 }]
    });

    const caseHeaders = [
      { header: 'ID Caso', width: 10 },
      { header: 'Código Extintor', width: 16 },
      { header: 'Fecha Detección', width: 20 },
      { header: 'Estado', width: 18 },
      { header: 'Antigüedad (días)', width: 18 },
      { header: 'Equipo Reemplazo', width: 18 },
      { header: 'Descripción de la Falla', width: 45 }
    ];

    const caseHeaderRow = caseSheet.getRow(2);
    caseHeaders.forEach((col, idx) => {
      const cell = caseHeaderRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      caseSheet.getColumn(idx + 1).width = col.width;
    });
    caseHeaderRow.height = 24;

    const cases = db.prepare('SELECT * FROM cases ORDER BY id DESC').all();
    cases.forEach((c, index) => {
      const daysOld = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const row = caseSheet.getRow(index + 3);
      row.values = [
        `#CASO-${c.id}`,
        c.extinguisher_code,
        c.created_at,
        c.status,
        daysOld,
        c.temp_replacement_code || 'Ninguno',
        c.title + (c.description ? ` - ${c.description}` : '')
      ];

      for (let colIdx = 1; colIdx <= 7; colIdx++) {
        const cell = row.getCell(colIdx);
        cell.font = { name: 'Segoe UI', size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: colIdx === 7 ? 'left' : 'center' };
      }
      row.height = 19;
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Milicic_Control_Matafuegos_${currentMonth}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating M365 Excel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET HTML printable report for ART and Fire Department Audits
router.get('/report-html', authenticate, requirePermiso(PERMISOS.REPORTE_EXPORTAR), (req, res) => {
  try {
    const round = db.prepare("SELECT * FROM rounds WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1").get();
    const extinguishers = db.prepare('SELECT * FROM extinguishers ORDER BY code ASC').all();
    const cases = db.prepare("SELECT * FROM cases WHERE status IN ('OPEN', 'IN_WORKSHOP', 'TEMP_REPLACED')").all();
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN expiration_charge < date('now') THEN 1 ELSE 0 END) as charge_expired,
        SUM(CASE WHEN expiration_ph < date('now') THEN 1 ELSE 0 END) as ph_expired
      FROM extinguishers
    `).get();

    const currentMonth = new Date().toISOString().slice(0, 7);
    const inspected = round 
      ? db.prepare('SELECT COUNT(DISTINCT extinguisher_id) as c FROM inspections WHERE round_id = ?').get(round.id).c
      : 0;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Milicic S.A. | Informe Oficial de Control de Extintores</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F172A; margin: 0; padding: 0; font-size: 11pt; line-height: 1.4; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #EA580C; padding-bottom: 12px; margin-bottom: 20px; }
    .brand { font-size: 20pt; font-weight: 900; color: #0F172A; }
    .brand span { color: #EA580C; }
    .title-box { text-align: right; }
    .title-box h1 { margin: 0; font-size: 14pt; color: #0F172A; }
    .title-box p { margin: 2px 0 0 0; font-size: 9pt; color: #64748B; }
    
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .kpi-card { background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px; text-align: center; }
    .kpi-val { font-size: 18pt; font-weight: 800; color: #EA580C; }
    .kpi-lbl { font-size: 8pt; text-transform: uppercase; color: #475569; font-weight: 700; }
    
    h2 { font-size: 11pt; border-left: 4px solid #EA580C; padding-left: 8px; margin: 15px 0 8px 0; text-transform: uppercase; color: #0F172A; }
    table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 15px; }
    th { background: #0F172A; color: #FFFFFF; font-weight: 700; text-align: left; padding: 6px 8px; }
    td { border-bottom: 1px solid #E2E8F0; padding: 5px 8px; }
    tr:nth-child(even) td { background: #F8FAFC; }
    .tag-ok { color: #16A34A; font-weight: 700; }
    .tag-fail { color: #DC2626; font-weight: 700; }
    .tag-warn { color: #D97706; font-weight: 700; }

    .signatures { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; page-break-inside: avoid; }
    .sign-box { border-top: 1px solid #0F172A; text-align: center; padding-top: 8px; }
    .sign-title { font-weight: 700; font-size: 9pt; }
    .sign-sub { font-size: 8pt; color: #64748B; }

    .footer { font-size: 7.5pt; color: #94A3B8; text-align: center; margin-top: 20px; border-top: 1px solid #E2E8F0; padding-top: 6px; }

    @media print {
      .no-print { display: none; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #FFF7ED; border: 1px solid #FDBA74; padding: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border-radius: 6px;">
    <span><strong>Informe Oficial de Auditoría y ART</strong> - Listo para imprimir o guardar en PDF</span>
    <button onclick="window.print()" style="background: #EA580C; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">
      Imprimir / Guardar como PDF
    </button>
  </div>

  <div class="header">
    <div class="brand">MILICIC <span>S.A.</span></div>
    <div class="title-box">
      <h1>CONTROL PERIÓDICO DE EXTINTORES</h1>
      <p>Norma IRAM 3517-2 • Periodo: ${round ? round.title : currentMonth}</p>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-val">${extinguishers.length}</div>
      <div class="kpi-lbl">Total Equipos</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val">${inspected}</div>
      <div class="kpi-lbl">Inspeccionados</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val" style="color: ${cases.length > 0 ? '#DC2626' : '#16A34A'}">${cases.length}</div>
      <div class="kpi-lbl">Casos / Fallas</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val" style="color: ${stats.charge_expired > 0 ? '#DC2626' : '#16A34A'}">${stats.charge_expired}</div>
      <div class="kpi-lbl">Cargas Vencidas</div>
    </div>
  </div>

  <h2>1. Resumen de Anomalías y Casos Abiertos</h2>
  ${cases.length === 0 ? '<p style="font-size: 8.5pt; color: #16A34A; font-weight: bold;">Sin casos de anomalías abiertos. Todos los equipos se encuentran operativos.</p>' : `
  <table>
    <thead>
      <tr>
        <th>Caso</th>
        <th>Código</th>
        <th>Fecha Detección</th>
        <th>Estado</th>
        <th>Reemplazo Temporal</th>
        <th>Descripción de Falla</th>
      </tr>
    </thead>
    <tbody>
      ${cases.map(c => `
        <tr>
          <td><strong>#CASO-${c.id}</strong></td>
          <td><strong>${c.extinguisher_code}</strong></td>
          <td>${c.created_at}</td>
          <td><span class="tag-fail">${c.status}</span></td>
          <td>${c.temp_replacement_code || 'No asignado'}</td>
          <td>${c.title}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  `}

  <h2>2. Parque de Extintores e Inspecciones (Muestra Principal)</h2>
  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Tipo / Cap.</th>
        <th>Ubicación / Sector</th>
        <th>Piso</th>
        <th>Vto. Carga</th>
        <th>Vto. PH</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${extinguishers.slice(0, 45).map(e => `
        <tr>
          <td><strong>${e.code}</strong></td>
          <td>${e.type} (${e.capacity})</td>
          <td>${e.location}</td>
          <td>${e.floor}</td>
          <td>${e.expiration_charge}</td>
          <td>${e.expiration_ph}</td>
          <td><span class="${e.status === 'OPERATIVO' ? 'tag-ok' : 'tag-fail'}">${e.status}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="signatures">
    <div class="sign-box">
      <div class="sign-title">RESPONSABLE DE HIGIENE Y SEGURIDAD</div>
      <div class="sign-sub">Milicic S.A. • Matrícula Profesional</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">AUDITORÍA EXTERNA / ART / BOMBEROS</div>
      <div class="sign-sub">Firma, Aclaración y Sello</div>
    </div>
  </div>

  <div class="footer">
    Documento confidencial generado automáticamente por el Sistema de Control de Extintores de Milicic S.A. • Cumplimiento IRAM 3517-2 y Ley 19.587 de Higiene y Seguridad en el Trabajo.
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Error generating printable report:', error);
    res.status(500).send('Error generando reporte');
  }
});

// POST import extinguishers from Excel
router.post('/import-excel', authenticate, requirePermiso(PERMISOS.REPORTE_IMPORTAR), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se envió ningún archivo Excel' });
    }

    // Validar firma binaria real (magic bytes) para prevenir subida de scripts o ejecutables disfrazados
    const isZip = req.file.buffer.length >= 4 && req.file.buffer[0] === 0x50 && req.file.buffer[1] === 0x4B; // PK (ZIP / XLSX)
    const isOle = req.file.buffer.length >= 8 && req.file.buffer[0] === 0xD0 && req.file.buffer[1] === 0xCF; // OLE2 (XLS)
    if (!isZip && !isOle) {
      return res.status(400).json({
        success: false,
        error: 'El archivo subido no es una planilla Excel válida (firma de archivo binaria no autorizada).'
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return res.status(400).json({ success: false, error: 'La hoja de cálculo está vacía' });
    }

    let inserted = 0;
    let skipped = 0;

    const orgId = req.user?.organizacion_id || 1;
    const upsertStmt = db.prepare(`
      INSERT INTO extinguishers (organizacion_id, code, type, capacity, location, floor, area, expiration_charge, expiration_ph, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        upsertStmt.run(orgId, code, type, capacity, location, floor, area, expCharge, expPh, status, '');
        inserted++;
      } catch (e) {
        console.error('Error insertando fila:', code, e.message);
        skipped++;
      }
    });

    recordAudit(db, {
      usuario_id: req.user?.id || null,
      usuario_nombre_snapshot: req.user?.name || 'Sistema',
      organizacion_id: req.user?.organizacion_id || 1,
      accion: 'IMPORTAR_EXCEL',
      entidad: 'inventario',
      entidad_id: 0,
      datos_despues: { inserted, skipped },
      req
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
router.get('/settings', authenticate, requirePermiso(PERMISOS.CONFIG_GESTIONAR), (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST save settings (Config managers only)
router.post('/settings', authenticate, requirePermiso(PERMISOS.CONFIG_GESTIONAR), (req, res) => {
  try {
    const { m365_webhook_url, base_url, company_name } = req.body;
    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    if (m365_webhook_url !== undefined) upsert.run('m365_webhook_url', m365_webhook_url.trim());
    if (base_url !== undefined) upsert.run('base_url', base_url.trim());
    if (company_name !== undefined) upsert.run('company_name', company_name.trim());

    recordAudit(db, {
      usuario_id: req.user?.id || null,
      usuario_nombre_snapshot: req.user?.name || 'Sistema',
      organizacion_id: req.user?.organizacion_id || 1,
      accion: 'ACTUALIZAR_CONFIGURACION',
      entidad: 'configuracion',
      entidad_id: 0,
      datos_despues: req.body,
      req
    });

    res.json({ success: true, message: 'Configuraciones guardadas' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST test M365 Power Automate Webhook
router.post('/test-webhook', authenticate, requirePermiso(PERMISOS.CONFIG_GESTIONAR), async (req, res) => {
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
      message: 'Prueba de conectividad desde Milicic Matafuegos a Power Automate / Excel 365',
      timestamp: new Date().toISOString(),
      sample_data: {
        extinguisher_code: 'MF-001',
        location: 'Edificio Central - PB',
        inspector: 'Santiago Amaya (Inspector HyS)',
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
