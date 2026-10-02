import { describe, it, expect } from 'vitest';
const {
  formatRoundInfo,
  calculateCoverage,
  validateInspectionInRound,
  groupPendingBySector
} = require('../../server/services/roundService');

describe('Servicio de Rondas Mensuales y Cobertura Operativa', () => {

  describe('1. Formato y Apertura de Ronda', () => {
    it('debe generar el nombre y clave year_month según mes en español', () => {
      expect(formatRoundInfo(2026, 10)).toEqual({
        year_month: '2026-10',
        name: 'Ronda Octubre 2026'
      });
      expect(formatRoundInfo(2027, 1)).toEqual({
        year_month: '2027-01',
        name: 'Ronda Enero 2027'
      });
    });

    it('debe rechazar meses fuera de rango 1-12', () => {
      expect(() => formatRoundInfo(2026, 0)).toThrow('Mes inválido');
      expect(() => formatRoundInfo(2026, 13)).toThrow('Mes inválido');
    });
  });

  describe('2. Cálculo de Cobertura y Ratios', () => {
    it('debe calcular correctamente 95/130 (73% cobertura)', () => {
      const cov = calculateCoverage(95, 130);
      expect(cov.total).toBe(130);
      expect(cov.inspected).toBe(95);
      expect(cov.pending).toBe(35);
      expect(cov.coveragePercentage).toBe(73);
      expect(cov.ratioString).toBe('95/130');
      expect(cov.isComplete).toBe(false);
    });

    it('debe detectar ronda 100% completada', () => {
      const cov = calculateCoverage(130, 130);
      expect(cov.coveragePercentage).toBe(100);
      expect(cov.pending).toBe(0);
      expect(cov.isComplete).toBe(true);
    });

    it('debe manejar caso parque vacío (0 extintores) sin división por cero', () => {
      const cov = calculateCoverage(0, 0);
      expect(cov.coveragePercentage).toBe(0);
      expect(cov.ratioString).toBe('0/0');
      expect(cov.isComplete).toBe(false);
    });

    it('debe evitar que inspeccionados supere el total', () => {
      const cov = calculateCoverage(140, 130);
      expect(cov.inspected).toBe(130);
      expect(cov.coveragePercentage).toBe(100);
      expect(cov.pending).toBe(0);
    });
  });

  describe('3. Regla de Inspección Única y Reinspección Justificada', () => {
    it('debe permitir la primera inspección del equipo en la ronda', () => {
      const result = validateInspectionInRound(0, false, null);
      expect(result.allowed).toBe(true);
    });

    it('debe rechazar una segunda inspección si no se declara como reinspección', () => {
      const result = validateInspectionInRound(1, false, '');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('ya fue inspeccionado en esta ronda');
    });

    it('debe rechazar la reinspección si no se provee un motivo válido', () => {
      const noReason = validateInspectionInRound(1, true, '');
      expect(noReason.allowed).toBe(false);
      expect(noReason.error).toContain('requiere indicar un motivo');

      const shortReason = validateInspectionInRound(1, true, 'ok');
      expect(shortReason.allowed).toBe(false);
      expect(shortReason.error).toContain('mínimo 5 caracteres');
    });

    it('debe permitir la reinspección si se proporciona un motivo adecuado', () => {
      const valid = validateInspectionInRound(1, true, 'Se reemplazó precinto roto por mantenimiento');
      expect(valid.allowed).toBe(true);
      expect(valid.error).toBeUndefined();
    });
  });

  describe('4. Pendientes por Sector y Piso', () => {
    const mockExtinguishers = [
      { id: 1, code: 'MF-001', floor: 'Planta Baja', area: 'Recepción', status: 'OPERATIVO' },
      { id: 2, code: 'MF-002', floor: 'Planta Baja', area: 'Recepción', status: 'OPERATIVO' },
      { id: 3, code: 'MF-003', floor: 'Piso 1', area: 'Oficinas', status: 'OPERATIVO' },
      { id: 4, code: 'MF-004', floor: 'Piso 1', area: 'Oficinas', status: 'OPERATIVO' },
      { id: 5, code: 'MF-005', floor: 'Piso 1', area: 'Servidores', status: 'OPERATIVO' },
      { id: 6, code: 'MF-006', floor: 'Piso 2', area: 'Operaciones', status: 'FUERA_DE_SERVICIO' } // Ignorar no operativos
    ];

    it('debe agrupar pendientes por sector correctamente', () => {
      // Supongamos que se inspeccionó solo MF-001 (id: 1)
      const inspectedIds = [1];
      const sectors = groupPendingBySector(mockExtinguishers, inspectedIds);

      expect(sectors.length).toBe(3); // Recepción, Oficinas, Servidores

      const recepcion = sectors.find(s => s.sector === 'Recepción');
      expect(recepcion.total).toBe(2);
      expect(recepcion.inspected).toBe(1);
      expect(recepcion.pending).toBe(1);
      expect(recepcion.pendingCodes).toEqual(['MF-002']);

      const oficinas = sectors.find(s => s.sector === 'Oficinas');
      expect(oficinas.total).toBe(2);
      expect(oficinas.inspected).toBe(0);
      expect(oficinas.pending).toBe(2);
      expect(oficinas.pendingCodes).toEqual(['MF-003', 'MF-004']);
    });
  });
});
