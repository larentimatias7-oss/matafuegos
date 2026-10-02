import React, { useMemo } from 'react';
import { 
  CheckCircle, 
  WarningCircle, 
  Clock, 
  FireExtinguisher, 
  CalendarCheck, 
  ArrowRight, 
  QrCode, 
  Printer, 
  FileXls, 
  ShieldWarning, 
  NavigationArrow, 
  Wrench, 
  Buildings, 
  Info,
  CaretRight,
  GridFour
} from '@phosphor-icons/react';

export default function Dashboard({ 
  stats, 
  extinguishers = [], 
  onNavigate, 
  onExportExcel, 
  onResetSeed, 
  onInspectExtinguisher, 
  loading 
}) {
  const metrics = stats?.metrics || {
    allTotal: 130,
    totalOperative: 128,
    inspectedThisMonth: 45,
    pendingThisMonth: 83,
    failedThisMonth: 1,
    openCasesCount: 1,
    coveragePercentage: 35,
    expiredCharges: 4,
    expiringCharge15: 2,
    expiringCharge30: 5,
    expiringCharge60: 9,
    expiringPhSoon: 6
  };

  const activeRound = stats?.activeRound;
  const recent = stats?.recentActivity || [];

  // Group extinguishers by floor / sector for the Heatmap Grid
  const sectorGroups = useMemo(() => {
    if (!extinguishers || extinguishers.length === 0) return [];
    
    const groups = {};
    extinguishers.forEach(ext => {
      const sectorName = ext.floor || 'Sector General';
      if (!groups[sectorName]) {
        groups[sectorName] = [];
      }
      groups[sectorName].push(ext);
    });

    // Sort sector keys logically (PB first, then numerical, then other areas)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a.toLowerCase().includes('pb') || a.toLowerCase().includes('baja')) return -1;
      if (b.toLowerCase().includes('pb') || b.toLowerCase().includes('baja')) return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    });

    return sortedKeys.map(key => ({
      name: key,
      extinguishers: groups[key].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    }));
  }, [extinguishers]);

  const getHeatmapStatusClass = (ext) => {
    if (ext.is_expired) return 'status-expired';
    if (ext.has_active_case || ext.status === 'FAULT' || ext.status === 'FAILED') return 'status-fault';
    if (ext.status === 'OK' || ext.last_inspected_date) return 'status-ok';
    return 'status-pending';
  };

  const getHeatmapTooltip = (ext) => {
    let statusText = 'Pendiente de inspección';
    if (ext.is_expired) statusText = 'Carga Vencida IRAM';
    else if (ext.has_active_case || ext.status === 'FAULT') statusText = 'Caso abierto / Falla';
    else if (ext.status === 'OK' || ext.last_inspected_date) statusText = 'Inspeccionado OK';

    return `${ext.code} (${ext.type} ${ext.capacity || ''})\nUbicación: ${ext.location || 'N/D'}\nEstado: ${statusText}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Banner with Milicic Branding & Quick Navigation */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--milicic-slate-dark) 0%, var(--milicic-slate-lead) 100%)',
        color: '#ffffff',
        borderLeft: '4px solid var(--milicic-orange)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem',
        padding: '0.9rem 1rem'
      }}>
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--milicic-orange)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Milicic S.A. • Seguridad e Higiene
            </span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.25 }}>
            Panel Ejecutivo • {activeRound?.name || 'Ronda Mensual'}
          </h1>
          <p className="desktop-only" style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '750px', marginTop: '0.35rem', marginBottom: 0 }}>
            Auditoría periódica de {metrics.totalOperative} extintores operativos bajo norma <strong>IRAM 3517-2</strong>. 
            El personal de campo realiza el relevamiento mediante escaneo QR y checklist en celular.
          </p>
        </div>

        {/* Desktop Buttons */}
        <div className="desktop-only" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => onNavigate('route')}
            className="btn btn-primary"
            style={{ fontWeight: 800 }}
          >
            <NavigationArrow size={18} weight="bold" aria-hidden="true" />
            <span>Mi Ruta</span>
          </button>
          
          <button 
            onClick={() => onNavigate('scan')}
            className="btn btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <QrCode size={18} weight="bold" aria-hidden="true" />
            <span>Escanear QR</span>
          </button>

          <a 
            href="/api/m365/report-html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-secondary" 
            style={{ fontWeight: 700, textDecoration: 'none' }}
            title="Genera reporte oficial listo para imprimir o guardar como PDF"
          >
            <Printer size={18} weight="bold" aria-hidden="true" />
            <span>Informe ART / PDF</span>
          </a>

          <button 
            onClick={onExportExcel}
            className="btn btn-secondary"
            style={{ fontWeight: 700 }}
            title="Exportar planilla auditada compatible con Microsoft 365"
          >
            <FileXls size={18} weight="bold" aria-hidden="true" />
            <span>Excel 365</span>
          </button>
        </div>

        {/* Mobile Quick Action Pill */}
        <div className="mobile-only" style={{ width: '100%', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
          <button 
            onClick={() => onNavigate('route')}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, minHeight: '38px', fontWeight: 800, fontSize: '0.8rem' }}
          >
            <NavigationArrow size={15} weight="bold" aria-hidden="true" />
            <span>Mi Ruta ({metrics.pendingThisMonth} pend.)</span>
          </button>

          <a 
            href="/api/m365/report-html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm" 
            style={{ flex: 1, minHeight: '38px', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}
          >
            <Printer size={15} weight="bold" aria-hidden="true" />
            <span>Informe PDF</span>
          </a>
        </div>
      </div>

      {/* 4 Core KPIs */}
      <div className="dashboard-kpi-grid">
        {/* KPI 1: Cobertura de la Ronda */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span className="label">Avance Ronda Mensual</span>
            <span className="status-badge pending" style={{ fontSize: '0.72rem' }}>
              {metrics.coveragePercentage}% Cobertura
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-main)' }}>
              {metrics.inspectedThisMonth}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              de {metrics.totalOperative} equipos
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '7px',
            background: 'var(--border-color)',
            borderRadius: '999px',
            overflow: 'hidden',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              width: `${Math.min(100, metrics.coveragePercentage)}%`,
              height: '100%',
              background: 'var(--milicic-orange)',
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span className="status-badge ok" style={{ padding: '0.2rem 0.5rem' }}>
              <CheckCircle size={14} weight="bold" aria-hidden="true" /> {metrics.inspectedThisMonth - metrics.failedThisMonth} OK
            </span>
            <span className="status-badge pending" style={{ padding: '0.2rem 0.5rem' }}>
              <Clock size={14} weight="bold" aria-hidden="true" /> {metrics.pendingThisMonth} Pendientes
            </span>
          </div>
        </div>

        {/* KPI 2: Casos / Anomalías Detectadas */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span className="label">Anomalías y Casos</span>
            <WarningCircle size={20} weight="bold" color="var(--status-fault-text)" aria-hidden="true" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 900, color: metrics.openCasesCount > 0 ? 'var(--status-fault-text)' : 'var(--text-main)' }}>
              {metrics.openCasesCount || metrics.failedThisMonth}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              casos abiertos
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={() => onNavigate('cases')}
              className="btn btn-secondary btn-sm btn-full"
            >
              <span>Ver Casos de Anomalías</span>
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* KPI 3: Vencimientos Recarga Anual */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span className="label">Vto. Carga Anual</span>
            <ShieldWarning size={20} weight="bold" color={metrics.expiredCharges > 0 ? 'var(--status-expired-text)' : 'var(--status-pending-text)'} aria-hidden="true" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 900, color: metrics.expiredCharges > 0 ? 'var(--status-expired-text)' : 'var(--text-main)' }}>
              {metrics.expiredCharges}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              vencidos actualmente
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span>• 15 días: <strong>{metrics.expiringCharge15}</strong> por vencer</span>
            <span>• 30 días: <strong>{metrics.expiringCharge30}</strong> por vencer</span>
            <span>• 60 días: <strong>{metrics.expiringCharge60}</strong> por vencer</span>
          </div>
        </div>

        {/* KPI 4: Prueba Hidráulica (PH 5 años) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span className="label">Prueba Hidráulica (PH)</span>
            <CalendarCheck size={20} weight="bold" color="var(--status-info-text)" aria-hidden="true" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--status-info-text)' }}>
              {metrics.expiringPhSoon}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              en los próximos 90 días
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Coordinar rotación y retiro escalonado con taller habilitado IRAM.
          </p>
        </div>
      </div>

      {/* HEATMAP / GRID VISUAL POR SECTOR Y PISO */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GridFour size={20} weight="bold" color="var(--milicic-orange)" aria-hidden="true" />
              <h2 className="card-title" style={{ margin: 0 }}>
                Tablero Táctico de Sectores (Heatmap)
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
              Matriz visual de los 130 extintores organizados por sector y piso. Pulsá cualquier equipo para inspeccionar o consultar su ficha.
            </p>
          </div>

          {/* Heatmap Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <span className="status-badge ok" style={{ padding: '0.15rem 0.45rem' }}>
              <CheckCircle size={12} weight="bold" aria-hidden="true" /> Inspeccionado OK
            </span>
            <span className="status-badge pending" style={{ padding: '0.15rem 0.45rem' }}>
              <Clock size={12} weight="bold" aria-hidden="true" /> Pendiente
            </span>
            <span className="status-badge fault" style={{ padding: '0.15rem 0.45rem' }}>
              <WarningCircle size={12} weight="bold" aria-hidden="true" /> Falla / Caso
            </span>
            <span className="status-badge expired" style={{ padding: '0.15rem 0.45rem' }}>
              <ShieldWarning size={12} weight="bold" aria-hidden="true" /> Carga Vencida
            </span>
          </div>
        </div>

        {sectorGroups.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FireExtinguisher size={32} weight="duotone" style={{ margin: '0 auto 0.5rem' }} aria-hidden="true" />
            <p>Cargando matriz táctica de extintores...</p>
          </div>
        ) : (
          <div className="sector-heatmap-container">
            {sectorGroups.map(sector => {
              const totalInSector = sector.extinguishers.length;
              const okInSector = sector.extinguishers.filter(e => e.status === 'OK' || e.last_inspected_date).length;
              const pct = Math.round((okInSector / totalInSector) * 100);

              return (
                <div key={sector.name} className="sector-heatmap-group">
                  <div className="sector-heatmap-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Buildings size={16} weight="bold" color="var(--milicic-orange)" aria-hidden="true" />
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {sector.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({totalInSector} equipos)
                      </span>
                    </div>

                    <span className={`status-badge ${pct === 100 ? 'ok' : 'pending'}`} style={{ fontSize: '0.72rem' }}>
                      {okInSector}/{totalInSector} ({pct}%)
                    </span>
                  </div>

                  <div className="sector-heatmap-grid">
                    {sector.extinguishers.map(ext => {
                      const statusClass = getHeatmapStatusClass(ext);
                      const displayCode = ext.code.replace(/^MF-?/i, '');

                      return (
                        <button
                          key={ext.id || ext.code}
                          type="button"
                          className={`heatmap-cell ${statusClass}`}
                          title={getHeatmapTooltip(ext)}
                          aria-label={`Matafuego ${ext.code}, estado: ${statusClass}`}
                          onClick={() => {
                            if (onInspectExtinguisher) {
                              onInspectExtinguisher(ext);
                            } else {
                              onNavigate('extinguishers');
                            }
                          }}
                        >
                          <span style={{ fontSize: '0.65rem', opacity: 0.75, lineHeight: 1 }}>MF</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 900, lineHeight: 1 }}>{displayCode}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Middle Layout: Semáforo & Actividad Reciente */}
      <div className="dashboard-two-col">
        {/* Semáforo de Ronda */}
        <div className="card">
          <h2 className="card-title">
            Semáforo de Estado Mensual
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Estado de los 130 equipos asignados a los diferentes sectores y pisos:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'var(--status-ok-bg)',
              border: '1px solid var(--status-ok-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <CheckCircle size={22} weight="bold" color="var(--status-ok-text)" aria-hidden="true" />
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--status-ok-text)', fontSize: '0.9rem' }}>Controlados OK</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-body)' }}>Inspeccionados este mes sin anomalías</p>
                </div>
              </div>
              <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--status-ok-text)' }}>
                {metrics.inspectedThisMonth - metrics.failedThisMonth}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'var(--status-pending-bg)',
              border: '1px solid var(--status-pending-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Clock size={22} weight="bold" color="var(--status-pending-text)" aria-hidden="true" />
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--status-pending-text)', fontSize: '0.9rem' }}>Pendientes de Ronda</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-body)' }}>Equipos que aún faltan auditar este mes</p>
                </div>
              </div>
              <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--status-pending-text)' }}>
                {metrics.pendingThisMonth}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'var(--status-fault-bg)',
              border: '1px solid var(--status-fault-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <WarningCircle size={22} weight="bold" color="var(--status-fault-text)" aria-hidden="true" />
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--status-fault-text)', fontSize: '0.9rem' }}>Falla / Vencido</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-body)' }}>Manómetro bajo, precinto roto o carga vencida</p>
                </div>
              </div>
              <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--status-fault-text)' }}>
                {metrics.failedThisMonth + metrics.expiredCharges}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => onNavigate('extinguishers')}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
            >
              <span>Ver Inventario Completo</span>
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </button>
            <button 
              onClick={() => onNavigate('qrs')}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
            >
              <Printer size={14} weight="bold" aria-hidden="true" />
              <span>Imprimir Etiquetas</span>
            </button>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 className="card-title">
              Actividad Reciente en Campo
            </h2>
            <button 
              onClick={() => onNavigate('history')}
              className="btn btn-secondary btn-sm"
            >
              Historial Completo
            </button>
          </div>

          {recent.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aún no hay inspecciones en la ronda activa.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {recent.map((item) => (
                <div 
                  key={item.id}
                  style={{
                    padding: '0.7rem 0.85rem',
                    background: 'var(--bg-app)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span className="milicic-id-plate" style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem' }}>
                        <span className="plate-code">{item.extinguisher_code}</span>
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        • {item.type} {item.capacity}
                      </span>
                      {item.is_suspicious === 1 && (
                        <span className="status-badge fault" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }} title="Duración menor a 5 segundos">
                          Sospechoso
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.2rem' }}>
                      {item.location}
                    </p>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {item.inspector_name} • {item.inspection_date.substring(0, 16)}
                    </span>
                  </div>

                  <div>
                    {item.passed === 1 ? (
                      <span className="status-badge ok">
                        <CheckCircle size={14} weight="bold" aria-hidden="true" /> OK
                      </span>
                    ) : (
                      <span className="status-badge fault">
                        <WarningCircle size={14} weight="bold" aria-hidden="true" /> Falla
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
