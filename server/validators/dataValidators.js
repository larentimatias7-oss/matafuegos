/**
 * Milicic FireControl 365 - Validadores de Datos de Negocio
 * Validación de códigos MF-XXX, fechas ISO, campos obligatorios e importación masiva
 */

const EXTINQUISHER_CODE_REGEX = /^MF-\d{3,4}$/i;
const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const VALID_TYPES = [
  'Polvo ABC',
  'CO2',
  'Acetato K',
  'Agua Bajo Presión',
  'Haloclean'
];

/**
 * Valida formato de código de extintor (MF-001 a MF-9999)
 * @param {string} code 
 * @returns {boolean}
 */
function isValidExtinguisherCode(code) {
  if (typeof code !== 'string') return false;
  return EXTINQUISHER_CODE_REGEX.test(code.trim());
}

/**
 * Valida formato y existencia en calendario de fecha YYYY-MM-DD
 * @param {string} dateStr 
 * @returns {boolean}
 */
function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) {
    return false;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y &&
         (date.getUTCMonth() + 1) === m &&
         date.getUTCDate() === d;
}

/**
 * Valida los datos requeridos para dar de alta o modificar un extintor
 * @param {Object} data 
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateExtinguisherInput(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Datos no proporcionados'] };
  }

  // Código
  if (!data.code || !isValidExtinguisherCode(data.code)) {
    errors.push("Código inválido: debe seguir el formato MF-XXX (ej. 'MF-001')");
  }

  // Tipo
  if (!data.type || typeof data.type !== 'string' || data.type.trim().length === 0) {
    errors.push('El tipo de extintor es obligatorio');
  }

  // Capacidad
  if (!data.capacity || typeof data.capacity !== 'string' || data.capacity.trim().length === 0) {
    errors.push('La capacidad es obligatoria (ej. 5 kg, 10 kg, 6 L)');
  }

  // Ubicación
  if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
    errors.push('La ubicación es obligatoria');
  }

  // Vencimiento de carga
  if (!data.expiration_charge || !isValidDateString(data.expiration_charge)) {
    errors.push('Fecha de vencimiento de carga inválida o inexistente (formato requerido: YYYY-MM-DD)');
  }

  // Vencimiento de prueba hidráulica
  if (!data.expiration_ph || !isValidDateString(data.expiration_ph)) {
    errors.push('Fecha de prueba hidráulica inválida o inexistente (formato requerido: YYYY-MM-DD)');
  }

  // Fabricación (opcional pero si viene debe ser válida)
  if (data.fab_year !== undefined && data.fab_year !== null && data.fab_year !== '') {
    const yr = Number(data.fab_year);
    if (isNaN(yr) || yr < 1970 || yr > 2050) {
      errors.push('Año de fabricación fuera de rango reglamentario (1970 - 2050)');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Normaliza y valida una lista de filas extraídas de un archivo Excel
 * Detecta duplicados internos, campos faltantes y formatos erróneos
 * 
 * @param {Array<Object>} rows Filas leídas del archivo
 * @returns {{
 *   validRows: Array<Object>,
 *   invalidRows: Array<{ rowNumber: number, code: string, errors: string[] }>,
 *   duplicateCodes: string[],
 *   totalProcessed: number
 * }}
 */
function validateExcelImportRows(rows) {
  const validRows = [];
  const invalidRows = [];
  const seenCodes = new Set();
  const duplicateCodes = new Set();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const errors = [];

    const rawCode = row.code ? String(row.code).trim().toUpperCase() : '';
    if (!rawCode) {
      errors.push('Falta el código de extintor');
    } else if (!isValidExtinguisherCode(rawCode)) {
      errors.push(`Formato de código inválido: '${rawCode}'. Debe ser MF-XXX.`);
    }

    if (rawCode) {
      if (seenCodes.has(rawCode)) {
        duplicateCodes.add(rawCode);
        errors.push(`Código duplicado en el archivo: '${rawCode}'`);
      } else {
        seenCodes.add(rawCode);
      }
    }

    const type = row.type ? String(row.type).trim() : 'Polvo ABC';
    const capacity = row.capacity ? String(row.capacity).trim() : '5 kg';
    const location = row.location ? String(row.location).trim() : '';
    if (!location) {
      errors.push('Falta la ubicación del equipo');
    }

    const expCharge = row.expiration_charge ? String(row.expiration_charge).trim() : '';
    if (!expCharge || !isValidDateString(expCharge)) {
      errors.push(`Fecha de vencimiento de carga inválida: '${expCharge}'`);
    }

    const expPh = row.expiration_ph ? String(row.expiration_ph).trim() : '';
    if (!expPh || !isValidDateString(expPh)) {
      errors.push(`Fecha de prueba hidráulica inválida: '${expPh}'`);
    }

    if (errors.length > 0) {
      invalidRows.push({
        rowNumber,
        code: rawCode || 'DESCONOCIDO',
        errors
      });
    } else {
      validRows.push({
        code: rawCode,
        type,
        capacity,
        location,
        floor: row.floor ? String(row.floor).trim() : 'Planta Baja',
        area: row.area ? String(row.area).trim() : 'General',
        expiration_charge: expCharge,
        expiration_ph: expPh,
        status: row.status ? String(row.status).trim() : 'OPERATIVO',
        notes: row.notes ? String(row.notes).trim() : ''
      });
    }
  });

  return {
    validRows,
    invalidRows,
    duplicateCodes: Array.from(duplicateCodes),
    totalProcessed: rows.length
  };
}

module.exports = {
  EXTINQUISHER_CODE_REGEX,
  DATE_REGEX,
  VALID_TYPES,
  isValidExtinguisherCode,
  isValidDateString,
  validateExtinguisherInput,
  validateExcelImportRows
};
