/**
 * Milicic FireControl 365 - Servicio de Estados de Semáforo y Prioridad Combinada
 * Define la jerarquía y resolución de estados para extintores e inspecciones
 */

const { getDaysUntilExpiration } = require('./expirationService');

const SEMAPHORE_PRIORITIES = {
  VENCIDO: 1,   // Máxima prioridad / Crítico: incumplimiento normativo IRAM
  FALLA: 2,     // Crítico: anomalía operativa detectada en campo
  PENDIENTE: 3, // Preventivo: falta control del mes en curso
  OK: 4         // Conforme: operativo y verificado
};

/**
 * Determina el estado del semáforo para un extintor en el contexto de un mes dado.
 * Resuelve la prioridad cuando coinciden múltiples condiciones (ej: vencido + con falla).
 * 
 * @param {Object} extinguisher Objeto de extintor con expiration_charge, expiration_ph, status
 * @param {Object|null} lastInspectionThisMonth Última inspección realizada en el mes en curso (o null)
 * @param {string} [referenceDateStr] Fecha de referencia YYYY-MM-DD
 * @returns {{
 *   statusKey: 'VENCIDO' | 'FALLA' | 'PENDIENTE' | 'OK',
 *   priority: number,
 *   label: string,
 *   badgeColor: string,
 *   isOperative: boolean,
 *   reasons: string[]
 * }}
 */
function resolveSemaphoreStatus(extinguisher, lastInspectionThisMonth = null, referenceDateStr = null) {
  if (!extinguisher) {
    throw new Error('Datos del extintor requeridos');
  }

  const reasons = [];

  // 1. Verificación de Vencimientos (Carga y PH)
  const daysCharge = getDaysUntilExpiration(extinguisher.expiration_charge, referenceDateStr);
  const daysPh = getDaysUntilExpiration(extinguisher.expiration_ph, referenceDateStr);

  const isChargeExpired = daysCharge <= 0;
  const isPhExpired = daysPh <= 0;

  if (isChargeExpired) {
    reasons.push(daysCharge === 0 ? 'Carga anual vence hoy' : `Carga anual vencida hace ${Math.abs(daysCharge)} días`);
  }
  if (isPhExpired) {
    reasons.push(daysPh === 0 ? 'Prueba hidráulica vence hoy' : `Prueba hidráulica vencida hace ${Math.abs(daysPh)} días`);
  }

  // 2. Verificación de Inspección del Mes
  const hasInspection = !!lastInspectionThisMonth;
  const inspectionPassed = hasInspection ? Boolean(lastInspectionThisMonth.passed) : null;

  if (hasInspection && !inspectionPassed) {
    reasons.push(lastInspectionThisMonth.observations || 'Inspección del mes no conforme (anomalías registradas)');
  }

  // 3. Resolución por jerarquía de prioridad

  // PRIORIDAD 1: VENCIDO (Incluso si tiene falla o está pendiente, legalmente está vencido)
  if (isChargeExpired || isPhExpired) {
    return {
      statusKey: 'VENCIDO',
      priority: SEMAPHORE_PRIORITIES.VENCIDO,
      label: isChargeExpired && isPhExpired ? 'Carga y PH Vencidas' : (isChargeExpired ? 'Carga Anual Vencida' : 'Prueba Hidráulica Vencida'),
      badgeColor: 'expired',
      isOperative: false,
      reasons
    };
  }

  // PRIORIDAD 2: FALLA (Inspeccionado con anomalías no resueltas)
  if (hasInspection && !inspectionPassed) {
    return {
      statusKey: 'FALLA',
      priority: SEMAPHORE_PRIORITIES.FALLA,
      label: 'Con Anomalías',
      badgeColor: 'fault',
      isOperative: false,
      reasons
    };
  }

  // PRIORIDAD 3: PENDIENTE (Sin inspección en el mes en curso)
  if (!hasInspection) {
    return {
      statusKey: 'PENDIENTE',
      priority: SEMAPHORE_PRIORITIES.PENDIENTE,
      label: 'Pendiente Mes',
      badgeColor: 'pending',
      isOperative: true,
      reasons: ['Pendiente de inspección en la ronda mensual']
    };
  }

  // PRIORIDAD 4: OK (Inspeccionado y conforme)
  return {
    statusKey: 'OK',
    priority: SEMAPHORE_PRIORITIES.OK,
    label: 'Controlado OK',
    badgeColor: 'ok',
    isOperative: true,
    reasons: ['Control mensual reglamentario aprobado y vigente']
  };
}

module.exports = {
  SEMAPHORE_PRIORITIES,
  resolveSemaphoreStatus
};
