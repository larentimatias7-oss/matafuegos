import { describe, it, expect } from 'vitest';
const {
  MIN_LEGITIMATE_DURATION_SECONDS,
  evaluateInspectionFraud
} = require('../../server/services/antifraudService');

describe('Servicio Antifraude y Detección de Inspecciones Sospechosas', () => {

  it('debe definir 5 segundos como el umbral mínimo reglamentario', () => {
    expect(MIN_LEGITIMATE_DURATION_SECONDS).toBe(5);
  });

  describe('Evaluación por duración de inspección', () => {
    it('debe marcar como sospechosa una inspección de 2 segundos (< 5s)', () => {
      const res = evaluateInspectionFraud({ durationSeconds: 2 });
      expect(res.isSuspicious).toBe(true);
      expect(res.fraudFlags).toContain('TIEMPO_INSPECCION_MENOR_5S');
      expect(res.reason).toContain('TIEMPO_INSPECCION_MENOR_5S');
    });

    it('debe marcar como sospechosa una inspección de 4 segundos (< 5s)', () => {
      const res = evaluateInspectionFraud({ durationSeconds: 4 });
      expect(res.isSuspicious).toBe(true);
      expect(res.fraudFlags).toContain('TIEMPO_INSPECCION_MENOR_5S');
    });

    it('debe marcar duración cero como sospechosa', () => {
      const res = evaluateInspectionFraud({ durationSeconds: 0 });
      expect(res.isSuspicious).toBe(true);
      expect(res.fraudFlags).toContain('DURACION_CERO');
    });

    it('NO debe marcar como sospechosa una inspección de 5 segundos exactos (umbral)', () => {
      const res = evaluateInspectionFraud({ durationSeconds: 5 });
      expect(res.isSuspicious).toBe(false);
      expect(res.fraudFlags.length).toBe(0);
      expect(res.reason).toBeNull();
    });

    it('NO debe marcar como sospechosa una inspección estándar de 25 segundos', () => {
      const res = evaluateInspectionFraud({ durationSeconds: 25 });
      expect(res.isSuspicious).toBe(false);
      expect(res.fraudFlags.length).toBe(0);
    });
  });

  describe('Evaluación por intervalo entre inspecciones consecutivas', () => {
    it('debe marcar como sospechosas dos inspecciones consecutivas separadas por menos de 8 segundos', () => {
      const res = evaluateInspectionFraud({
        durationSeconds: 15, // duración individual ok
        previousInspectionTime: '2026-10-15T10:00:00.000Z',
        currentInspectionTime: '2026-10-15T10:00:05.000Z' // 5 segundos después
      });

      expect(res.isSuspicious).toBe(true);
      expect(res.fraudFlags).toContain('INTERVALO_CONSECUTIVO_SOSPECHOSO');
    });

    it('debe aprobar inspecciones consecutivas con un intervalo realista (ej. 45 segundos para caminar al siguiente puesto)', () => {
      const res = evaluateInspectionFraud({
        durationSeconds: 15,
        previousInspectionTime: '2026-10-15T10:00:00.000Z',
        currentInspectionTime: '2026-10-15T10:00:45.000Z'
      });

      expect(res.isSuspicious).toBe(false);
      expect(res.fraudFlags.length).toBe(0);
    });
  });
});
