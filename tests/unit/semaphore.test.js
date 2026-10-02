import { describe, it, expect } from 'vitest';
const {
  SEMAPHORE_PRIORITIES,
  resolveSemaphoreStatus
} = require('../../server/services/semaphoreService');

describe('Servicio de Estados de Semáforo y Prioridad Combinada', () => {
  const refDate = '2026-10-15';

  const baseExtinguisher = {
    id: 1,
    code: 'MF-001',
    expiration_charge: '2027-04-10', // Vigente
    expiration_ph: '2029-08-15',     // Vigente
    status: 'OPERATIVO'
  };

  it('debe definir la jerarquía correcta de prioridades numéricas', () => {
    // 1 es la prioridad más crítica/urgente
    expect(SEMAPHORE_PRIORITIES.VENCIDO).toBeLessThan(SEMAPHORE_PRIORITIES.FALLA);
    expect(SEMAPHORE_PRIORITIES.FALLA).toBeLessThan(SEMAPHORE_PRIORITIES.PENDIENTE);
    expect(SEMAPHORE_PRIORITIES.PENDIENTE).toBeLessThan(SEMAPHORE_PRIORITIES.OK);
  });

  describe('Casos individuales puros', () => {
    it('debe retornar OK si está vigente y la inspección del mes fue aprobada', () => {
      const inspection = { passed: 1, inspection_date: '2026-10-05', observations: '' };
      const res = resolveSemaphoreStatus(baseExtinguisher, inspection, refDate);

      expect(res.statusKey).toBe('OK');
      expect(res.badgeColor).toBe('ok');
      expect(res.isOperative).toBe(true);
      expect(res.priority).toBe(SEMAPHORE_PRIORITIES.OK);
    });

    it('debe retornar PENDIENTE si está vigente pero aún no tiene inspección este mes', () => {
      const res = resolveSemaphoreStatus(baseExtinguisher, null, refDate);

      expect(res.statusKey).toBe('PENDIENTE');
      expect(res.badgeColor).toBe('pending');
      expect(res.isOperative).toBe(true);
      expect(res.priority).toBe(SEMAPHORE_PRIORITIES.PENDIENTE);
    });

    it('debe retornar FALLA si la inspección del mes no pasó', () => {
      const inspection = { passed: 0, inspection_date: '2026-10-05', observations: 'Sin precinto' };
      const res = resolveSemaphoreStatus(baseExtinguisher, inspection, refDate);

      expect(res.statusKey).toBe('FALLA');
      expect(res.badgeColor).toBe('fault');
      expect(res.isOperative).toBe(false);
      expect(res.priority).toBe(SEMAPHORE_PRIORITIES.FALLA);
      expect(res.reasons).toContain('Sin precinto');
    });

    it('debe retornar VENCIDO si la carga anual caducó', () => {
      const expiredExt = {
        ...baseExtinguisher,
        expiration_charge: '2026-09-01' // Vencido respecto a 2026-10-15
      };
      const res = resolveSemaphoreStatus(expiredExt, null, refDate);

      expect(res.statusKey).toBe('VENCIDO');
      expect(res.badgeColor).toBe('expired');
      expect(res.isOperative).toBe(false);
      expect(res.priority).toBe(SEMAPHORE_PRIORITIES.VENCIDO);
    });

    it('debe retornar VENCIDO si la prueba hidráulica caducó', () => {
      const expiredPhExt = {
        ...baseExtinguisher,
        expiration_ph: '2026-10-01' // Vencida
      };
      const res = resolveSemaphoreStatus(expiredPhExt, null, refDate);

      expect(res.statusKey).toBe('VENCIDO');
      expect(res.label).toBe('Prueba Hidráulica Vencida');
    });
  });

  describe('Casos combinados y resolución de conflictos de prioridad', () => {
    it('PRIORIDAD VENCIDO sobre FALLA: si está vencido y además falló la inspección, predomina VENCIDO', () => {
      const expiredAndFaulty = {
        ...baseExtinguisher,
        expiration_charge: '2026-08-01' // Vencido
      };
      const inspection = { passed: 0, observations: 'Manómetro en rojo' };

      const res = resolveSemaphoreStatus(expiredAndFaulty, inspection, refDate);

      expect(res.statusKey).toBe('VENCIDO');
      expect(res.priority).toBe(SEMAPHORE_PRIORITIES.VENCIDO);
      // Sin embargo, debe recopilar todas las razones
      expect(res.reasons.some(r => r.includes('Carga anual vencida'))).toBe(true);
      expect(res.reasons).toContain('Manómetro en rojo');
    });

    it('PRIORIDAD VENCIDO sobre PENDIENTE: no inspeccionado pero con carga vencida -> VENCIDO', () => {
      const expiredPending = {
        ...baseExtinguisher,
        expiration_charge: '2026-10-01'
      };

      const res = resolveSemaphoreStatus(expiredPending, null, refDate);
      expect(res.statusKey).toBe('VENCIDO');
      expect(res.priority).toBe(1);
    });

    it('PRIORIDAD VENCIDO sobre OK: si el inspector marcó OK pero la carga expiró hoy, es VENCIDO', () => {
      const expiredToday = {
        ...baseExtinguisher,
        expiration_charge: '2026-10-15' // Vence hoy
      };
      const inspection = { passed: 1, observations: 'Todo ok en campo' };

      const res = resolveSemaphoreStatus(expiredToday, inspection, refDate);
      expect(res.statusKey).toBe('VENCIDO');
      expect(res.isOperative).toBe(false);
    });

    it('debe manejar extintor con Carga Y Prueba Hidráulica vencidas simultáneamente', () => {
      const doubleExpired = {
        ...baseExtinguisher,
        expiration_charge: '2026-05-01',
        expiration_ph: '2026-05-01'
      };

      const res = resolveSemaphoreStatus(doubleExpired, null, refDate);
      expect(res.statusKey).toBe('VENCIDO');
      expect(res.label).toBe('Carga y PH Vencidas');
      expect(res.reasons.length).toBe(2);
    });

    it('debe lanzar error si no se pasa extintor', () => {
      expect(() => resolveSemaphoreStatus(null)).toThrow('Datos del extintor requeridos');
    });
  });
});
