/**
 * Milicic FireControl 365 - Servicio de Reglas Antifraude y Auditoría
 * Detecta inspecciones sospechosas por velocidad excesiva o inconsistencias
 */

const MIN_LEGITIMATE_DURATION_SECONDS = 5;

/**
 * Evalúa si una inspección presenta indicadores de fraude o completado ficticio
 * @param {Object} inspectionData
 * @param {number} inspectionData.durationSeconds Tiempo en segundos que tomó la inspección
 * @param {Date|string|null} [inspectionData.previousInspectionTime] Hora del control anterior del mismo inspector
 * @returns {{
 *   isSuspicious: boolean,
 *   fraudFlags: string[],
 *   reason: string | null
 * }}
 */
function evaluateInspectionFraud(inspectionData) {
  const flags = [];
  const duration = Math.max(0, parseInt(inspectionData.durationSeconds, 10) || 0);

  // Regla 1: Inspección exprés en menos de 5 segundos
  // En la práctica un operario requiere al menos 5-10 segundos para verificar manómetro, precinto y manguera
  if (duration > 0 && duration < MIN_LEGITIMATE_DURATION_SECONDS) {
    flags.push('TIEMPO_INSPECCION_MENOR_5S');
  }

  // Regla 2: Si durationSeconds fue 0 o no se computó pero se completó instantáneamente
  if (inspectionData.durationSeconds === 0) {
    flags.push('DURACION_CERO');
  }

  // Regla 3: Intervalo entre inspecciones consecutivas del mismo inspector < 10 segundos
  if (inspectionData.previousInspectionTime && inspectionData.currentInspectionTime) {
    const prevMs = new Date(inspectionData.previousInspectionTime).getTime();
    const currMs = new Date(inspectionData.currentInspectionTime).getTime();
    const diffSec = (currMs - prevMs) / 1000;
    if (diffSec >= 0 && diffSec < 8) {
      flags.push('INTERVALO_CONSECUTIVO_SOSPECHOSO');
    }
  }

  const isSuspicious = flags.length > 0;
  const reason = isSuspicious 
    ? `Inspección marcada como sospechosa por: ${flags.join(', ')}`
    : null;

  return {
    isSuspicious,
    fraudFlags: flags,
    reason
  };
}

module.exports = {
  MIN_LEGITIMATE_DURATION_SECONDS,
  evaluateInspectionFraud
};
