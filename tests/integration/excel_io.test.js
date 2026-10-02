import { describe, it, expect } from 'vitest';
const request = require('supertest');
const ExcelJS = require('exceljs');
const { app } = require('../../server/index');
const { db } = require('../../server/db');

describe('API Integration: Importación y Exportación Excel (Microsoft 365)', () => {

  it('debe exportar un libro Excel válido que se abre y contiene todas las hojas y columnas esperadas', async () => {
    const res = await request(app)
      .get('/api/m365/export-excel')
      .buffer(true)
      .parse((res, callback) => {
        const data = [];
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(data)));
      })
      .expect(200)
      .expect('Content-Type', /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);

    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(1000);

    // Abrir el archivo con ExcelJS y validar estructura interna
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body);

    const sheetNames = workbook.worksheets.map(w => w.name);
    expect(sheetNames).toContain('Resumen Ejecutivo');
    expect(sheetNames).toContain('Inventario Matafuegos');
    expect(sheetNames).toContain('Inspecciones Mensuales');
    expect(sheetNames).toContain('Casos de Anomalías');

    // Validar columnas de "Inventario Matafuegos"
    const invSheet = workbook.getWorksheet('Inventario Matafuegos');
    expect(invSheet).toBeDefined();

    // La fila de encabezados en el exportador es la fila 2
    const headers = [];
    invSheet.getRow(2).eachCell(cell => headers.push(cell.text));

    expect(headers).toContain('Código');
    expect(headers).toContain('Tipo Extintor');
    expect(headers).toContain('Capacidad');
    expect(headers).toContain('Ubicación Detallada');
    expect(headers).toContain('Estado Físico');
  });

  it('debe importar extintores desde un archivo Excel válido vía multipart/form-data', async () => {
    const importCode = 'MF-950';
    db.prepare('DELETE FROM extinguishers WHERE code = ?').run(importCode);

    // Crear un archivo Excel en memoria para simular subida
    const testWorkbook = new ExcelJS.Workbook();
    const sheet = testWorkbook.addWorksheet('Extintores');

    // Encabezados en fila 1-3
    sheet.addRow(['MILICIC S.A.']);
    sheet.addRow(['REPORTE']);
    sheet.addRow(['Código', 'Tipo', 'Capacidad', 'Ubicación', 'Piso', 'Área', 'Vencimiento Carga', 'Vencimiento PH', 'Estado']);

    // Fila 4 con datos válidos
    sheet.addRow([
      importCode,
      'Polvo ABC',
      '5 kg',
      'Laboratorio Químico Central',
      'Piso 2',
      'Control de Calidad',
      '2027-06-30',
      '2031-06-30',
      'OPERATIVO'
    ]);

    const buffer = await testWorkbook.xlsx.writeBuffer();

    const res = await request(app)
      .post('/api/m365/import-excel')
      .set('x-user-role', 'ADMIN')
      .attach('file', Buffer.from(buffer), 'import_test.xlsx')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('completado');

    // Verificar que el equipo quedó registrado en la base de datos
    const imported = db.prepare('SELECT * FROM extinguishers WHERE code = ?').get(importCode);
    expect(imported).toBeDefined();
    expect(imported.location).toBe('Laboratorio Químico Central');
  });

  it('debe responder 400 si se intenta importar sin adjuntar archivo', async () => {
    const res = await request(app)
      .post('/api/m365/import-excel')
      .set('x-user-role', 'ADMIN')
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('No se envió');
  });
});
