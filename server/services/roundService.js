/**
 * Milicic FireControl 365 - Servicio de Gestión de Rondas Mensuales
 * Lógica de apertura, cierre, control de inspección única/reinspección y cobertura
 */

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Genera el nombre reglamentario de la ronda para un mes y año dados
 * @param {number} year 
 * @param {number} month (1-12)
 * @returns {{ year_month: string, name: string }}
 */
function formatRoundInfo(year, month) {
  if (month < 1 || month > 12) {
    throw new Error('Mes inválido (debe ser entre 1 y 12)');
  }
  const year_month = `${year}-${String(month).padStart(2, '0')}`;
  const name = `Ronda ${MONTH_NAMES[month - 1]} ${year}`;
  return { year_month, name };
}

/**
 * Calcula métricas de cobertura de una ronda mensual (ej. 95/130 -> 73%)
 * @param {number} inspectedCount Cantidad de extintores distintos inspeccionados
 * @param {number} totalCount Total de extintores operativos en parque
 * @returns {{
 *   total: number,
 *   inspected: number,
 *   pending: number,
 *   coveragePercentage: number,
 *   ratioString: string,
 *   isComplete: boolean
 * }}
 */
function calculateCoverage(inspectedCount, totalCount) {
  const total = Math.max(0, parseInt(totalCount, 10) || 0);
  const inspected = Math.min(total, Math.max(0, parseInt(inspectedCount, 10) || 0));
  const pending = Math.max(0, total - inspected);

  const coveragePercentage = total > 0 ? Math.round((inspected / total) * 100) : 0;
  const ratioString = `${inspected}/${total}`;
  const isComplete = total > 0 && inspected >= total;

  return {
    total,
    inspected,
    pending,
    coveragePercentage,
    ratioString,
    isComplete
  };
}

/**
 * Valida si un equipo puede ser inspeccionado en una ronda.
 * Regla: solo se permite una inspección por equipo por ronda, salvo que sea una
 * reinspección formalmente justificada con motivo documentado.
 * 
 * @param {number} previousInspectionsCount Cantidad de inspecciones previas del equipo en este mes
 * @param {boolean} isReinspection Si el operador declaró explícitamente que es reinspección
 * @param {string} reinspectionReason Motivo documentado de la reinspección
 * @returns {{ allowed: boolean, error?: string }}
 */
function validateInspectionInRound(previousInspectionsCount, isReinspection, reinspectionReason) {
  if (previousInspectionsCount === 0) {
    return { allowed: true };
  }

  // Ya tiene inspección en este periodo
  if (!isReinspection) {
    return {
      allowed: false,
      error: 'El equipo ya fue inspeccionado en esta ronda mensual. Para registrar un nuevo control debe declararse como reinspección.'
    };
  }

  if (!reinspectionReason || reinspectionReason.trim().length < 5) {
    return {
      allowed: false,
      error: 'Toda reinspección en el mismo mes requiere indicar un motivo justificado (mínimo 5 caracteres).'
    };
  }

  return { allowed: true };
}

/**
 * Agrupa los equipos pendientes de inspección por piso y sector
 * @param {Array<{ id: number, code: string, floor: string, area: string, status: string }>} allExtinguishers 
 * @param {Set<number>|Array<number>} inspectedExtinguisherIds 
 * @returns {Array<{ sector: string, floor: string, total: number, inspected: number, pending: number }>}
 */
function groupPendingBySector(allExtinguishers, inspectedExtinguisherIds) {
  const inspectedSet = new Set(inspectedExtinguisherIds);
  const sectorMap = new Map();

  for (const ext of allExtinguishers) {
    if (ext.status && ext.status !== 'OPERATIVO') continue;

    const sectorKey = `${ext.floor || 'Sin Piso'} - ${ext.area || 'General'}`;
    if (!sectorMap.has(sectorKey)) {
      sectorMap.set(sectorKey, {
        sector: ext.area || 'General',
        floor: ext.floor || 'Sin Piso',
        total: 0,
        inspected: 0,
        pending: 0,
        pendingCodes: []
      });
    }

    const item = sectorMap.get(sectorKey);
    item.total++;
    if (inspectedSet.has(ext.id)) {
      item.inspected++;
    } else {
      item.pending++;
      item.pendingCodes.push(ext.code);
    }
  }

  return Array.from(sectorMap.values()).sort((a, b) => b.pending - a.pending);
}

module.exports = {
  MONTH_NAMES,
  formatRoundInfo,
  calculateCoverage,
  validateInspectionInRound,
  groupPendingBySector
};
