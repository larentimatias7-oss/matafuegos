import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Flame, 
  Calendar, 
  ArrowRight, 
  ScanLine, 
  Printer, 
  FileSpreadsheet, 
  ShieldAlert,
  RotateCcw,
  Navigation,
  Wrench,
  Building,
  Info
} from 'lucide-react';

export default function Dashboard({ stats, onNavigate, onExportExcel, onResetSeed, loading }) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Banner with Milicic Branding & Quick Navigation */}
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

        {/* Desktop Buttons (All 4) */}
        <div className="desktop-only" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => onNavigate('route')}
            className="btn btn-primary"
            style={{ fontWeight: 800 }}
          >
            <Navigation size={18} />
            <span>Mi Ruta</span>
          </button>
          
          <button 
            onClick={() => onNavigate('scan')}
            className="btn btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <ScanLine size={18} />
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
            <Printer size={18} />
            <span>Informe ART / PDF</span>
          </a>

          <button 
            onClick={onExportExcel}
            className="btn btn-secondary"
            style={{ fontWeight: 700 }}
            title="Exportar planilla auditada compatible con Microsoft 365"
          >
            <FileSpreadsheet size={18} />
            <span>Excel 365</span>
          </button>
        </div>

        {/* Mobile Quick Action Pill (Compact 1-row) */}
        <div className="mobile-only" style={{ width: '100%', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
          <button 
            onClick={() => onNavigate('route')}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, minHeight: '38px', fontWeight: 800, fontSize: '0.8rem' }}
          >
            <Navigation size={15} />
            <span>Mi Ruta ({metrics.pendingThisMonth} pend.)</span>
          </button>

          <a 
            href="/api/m365/report-html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm" 
            style={{ flex: 1, minHeight: '38px', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}
          >
            <Printer size={15} />
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
              <CheckCircle2 size={12} /> {metrics.inspectedThisMonth - metrics.failedThisMonth} OK
            </span>
            <span className="status-badge pending" style={{ padding: '0.2rem 0.5rem' }}>
              <Clock size={12} /> {metrics.pendingThisMonth} Pendientes
            </span>
          </div>
        </div>

        {/* KPI 2: Casos / Anomalías Detectadas */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span className="label">Anomalías y Casos</span>
            <AlertTriangle size={18} color="var(--status-fault-text)" />
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
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* KPI 3: Vencimientos Recarga Anual */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span className="label">Vto. Carga Anual</span>
            <ShieldAlert size={18} color={metrics.expiredCharges > 0 ? 'var(--status-expired-text)' : 'var(--status-pending-text)'} />
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
            <Calendar size={18} color="var(--status-info-text)" />
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
                <CheckCircle2 size={20} color="var(--status-ok-text)" />
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
                <Clock size={20} color="var(--status-pending-text)" />
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
                <AlertTriangle size={20} color="var(--status-fault-text)" />
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
              <ArrowRight size={14} />
            </button>
            <button 
              onClick={() => onNavigate('qrs')}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
            >
              <Printer size={14} />
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
                      <span className="font-mono" style={{ fontWeight: 800, color: 'var(--milicic-orange)', fontSize: '0.9rem' }}>
                        {item.extinguisher_code}
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
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.location}
                    </p>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {item.inspector_name} • {item.inspection_date.substring(0, 16)}
                    </span>
                  </div>

                  <div>
                    {item.passed === 1 ? (
                      <span className="status-badge ok">
                        <CheckCircle2 size={13} /> OK
                      </span>
                    ) : (
                      <span className="status-badge fault">
                        <AlertTriangle size={13} /> Falla
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
