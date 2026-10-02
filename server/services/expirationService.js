/**
 * Milicic FireControl 365 - Servicio de Cálculo de Vencimientos y Fechas
 * Cumplimiento estricto Norma IRAM 3517-2 y zona horaria America/Argentina/Buenos_Aires (UTC-3)
 */

const TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Obtiene la fecha en formato YYYY-MM-DD en la zona horaria de Buenos Aires.
 * Garantiza que si el servidor corre en UTC (ej. Dokploy/Docker),
 * la fecha corresponda exactamente al día local de Argentina.
 * 
 * @param {Date|string|number} [dateInput=new Date()]
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function getBuenosAiresDateString(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new Error('Fecha inválida');
  }

  // Formateador con zona horaria estricta de Buenos Aires
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  // en-CA produce formato YYYY-MM-DD de forma nativa
  return formatter.format(d);
}

/**
 * Comprueba si un año es bisiesto
 * @param {number} year 
 * @returns {boolean}
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Días en un mes dado considerando años bisiestos
 * @param {number} year 
 * @param {number} month (1-12)
 * @returns {number}
 */
function getDaysInMonth(year, month) {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

/**
 * Agrega años a una fecha respetando casos de fin de mes y años bisiestos.
 * Ej: 29 de febrero de 2024 + 1 año -> 28 de febrero de 2025 (no bisiesto).
 * 
 * @param {string} dateStr YYYY-MM-DD
 * @param {number} yearsToAdd
 * @returns {string} YYYY-MM-DD
 */
function addYears(dateStr, yearsToAdd) {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const targetYear = year + yearsToAdd;
  const maxDaysInTargetMonth = getDaysInMonth(targetYear, month);
  const targetDay = Math.min(day, maxDaysInTargetMonth);

  return `${targetYear}-${String(month).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
}

/**
 * Calcula vencimiento de recarga anual (IRAM 3517-2: 1 año desde última carga)
 * @param {string} lastChargeDate YYYY-MM-DD
 * @returns {string} YYYY-MM-DD
 */
function calculateAnnualRecharge(lastChargeDate) {
  if (!lastChargeDate || !/^\d{4}-\d{2}-\d{2}$/.test(lastChargeDate)) {
    throw new Error('Fecha de última carga inválida (debe ser YYYY-MM-DD)');
  }
  return addYears(lastChargeDate, 1);
}

/**
 * Calcula vencimiento de prueba hidráulica (PH) (IRAM 3517-2: 5 años desde última PH)
 * @param {string} lastPhDate YYYY-MM-DD
 * @returns {string} YYYY-MM-DD
 */
function calculateHydraulicTest(lastPhDate) {
  if (!lastPhDate || !/^\d{4}-\d{2}-\d{2}$/.test(lastPhDate)) {
    throw new Error('Fecha de última prueba hidráulica inválida (debe ser YYYY-MM-DD)');
  }
  return addYears(lastPhDate, 5);
}

/**
 * Calcula el límite de vida útil del cilindro (IRAM 3517-2: 20 años desde fabricación para polvo/agua, 30 para CO2)
 * @param {number} fabYear Año de fabricación
 * @param {string} [type='Polvo ABC'] Tipo de extintor
 * @returns {string} YYYY-MM-DD (fin del año límite: 31 de diciembre)
 */
function calculateLifespanLimit(fabYear, type = 'Polvo ABC') {
  const year = parseInt(fabYear, 10);
  if (isNaN(year) || year < 1970 || year > 2100) {
    throw new Error('Año de fabricación inválido');
  }
  const isCo2 = (type || '').toUpperCase().includes('CO2');
  const lifespanYears = isCo2 ? 30 : 20;
  const limitYear = year + lifespanYears;
  return `${limitYear}-12-31`;
}

/**
 * Diferencia en días entre dos fechas (targetDate - referenceDate).
 * Si referenceDate es hoy y targetDate fue ayer -> -1 (vencido).
 * Si targetDate es hoy -> 0 (vence hoy).
 * Si faltan 15 días -> 15.
 * 
 * @param {string} targetDateStr YYYY-MM-DD
 * @param {string} [referenceDateStr] YYYY-MM-DD (por defecto hoy en Buenos Aires)
 * @returns {number} Días de diferencia
 */
function getDaysUntilExpiration(targetDateStr, referenceDateStr = null) {
  if (!targetDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
    throw new Error('Fecha objetivo inválida');
  }
  const refStr = referenceDateStr || getBuenosAiresDateString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(refStr)) {
    throw new Error('Fecha de referencia inválida');
  }

  const [tY, tM, tD] = targetDateStr.split('-').map(Number);
  const [rY, rM, rD] = refStr.split('-').map(Number);

  // Usamos Date.UTC para evitar discrepancias de horario de verano o zonas locales
  const targetUtc = Date.UTC(tY, tM - 1, tD);
  const refUtc = Date.UTC(rY, rM - 1, rD);

  const diffMs = targetUtc - refUtc;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Evalúa el nivel de alerta según los días restantes para el vencimiento.
 * Niveles:
 * - 'VENCIDO': <= 0 días
 * - 'URGENTE_15': > 0 y <= 15 días
 * - 'ALERTA_30': > 15 y <= 30 días
 * - 'PREVENTIVO_60': > 30 y <= 60 días
 * - 'VIGENTE': > 60 días
 * 
 * @param {string} targetDateStr 
 * @param {string} [referenceDateStr]
 * @returns {{ daysRemaining: number, alertLevel: string, isExpired: boolean, isUpcoming: boolean }}
 */
function getExpirationStatus(targetDateStr, referenceDateStr = null) {
  const days = getDaysUntilExpiration(targetDateStr, referenceDateStr);

  if (days < 0) {
    return { daysRemaining: days, alertLevel: 'VENCIDO', isExpired: true, isUpcoming: false };
  }
  if (days === 0) {
    return { daysRemaining: 0, alertLevel: 'VENCE_HOY', isExpired: true, isUpcoming: false };
  }
  if (days <= 15) {
    return { daysRemaining: days, alertLevel: 'URGENTE_15', isExpired: false, isUpcoming: true };
  }
  if (days <= 30) {
    return { daysRemaining: days, alertLevel: 'ALERTA_30', isExpired: false, isUpcoming: true };
  }
  if (days <= 60) {
    return { daysRemaining: days, alertLevel: 'PREVENTIVO_60', isExpired: false, isUpcoming: true };
  }
  return { daysRemaining: days, alertLevel: 'VIGENTE', isExpired: false, isUpcoming: false };
}

module.exports = {
  TIMEZONE,
  getBuenosAiresDateString,
  isLeapYear,
  getDaysInMonth,
  addYears,
  calculateAnnualRecharge,
  calculateHydraulicTest,
  calculateLifespanLimit,
  getDaysUntilExpiration,
  getExpirationStatus
};
