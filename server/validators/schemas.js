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

// Schema para Creación de Usuario
const UserCreateSchema = z.object({
  nombre: z.string({ required_error: 'El nombre es obligatorio' }).min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string({ required_error: 'El apellido es obligatorio' }).min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string({ required_error: 'El email es obligatorio' }).email('Formato de correo electrónico inválido'),
  rol: z.enum(['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'INSPECTOR', 'AUDITOR'], {
    required_error: 'El rol es obligatorio'
  }),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
  pin: z.string().regex(/^\d{4,6}$/, 'El PIN debe ser numérico de 4 a 6 dígitos').optional().nullable(),
  sectores: z.array(z.union([z.string(), z.record(z.any())])).optional()
});

// Schema para Actualización de Usuario
const UserUpdateSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
  rol: z.enum(['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'INSPECTOR', 'AUDITOR']).optional(),
  activo: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(),
  sectores: z.array(z.union([z.string(), z.record(z.any())])).optional()
});

// Schema para Login Local
const LoginSchema = z.object({
  email: z.string({ required_error: 'Email requerido' }).email('Formato de correo electrónico inválido'),
  password: z.string({ required_error: 'Contraseña requerida' }).min(1, 'Contraseña requerida')
});

// Schema para Cambio Rápido por PIN
const PinSwitchSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido').optional(),
  usuario_id: z.string().optional(),
  pin: z.string({ required_error: 'PIN requerido' }).regex(/^\d{4,6}$/, 'El PIN debe contener de 4 a 6 dígitos')
}).refine(data => data.email || data.usuario_id, {
  message: 'Debe especificar el email o el identificador de usuario',
  path: ['email']
});

// Schema para Configuración de PIN
const SetPinSchema = z.object({
  pin: z.string({ required_error: 'PIN requerido' }).regex(/^\d{4,6}$/, 'El PIN debe contener de 4 a 6 dígitos')
});

// Schema para Cambio de Contraseña
const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, 'Contraseña actual requerida'),
  new_password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
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
  UserCreateSchema,
  UserUpdateSchema,
  LoginSchema,
  PinSwitchSchema,
  SetPinSchema,
  ChangePasswordSchema,
  validateBody
};
