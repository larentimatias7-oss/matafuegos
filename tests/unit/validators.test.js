import { describe, it, expect } from 'vitest';
const {
  isValidExtinguisherCode,
  isValidDateString,
  validateExtinguisherInput,
  validateExcelImportRows
} = require('../../server/validators/dataValidators');

describe('Validadores de Datos de Negocio e Importación', () => {

  describe('1. Validación de Códigos de Extintor (MF-XXX)', () => {
    it('debe aceptar códigos reglamentarios válidos', () => {
      expect(isValidExtinguisherCode('MF-001')).toBe(true);
      expect(isValidExtinguisherCode('MF-130')).toBe(true);
      expect(isValidExtinguisherCode('mf-042')).toBe(true);
      expect(isValidExtinguisherCode('MF-1050')).toBe(true);
      expect(isValidExtinguisherCode('  MF-005  ')).toBe(true);
    });

    it('debe rechazar códigos con formato erróneo o nulos', () => {
      expect(isValidExtinguisherCode('MF-1')).toBe(false);      // Menos de 3 dígitos
      expect(isValidExtinguisherCode('MF-ABC')).toBe(false);    // Letras en lugar de números
      expect(isValidExtinguisherCode('EXT-001')).toBe(false);   // Prefijo incorrecto
      expect(isValidExtinguisherCode('001')).toBe(false);       // Sin prefijo
      expect(isValidExtinguisherCode('')).toBe(false);
      expect(isValidExtinguisherCode(null)).toBe(false);
      expect(isValidExtinguisherCode(undefined)).toBe(false);
    });
  });

  describe('2. Validación de Fechas ISO (YYYY-MM-DD)', () => {
    it('debe aceptar fechas calendario reales', () => {
      expect(isValidDateString('2026-10-15')).toBe(true);
      expect(isValidDateString('2026-12-31')).toBe(true);
      expect(isValidDateString('2024-02-29')).toBe(true); // 2024 bisiesto
    });

    it('debe rechazar fechas calendario imposibles', () => {
      expect(isValidDateString('2025-02-29')).toBe(false); // 2025 NO bisiesto
      expect(isValidDateString('2026-04-31')).toBe(false); // Abril tiene 30 días
      expect(isValidDateString('2026-02-30')).toBe(false);
      expect(isValidDateString('2026-13-01')).toBe(false); // Mes 13
      expect(isValidDateString('15/10/2026')).toBe(false); // Formato no ISO
      expect(isValidDateString('')).toBe(false);
      expect(isValidDateString('texto')).toBe(false);
    });
  });

  describe('3. Validación de Payload de Alta / Modificación de Extintor', () => {
    const validExt = {
      code: 'MF-001',
      type: 'Polvo ABC',
      capacity: '5 kg',
      location: 'Edificio Central - Hall Principal',
      expiration_charge: '2027-04-10',
      expiration_ph: '2030-08-15',
      fab_year: 2020
    };

    it('debe validar exitosamente un extintor con todos sus campos conformes', () => {
      const res = validateExtinguisherInput(validExt);
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
    });

    it('debe recopilar todos los errores cuando faltan campos obligatorios', () => {
      const incomplete = {
        code: 'INVALIDO',
        type: '',
        capacity: '',
        location: '',
        expiration_charge: 'fecha-mala',
        expiration_ph: '',
        fab_year: 1950 // Fuera de rango
      };

      const res = validateExtinguisherInput(incomplete);
      expect(res.valid).toBe(false);
      expect(res.errors.length).toBeGreaterThanOrEqual(6);
      expect(res.errors.some(e => e.includes('Código inválido'))).toBe(true);
      expect(res.errors.some(e => e.includes('tipo'))).toBe(true);
      expect(res.errors.some(e => e.includes('capacidad'))).toBe(true);
      expect(res.errors.some(e => e.includes('ubicación'))).toBe(true);
      expect(res.errors.some(e => e.includes('carga'))).toBe(true);
      expect(res.errors.some(e => e.includes('Año de fabricación'))).toBe(true);
    });

    it('debe rechazar payloads nulos o vacíos', () => {
      const res = validateExtinguisherInput(null);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('Datos no proporcionados');
    });
  });

  describe('4. Validación de Importación Masiva desde Excel', () => {
    it('debe separar filas válidas, inválidas y detectar códigos duplicados', () => {
      const rawRows = [
        {
          code: 'MF-001',
          type: 'Polvo ABC',
          capacity: '5 kg',
          location: 'Puesto 1',
          expiration_charge: '2027-01-10',
          expiration_ph: '2030-01-10'
        },
        {
          // Duplicado de MF-001 en el mismo archivo
          code: 'MF-001',
          type: 'Polvo ABC',
          capacity: '5 kg',
          location: 'Puesto 1 Repetido',
          expiration_charge: '2027-01-10',
          expiration_ph: '2030-01-10'
        },
        {
          // Fila inválida: código corrupto y fecha mala
          code: 'ERROR-CODE',
          type: 'CO2',
          capacity: '5 kg',
          location: 'Puesto 2',
          expiration_charge: 'fecha-invalida',
          expiration_ph: '2030-01-10'
        },
        {
          // Fila válida
          code: 'MF-002',
          type: 'Acetato K',
          capacity: '6 L',
          location: 'Cocina PB',
          expiration_charge: '2026-11-20',
          expiration_ph: '2029-11-20'
        }
      ];

      const res = validateExcelImportRows(rawRows);

      expect(res.totalProcessed).toBe(4);
      expect(res.validRows.length).toBe(2); // MF-001 (primera vez) y MF-002
      expect(res.invalidRows.length).toBe(2); // MF-001 duplicado y ERROR-CODE
      expect(res.duplicateCodes).toContain('MF-001');

      const dupRow = res.invalidRows.find(r => r.code === 'MF-001');
      expect(dupRow.errors.some(e => e.includes('duplicado'))).toBe(true);

      const errRow = res.invalidRows.find(r => r.code === 'ERROR-CODE');
      expect(errRow.errors.some(e => e.includes('Formato de código inválido'))).toBe(true);
      expect(errRow.errors.some(e => e.includes('Fecha de vencimiento de carga inválida'))).toBe(true);
    });
  });
});
