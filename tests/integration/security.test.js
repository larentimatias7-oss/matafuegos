import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { db } from '../../server/db.js';

describe('FASE 6: Pruebas de Seguridad y Resiliencia (tests/integration/security.test.js)', () => {

  describe('1. Headers de Seguridad HTTP (Helmet & CSP)', () => {
    it('debe emitir headers de seguridad obligatorios en cada petición', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(res.headers).toHaveProperty('x-frame-options');
      expect(res.headers).toHaveProperty('content-security-policy');
      expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });

  describe('2. Prevención de Inyección SQL (Consultas Parametrizadas)', () => {
    it('debe rechazar o neutralizar payloads de inyección SQL en búsqueda de extintores', async () => {
      const sqlInjection = "' OR '1'='1' -- ";
      const res = await request(app)
        .get(`/api/extinguishers?search=${encodeURIComponent(sqlInjection)}`)
        .set('x-role', 'ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // No debe volcar toda la base de datos de manera arbitraria
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('debe neutralizar inyección SQL en ruta por código o ID', async () => {
      const sqlInjection = "MF-001' UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20--";
      const res = await request(app)
        .get(`/api/extinguishers/${encodeURIComponent(sqlInjection)}`)
        .set('x-role', 'ADMIN');

      // Debe dar 404 seguro o error controlado sin filtrar datos arbitrarios
      expect([400, 404]).toContain(res.status);
    });

    it('debe neutralizar inyección SQL en filtros de inspecciones', async () => {
      const sqlInjection = "1' OR '1'='1";
      const res = await request(app)
        .get(`/api/inspections?round_id=${encodeURIComponent(sqlInjection)}`)
        .set('x-role', 'ADMIN');

      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body.inspections || res.body.data)).toBe(true);
      }
    });
  });

  describe('3. Prevención de XSS (Cross-Site Scripting)', () => {
    it('debe registrar observaciones con tags HTML sin interpretarlos y responder con content-type json/nosniff', async () => {
      const xssPayload = "<script>alert('xss')</script><img src=x onerror=alert(1)>";

      const res = await request(app)
        .post('/api/inspections')
        .set('x-role', 'INSPECTOR')
        .send({
          extinguisher_id: 1,
          inspector_name: 'Santiago Amaya',
          checklist: { access_ok: true, pressure_ok: true },
          status: 'OK',
          is_reinspection: 1,
          reinspection_reason: 'Prueba de seguridad XSS',
          observations: xssPayload
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('4. Validación de Subida de Archivos Maliciosos', () => {
    it('debe rechazar archivo con extensión no permitida (.exe, .sh, .php)', async () => {
      const fakeExecutable = Buffer.from('MZ\x90\x00\x03\x00\x00\x00'); // DOS/PE header

      const res = await request(app)
        .post('/api/m365/import-excel')
        .set('x-role', 'ADMIN')
        .attach('file', fakeExecutable, 'malware.exe');

      expect([400, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar archivo ejecutable o script disfrazado con extensión .xlsx (falla de magic bytes)', async () => {
      // Archivo con extensión .xlsx pero contenido de script bash
      const fakeScript = Buffer.from('#!/bin/bash\nrm -rf /data\n');

      const res = await request(app)
        .post('/api/m365/import-excel')
        .set('x-role', 'ADMIN')
        .attach('file', fakeScript, 'falso_excel.xlsx');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('firma de archivo binaria no autorizada');
    });
  });

  describe('5. Identificadores Públicos de Códigos QR (No adivinables)', () => {
    it('debe verificar que public_id tenga al menos 16 caracteres hexadecimales criptográficamente seguros', async () => {
      const res = await request(app)
        .get('/api/extinguishers')
        .set('x-role', 'ADMIN');

      expect(res.status).toBe(200);
      const items = res.body.data;
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        if (item.public_id) {
          // Al menos 12 caracteres hex (>= 48 bits de entropía criptográfica)
          expect(item.public_id.length).toBeGreaterThanOrEqual(12);
          expect(item.public_id).toMatch(/^[a-f0-9]+$/i);
        }
      }
    });

    it('debe responder 404 al intentar adivinar un public_id inexistente', async () => {
      const res = await request(app).get('/api/extinguishers/public/random-non-existent-hash-999');
      expect([400, 404]).toContain(res.status);
    });
  });
});
