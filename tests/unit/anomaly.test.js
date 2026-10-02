import { describe, it, expect } from 'vitest';
const {
  CASE_STATUSES,
  VALID_TRANSITIONS,
  validateCaseTransition
} = require('../../server/services/anomalyService');

describe('Servicio de Anomalías y Máquina de Estados de Casos', () => {

  describe('1. Transiciones Válidas', () => {
    it('debe permitir ABIERTO -> EN_TALLER', () => {
      const res = validateCaseTransition(CASE_STATUSES.ABIERTO, CASE_STATUSES.EN_TALLER);
      expect(res.valid).toBe(true);
    });

    it('debe permitir ABIERTO -> TEMP_REPLACED con código sustituto', () => {
      const res = validateCaseTransition(CASE_STATUSES.ABIERTO, CASE_STATUSES.TEMP_REPLACED, {
        temp_replacement_code: 'MF-099'
      });
      expect(res.valid).toBe(true);
    });

    it('debe permitir ABIERTO -> RESUELTO con notas de resolución', () => {
      const res = validateCaseTransition(CASE_STATUSES.ABIERTO, CASE_STATUSES.RESUELTO, {
        resolution_notes: 'Se repuso precinto plástico reglamentario en sitio'
      });
      expect(res.valid).toBe(true);
    });

    it('debe permitir EN_TALLER -> TEMP_REPLACED con código sustituto', () => {
      const res = validateCaseTransition(CASE_STATUSES.EN_TALLER, CASE_STATUSES.TEMP_REPLACED, {
        temp_replacement_code: 'MF-045'
      });
      expect(res.valid).toBe(true);
    });

    it('debe permitir EN_TALLER -> RESUELTO con notas', () => {
      const res = validateCaseTransition(CASE_STATUSES.EN_TALLER, CASE_STATUSES.RESUELTO, {
        resolution_notes: 'Equipo retornado de taller certificado con prueba hidráulica aprobada'
      });
      expect(res.valid).toBe(true);
    });

    it('debe permitir TEMP_REPLACED -> RESUELTO con notas', () => {
      const res = validateCaseTransition(CASE_STATUSES.TEMP_REPLACED, CASE_STATUSES.RESUELTO, {
        resolution_notes: 'Equipo original reinstalado tras mantenimiento'
      });
      expect(res.valid).toBe(true);
    });

    it('debe permitir mantener el mismo estado (no-op)', () => {
      const res = validateCaseTransition(CASE_STATUSES.ABIERTO, CASE_STATUSES.ABIERTO);
      expect(res.valid).toBe(true);
    });
  });

  describe('2. Transiciones Inválidas Prohibidas', () => {
    it('debe RECHAZAR RESUELTO -> ABIERTO (un caso cerrado no puede reabrirse directamente)', () => {
      const res = validateCaseTransition(CASE_STATUSES.RESUELTO, CASE_STATUSES.ABIERTO);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Transición inválida');
    });

    it('debe RECHAZAR RESUELTO -> EN_TALLER', () => {
      const res = validateCaseTransition(CASE_STATUSES.RESUELTO, CASE_STATUSES.EN_TALLER);
      expect(res.valid).toBe(false);
    });

    it('debe RECHAZAR RESUELTO -> TEMP_REPLACED', () => {
      const res = validateCaseTransition(CASE_STATUSES.RESUELTO, CASE_STATUSES.TEMP_REPLACED);
      expect(res.valid).toBe(false);
    });

    it('debe RECHAZAR EN_TALLER -> ABIERTO', () => {
      const res = validateCaseTransition(CASE_STATUSES.EN_TALLER, CASE_STATUSES.ABIERTO);
      expect(res.valid).toBe(false);
    });

    it('debe RECHAZAR TEMP_REPLACED -> ABIERTO', () => {
      const res = validateCaseTransition(CASE_STATUSES.TEMP_REPLACED, CASE_STATUSES.ABIERTO);
      expect(res.valid).toBe(false);
    });

    it('debe rechazar estados destino inexistentes', () => {
      const res = validateCaseTransition(CASE_STATUSES.ABIERTO, 'ESTADO_INVENTADO');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('desconocido');
    });
  });

  describe('3. Validaciones Requeridas por Estado', () => {
    it('debe rechazar transición a RESUELTO sin notas de resolución suficientes', () => {
      const noNotes = validateCaseTransition(CASE_STATUSES.ABIERTO, CASE_STATUSES.RESUELTO, {});
      expect(noNotes.valid).toBe(false);
      expect(noNotes.error).toContain('obligatorio registrar notas de resolución');

      const shortNotes = validateCaseTransition(CASE_STATUSES.ABIERTO, CASE_STATUSES.RESUELTO, {
        resolution_notes: 'list'
      });
      expect(shortNotes.valid).toBe(false);
      expect(shortNotes.error).toContain('mínimo 5 caracteres');
    });

    it('debe rechazar transición a TEMP_REPLACED sin código de reemplazo', () => {
      const noCode = validateCaseTransition(CASE_STATUSES.ABIERTO, CASE_STATUSES.TEMP_REPLACED, {});
      expect(noCode.valid).toBe(false);
      expect(noCode.error).toContain('obligatorio indicar el código del extintor sustituto');
    });
  });
});
