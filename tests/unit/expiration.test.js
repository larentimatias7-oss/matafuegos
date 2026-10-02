import { describe, it, expect } from 'vitest';
const {
  getBuenosAiresDateString,
  isLeapYear,
  getDaysInMonth,
  addYears,
  calculateAnnualRecharge,
  calculateHydraulicTest,
  calculateLifespanLimit,
  getDaysUntilExpiration,
  getExpirationStatus,
  TIMEZONE
} = require('../../server/services/expirationService');

describe('Servicio de Vencimientos y Fechas (IRAM 3517-2)', () => {

  describe('1. Zona Horaria America/Argentina/Buenos_Aires y Regla Anti-UTC', () => {
    it('debe definir la zona horaria oficial como America/Argentina/Buenos_Aires', () => {
      expect(TIMEZONE).toBe('America/Argentina/Buenos_Aires');
    });

    it('debe calcular la fecha correcta en Buenos Aires a las 22:30 (cuando en UTC ya es el día siguiente)', () => {
      // 2026-06-15T01:30:00Z corresponde a 2026-06-14 22:30:00 en Buenos Aires (UTC-3)
      const lateNightUtcTimestamp = '2026-06-15T01:30:00.000Z';
      
      const buenosAiresDate = getBuenosAiresDateString(lateNightUtcTimestamp);
      expect(buenosAiresDate).toBe('2026-06-14');
    });

    it('FALLARÍA si se usa la fecha UTC del servidor en lugar de Buenos Aires', () => {
      // En este instante UTC:
      const lateNightUtcTimestamp = '2026-10-02T01:15:00.000Z';
      const naiveServerUtcDate = new Date(lateNightUtcTimestamp).toISOString().split('T')[0];
      const correctBuenosAiresDate = getBuenosAiresDateString(lateNightUtcTimestamp);

      // Verificamos que la fecha UTC ingenua es '2026-10-02', pero en Buenos Aires aún es '2026-10-01'
      expect(naiveServerUtcDate).toBe('2026-10-02');
      expect(correctBuenosAiresDate).toBe('2026-10-01');
      expect(correctBuenosAiresDate).not.toBe(naiveServerUtcDate);
    });

    it('debe lanzar error si se pasa una fecha corrupta', () => {
      expect(() => getBuenosAiresDateString('fecha-invalida')).toThrow('Fecha inválida');
    });
  });

  describe('2. Recarga Anual (1 año) y Casos Borde de Calendario', () => {
    it('debe calcular recarga estándar a 1 año', () => {
      expect(calculateAnnualRecharge('2026-05-10')).toBe('2027-05-10');
      expect(calculateAnnualRecharge('2025-11-20')).toBe('2026-11-20');
    });

    it('debe resolver año bisiesto: 29 de febrero a año común vence el 28 de febrero', () => {
      // 2024 fue bisiesto. 1 año después (2025) no es bisiesto.
      expect(calculateAnnualRecharge('2024-02-29')).toBe('2025-02-28');
    });

    it('debe resolver fin de mes regular', () => {
      expect(calculateAnnualRecharge('2025-03-31')).toBe('2026-03-31');
      expect(calculateAnnualRecharge('2025-04-30')).toBe('2026-04-30');
    });

    it('debe rechazar formatos inválidos de fecha de carga', () => {
      expect(() => calculateAnnualRecharge('10/05/2026')).toThrow();
      expect(() => calculateAnnualRecharge('')).toThrow();
    });
  });

  describe('3. Prueba Hidráulica a 5 Años y Casos Borde', () => {
    it('debe calcular prueba hidráulica a 5 años exactos', () => {
      expect(calculateHydraulicTest('2021-08-15')).toBe('2026-08-15');
      expect(calculateHydraulicTest('2026-01-01')).toBe('2031-01-01');
    });

    it('debe resolver año bisiesto a 5 años (29 Feb 2024 -> 28 Feb 2029)', () => {
      expect(calculateHydraulicTest('2024-02-29')).toBe('2029-02-28');
    });

    it('debe rechazar fechas inválidas en prueba hidráulica', () => {
      expect(() => calculateHydraulicTest(null)).toThrow();
      expect(() => calculateHydraulicTest('2025-2-2')).toThrow();
    });
  });

  describe('4. Vida Útil del Cilindro (IRAM 3517-2: 20 años polvo/agua, 30 años CO2)', () => {
    it('debe calcular 20 años al 31 de diciembre para Polvo ABC', () => {
      expect(calculateLifespanLimit(2015, 'Polvo ABC')).toBe('2035-12-31');
      expect(calculateLifespanLimit(2020, 'Acetato K')).toBe('2040-12-31');
    });

    it('debe calcular 30 años al 31 de diciembre para extintores de CO2', () => {
      expect(calculateLifespanLimit(2010, 'CO2')).toBe('2040-12-31');
      expect(calculateLifespanLimit(2022, 'Dióxido de Carbono (CO2)')).toBe('2052-12-31');
    });

    it('debe rechazar años de fabricación fuera de rango', () => {
      expect(() => calculateLifespanLimit(1950)).toThrow('Año de fabricación inválido');
      expect(() => calculateLifespanLimit(2150)).toThrow('Año de fabricación inválido');
    });
  });

  describe('5. Diferencia de Días y Casos Borde de Alerta (Hoy, Ayer, 60/30/15 días)', () => {
    const refDate = '2026-10-15';

    it('debe retornar 0 si vence hoy', () => {
      expect(getDaysUntilExpiration('2026-10-15', refDate)).toBe(0);
      const status = getExpirationStatus('2026-10-15', refDate);
      expect(status.alertLevel).toBe('VENCE_HOY');
      expect(status.isExpired).toBe(true);
      expect(status.daysRemaining).toBe(0);
    });

    it('debe retornar -1 si venció ayer', () => {
      expect(getDaysUntilExpiration('2026-10-14', refDate)).toBe(-1);
      const status = getExpirationStatus('2026-10-14', refDate);
      expect(status.alertLevel).toBe('VENCIDO');
      expect(status.isExpired).toBe(true);
      expect(status.daysRemaining).toBe(-1);
    });

    it('debe detectar alerta urgente a 15 días exactos', () => {
      // 15 días desde 2026-10-15 es 2026-10-30
      expect(getDaysUntilExpiration('2026-10-30', refDate)).toBe(15);
      const status = getExpirationStatus('2026-10-30', refDate);
      expect(status.alertLevel).toBe('URGENTE_15');
      expect(status.isUpcoming).toBe(true);
      expect(status.isExpired).toBe(false);
    });

    it('debe detectar alerta a 30 días exactos', () => {
      // 30 días desde 2026-10-15 es 2026-11-14
      expect(getDaysUntilExpiration('2026-11-14', refDate)).toBe(30);
      const status = getExpirationStatus('2026-11-14', refDate);
      expect(status.alertLevel).toBe('ALERTA_30');
      expect(status.isUpcoming).toBe(true);
    });

    it('debe detectar alerta preventiva a 60 días exactos', () => {
      // 60 días desde 2026-10-15 es 2026-12-14
      expect(getDaysUntilExpiration('2026-12-14', refDate)).toBe(60);
      const status = getExpirationStatus('2026-12-14', refDate);
      expect(status.alertLevel).toBe('PREVENTIVO_60');
      expect(status.isUpcoming).toBe(true);
    });

    it('debe clasificar como vigente si faltan más de 60 días', () => {
      expect(getDaysUntilExpiration('2027-01-01', refDate)).toBe(78);
      const status = getExpirationStatus('2027-01-01', refDate);
      expect(status.alertLevel).toBe('VIGENTE');
      expect(status.isUpcoming).toBe(false);
      expect(status.isExpired).toBe(false);
    });
  });

  describe('6. Utilidades de Calendario y Años Bisiestos', () => {
    it('debe comprobar años bisiestos correctamente', () => {
      expect(isLeapYear(2020)).toBe(true);
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2028)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(2025)).toBe(false);
      expect(isLeapYear(2026)).toBe(false);
    });

    it('debe calcular días por mes según el año', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29);
      expect(getDaysInMonth(2025, 2)).toBe(28);
      expect(getDaysInMonth(2026, 4)).toBe(30);
      expect(getDaysInMonth(2026, 5)).toBe(31);
    });
  });
});
