import { describe, it, expect } from 'vitest';
import {
  ExtinguisherSchema,
  InspectionSchema,
  CaseUpdateSchema,
  validateBody
} from '../../server/validators/schemas.js';

describe('Unit: Zod Validation Schemas (server/validators/schemas.js)', () => {
  describe('ExtinguisherSchema', () => {
    it('debe validar un extintor con todos sus campos obligatorios correctos', () => {
      const valid = {
        code: 'MF-001',
        type: 'Polvo ABC',
        capacity: '5 kg',
        location: 'Pasillo Central',
        floor: 'Piso 1',
        expiration_charge: '2027-10-01',
        expiration_ph: '2030-10-01'
      };

      const result = ExtinguisherSchema.safeParse(valid);
      expect(result.success).toBe(true);
      expect(result.data.code).toBe('MF-001');
      expect(result.data.status).toBe('OPERATIVO'); // default
    });

    it('debe rechazar extintor con código inválido', () => {
      const invalid = {
        code: 'EXT-123', // debe ser MF-XXX
        type: 'Polvo ABC',
        capacity: '5 kg',
        location: 'Pasillo Central',
        floor: 'Piso 1',
        expiration_charge: '2027-10-01',
        expiration_ph: '2030-10-01'
      };

      const result = ExtinguisherSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('MF-XXX');
    });

    it('debe rechazar extintor con tipo de agente no reconocido', () => {
      const invalid = {
        code: 'MF-002',
        type: 'Gas Desconocido',
        capacity: '5 kg',
        location: 'Pasillo',
        floor: 'Piso 1',
        expiration_charge: '2027-10-01',
        expiration_ph: '2030-10-01'
      };

      const result = ExtinguisherSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('Polvo ABC');
    });

    it('debe rechazar extintor con fecha sin formato ISO YYYY-MM-DD', () => {
      const invalid = {
        code: 'MF-003',
        type: 'CO2',
        capacity: '5 kg',
        location: 'Pasillo',
        floor: 'Piso 1',
        expiration_charge: '01/10/2027',
        expiration_ph: '2030-10-01'
      };

      const result = ExtinguisherSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('YYYY-MM-DD');
    });
  });

  describe('InspectionSchema', () => {
    it('debe validar una inspección mensual completa', () => {
      const valid = {
        extinguisher_id: 1,
        inspector_name: 'Santiago Amaya',
        checklist: { pressure_ok: true, access_ok: true },
        status: 'OK'
      };

      const result = InspectionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('OK');
    });

    it('debe rechazar una inspección con status no permitido', () => {
      const invalid = {
        extinguisher_id: 1,
        inspector_name: 'Santiago Amaya',
        checklist: {},
        status: 'DESCONOCIDO'
      };

      const result = InspectionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('OK');
    });

    it('debe rechazar inspección sin nombre de inspector', () => {
      const invalid = {
        extinguisher_id: 1,
        inspector_name: '',
        checklist: {},
        status: 'OK'
      };

      const result = InspectionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('al menos 2 caracteres');
    });
  });

  describe('CaseUpdateSchema', () => {
    it('debe validar actualización de caso con estado válido', () => {
      const result = CaseUpdateSchema.safeParse({
        status: 'EN_TALLER',
        notes: 'Enviado a retimbrado de cilindro'
      });
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('EN_TALLER');
    });

    it('debe rechazar actualización con estado inválido', () => {
      const result = CaseUpdateSchema.safeParse({
        status: 'CANCELADO_ERRONEO'
      });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('ABIERTO');
    });
  });

  describe('validateBody middleware', () => {
    it('debe llamar a next() y adjuntar validatedBody si el payload es válido', () => {
      const middleware = validateBody(CaseUpdateSchema);
      const req = { body: { status: 'RESUELTO', notes: 'Listo' } };
      let statusCode = null;
      let jsonPayload = null;
      let nextCalled = false;

      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => {
              jsonPayload = data;
            }
          };
        }
      };

      middleware(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      expect(req.validatedBody.status).toBe('RESUELTO');
      expect(statusCode).toBeNull();
    });

    it('debe responder 400 con mensaje en español si la validación falla', () => {
      const middleware = validateBody(CaseUpdateSchema);
      const req = { body: { status: 'INVALIDO' } };
      let statusCode = null;
      let jsonPayload = null;
      let nextCalled = false;

      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => {
              jsonPayload = data;
            }
          };
        }
      };

      middleware(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(false);
      expect(statusCode).toBe(400);
      expect(jsonPayload.success).toBe(false);
      expect(jsonPayload.error).toContain('ABIERTO');
      expect(jsonPayload.detalles.length).toBeGreaterThan(0);
    });

    it('debe rechazar InspectionSchema cuando status es inválido', () => {
      const invalid = {
        extinguisher_id: 1,
        inspector_name: 'Santiago Amaya',
        checklist: { pressure: true },
        status: 'STATUS_INVALIDO'
      };
      const result = InspectionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toMatch(/Invalid option|expected one of/i);
    });

    it('debe rechazar CaseUpdateSchema cuando status es inválido', () => {
      const invalid = {
        status: 'ESTADO_INVENTADO'
      };
      const result = CaseUpdateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toMatch(/Invalid option|expected one of/i);
    });
  });
});
