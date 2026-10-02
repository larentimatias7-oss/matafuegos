/**
 * Milicic FireControl 365 - Servicio de Gestión de Anomalías y Casos
 * Máquina de estados con validación estricta de transiciones de ciclo de vida
 */

const CASE_STATUSES = {
  ABIERTO: 'ABIERTO',
  EN_TALLER: 'EN_TALLER',
  TEMP_REPLACED: 'TEMP_REPLACED',
  RESUELTO: 'RESUELTO'
};

// Matriz de transiciones permitidas
const VALID_TRANSITIONS = {
  [CASE_STATUSES.ABIERTO]: [
    CASE_STATUSES.EN_TALLER,
    CASE_STATUSES.TEMP_REPLACED,
    CASE_STATUSES.RESUELTO
  ],
  [CASE_STATUSES.EN_TALLER]: [
    CASE_STATUSES.TEMP_REPLACED,
    CASE_STATUSES.RESUELTO
  ],
  [CASE_STATUSES.TEMP_REPLACED]: [
    CASE_STATUSES.EN_TALLER,
    CASE_STATUSES.RESUELTO
  ],
  [CASE_STATUSES.RESUELTO]: [] // Estado terminal: no permite transición posterior
};

/**
 * Valida si una transición de estado de caso es permitida
 * @param {string} currentStatus Estado actual
 * @param {string} targetStatus Estado destino solicitado
 * @param {Object} [details] Datos adicionales como resolution_notes o temp_replacement_code
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCaseTransition(currentStatus, targetStatus, details = {}) {
  const current = (currentStatus || '').toUpperCase();
  const target = (targetStatus || '').toUpperCase();

  if (!Object.values(CASE_STATUSES).includes(target)) {
    return {
      valid: false,
      error: `Estado destino '${targetStatus}' desconocido. Estados válidos: ${Object.values(CASE_STATUSES).join(', ')}`
    };
  }

  // Si no cambia de estado, es válido
  if (current === target) {
    return { valid: true };
  }

  const allowedNext = VALID_TRANSITIONS[current];
  if (!allowedNext || !allowedNext.includes(target)) {
    return {
      valid: false,
      error: `Transición inválida: no es posible pasar de '${current}' a '${target}'.`
    };
  }

  // Validaciones adicionales por estado destino
  if (target === CASE_STATUSES.RESUELTO) {
    if (!details.resolution_notes || details.resolution_notes.trim().length < 5) {
      return {
        valid: false,
        error: 'Para resolver un caso es obligatorio registrar notas de resolución (mínimo 5 caracteres).'
      };
    }
  }

  if (target === CASE_STATUSES.TEMP_REPLACED) {
    if (!details.temp_replacement_code || !details.temp_replacement_code.trim()) {
      return {
        valid: false,
        error: 'Para marcar como reemplazado temporalmente es obligatorio indicar el código del extintor sustituto.'
      };
    }
  }

  return { valid: true };
}

module.exports = {
  CASE_STATUSES,
  VALID_TRANSITIONS,
  validateCaseTransition
};
