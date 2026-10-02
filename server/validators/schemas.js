const { z } = require('zod');

// Schema para Extintor (Alta y Edición)
const ExtinguisherSchema = z.object({
  code: z.string({
    required_error: 'El código identificador (ej: MF-001) es obligatorio.'
  }).regex(/^MF-\d{3,}$/, {
    message: 'El código debe tener el formato MF-XXX (ejemplo: MF-001).'
  }),
  type: z.enum(['Polvo ABC', 'CO2', 'Acetato K', 'Agua', 'Haloclean']),
  capacity: z.string({
    required_error: 'La capacidad es obligatoria (ej: 5 kg, 10 L).'
  }).min(1, 'La capacidad no puede estar vacía.'),
  location: z.string({
    required_error: 'La ubicación física es obligatoria.'
  }).min(2, 'La ubicación debe tener al menos 2 caracteres.'),
  floor: z.string({
    required_error: 'El piso o nivel es obligatorio.'
  }).min(1, 'El piso no puede estar vacío.'),
  area: z.string().optional().default('General'),
  building: z.string().optional().default('Edificio Central'),
  expiration_charge: z.string({
    required_error: 'La fecha de vencimiento de carga es obligatoria.'
  }).regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de carga debe tener formato YYYY-MM-DD.'
  }),
  expiration_ph: z.string({
    required_error: 'La fecha de prueba hidráulica (PH) es obligatoria.'
  }).regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de PH debe tener formato YYYY-MM-DD.'
  }),
  manufacturing_year: z.number().int().min(1980).max(2100).optional().nullable(),
  status: z.enum(['OPERATIVO', 'FUERA_DE_SERVICIO', 'EN_TALLER', 'DE_BAJA']).optional().default('OPERATIVO'),
  observations: z.string().optional().nullable()
});

// Schema para Registro de Inspección Mensual
const InspectionSchema = z.object({
  extinguisher_id: z.number({
    required_error: 'El ID del extintor es obligatorio.'
  }).int().positive('ID de extintor inválido.'),
  inspector_name: z.string({
    required_error: 'El nombre del inspector es obligatorio.'
  }).min(2, 'El nombre del inspector debe tener al menos 2 caracteres.'),
  checklist: z.record(z.any(), {
    required_error: 'El checklist técnico de verificación es obligatorio.'
  }),
  status: z.enum(['OK', 'FAULT', 'PENDING']),
  observations: z.string().optional().nullable(),
  reinspection_reason: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable()
});

// Schema para Actualización de Casos / Anomalías
const CaseUpdateSchema = z.object({
  status: z.enum(['ABIERTO', 'EN_TALLER', 'REEMPLAZADO', 'RESUELTO']),
  notes: z.string().optional().nullable(),
  resolved_at: z.string().optional().nullable()
});

/**
 * Middleware factory para validar req.body contra un schema de Zod
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = (result.error.issues || []).map(err => ({
        campo: err.path.join('.'),
        mensaje: err.message
      }));
      return res.status(400).json({
        success: false,
        error: errors[0]?.mensaje || 'Datos de solicitud inválidos',
        detalles: errors
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

module.exports = {
  ExtinguisherSchema,
  InspectionSchema,
  CaseUpdateSchema,
  validateBody
};
