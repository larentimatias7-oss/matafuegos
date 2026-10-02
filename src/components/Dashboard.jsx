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
  RotateCcw
} from 'lucide-react';

export default function Dashboard({ stats, onNavigate, onExportExcel, onResetSeed, loading }) {
  const metrics = stats?.metrics || {
    allTotal: 130,
    totalOperative: 128,
    inspectedThisMonth: 45,
    pendingThisMonth: 83,
    failedThisMonth: 1,
    coveragePercentage: 35,
    expiredCharges: 4,
    expiringChargeSoon: 8,
    expiringPhSoon: 6
  };

  const recent = stats?.recentActivity || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner with Quick Actions */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
        borderLeft: '4px solid #ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
            Panel de Control Mensual • Matafuegos
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '700px' }}>
            Seguimiento de {metrics.totalOperative} extintores operativos conforme a la norma <strong>IRAM 3517-2</strong>. 
            Escaneá los códigos QR durante la ronda mensual para registrar el control en tiempo real.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => onNavigate('scan')}
            className="btn btn-primary btn-lg"
          >
            <ScanLine size={20} />
            <span>Escanear QR Ahora</span>
          </button>
          
          <button 
            onClick={onExportExcel}
            className="btn btn-m365"
          >
            <FileSpreadsheet size={18} />
            <span>Descargar Excel 365</span>
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem'
      }}>
        {/* Card 1: Cobertura Mensual */}
        <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className="label">Control Mensual</span>
            <div style={{
              background: metrics.coveragePercentage >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: metrics.coveragePercentage >= 80 ? '#34d399' : '#fbbf24',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {metrics.coveragePercentage}% Cobertura
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }}>
              {metrics.inspectedThisMonth}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '1rem' }}>
              de {metrics.totalOperative} equipos
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '8px',
            background: '#334155',
            borderRadius: '999px',
            overflow: 'hidden',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              width: `${Math.min(100, metrics.coveragePercentage)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem' }}>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <CheckCircle2 size={13} /> {metrics.inspectedThisMonth - metrics.failedThisMonth} OK
            </span>
            {metrics.failedThisMonth > 0 && (
              <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <AlertTriangle size={13} /> {metrics.failedThisMonth} Falla
              </span>
            )}
            <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Clock size={13} /> {metrics.pendingThisMonth} Pendientes
            </span>
          </div>
        </div>

        {/* Card 2: Total Matafuegos y Estado */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className="label">Parque de Matafuegos</span>
            <Flame size={20} color="#f87171" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }}>
              {metrics.allTotal}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              totales instalados
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-green">{metrics.totalOperative} Operativos</span>
            <span className="badge badge-yellow">1 En Taller</span>
            <span className="badge badge-red">1 De Baja</span>
          </div>
        </div>

        {/* Card 3: Vencimiento de Carga Anual */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className="label">Vto. Carga Anual (Mantenimiento)</span>
            <ShieldAlert size={20} color={metrics.expiredCharges > 0 ? '#ef4444' : '#fbbf24'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: metrics.expiredCharges > 0 ? '#f87171' : '#fff' }}>
              {metrics.expiredCharges}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              vencidos actualmente
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={14} /> {metrics.expiringChargeSoon} vencen en los próximos 30 días
          </p>
        </div>

        {/* Card 4: Prueba Hidráulica (PH) */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className="label">Prueba Hidráulica (PH - 5 Años)</span>
            <Calendar size={20} color="#38bdf8" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8' }}>
              {metrics.expiringPhSoon}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              vencen en &lt; 90 días
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Requieren retiro escalonado para ensayo en taller certificado IRAM.
          </p>
        </div>
      </div>

      {/* Middle Grid: Semáforo del Mes & Actividad Reciente */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Semáforo y Guía Rápida */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🚦 Semáforo de Control Mensual</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
            El estado de cada matafuego se actualiza automáticamente al escanear el QR o registrar una inspección:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
                <div>
                  <span style={{ fontWeight: 700, color: '#34d399', fontSize: '0.88rem' }}>Verde (Controlado OK)</span>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Inspeccionado este mes con todos los puntos aprobados</p>
                </div>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#34d399' }}>
                {metrics.inspectedThisMonth - metrics.failedThisMonth}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
                <div>
                  <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.88rem' }}>Amarillo (Pendiente)</span>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aún no se ha realizado el control este mes</p>
                </div>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fbbf24' }}>
                {metrics.pendingThisMonth}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                <div>
                  <span style={{ fontWeight: 700, color: '#f87171', fontSize: '0.88rem' }}>Rojo (Falla o Vencido)</span>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Falta de presión, precinto roto, sin acceso o carga anual vencida</p>
                </div>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f87171' }}>
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
              <span>Ver Listado Completo</span>
              <ArrowRight size={14} />
            </button>
            <button 
              onClick={() => onNavigate('qrs')}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
            >
              <Printer size={14} />
              <span>Imprimir 130 QRs</span>
            </button>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              ⏱️ Últimas Inspecciones
            </h2>
            <button 
              onClick={() => onNavigate('history')}
              className="btn btn-outline btn-sm"
            >
              Ver todo el historial
            </button>
          </div>

          {recent.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Aún no hay inspecciones registradas.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {recent.map((item) => (
                <div 
                  key={item.id}
                  style={{
                    padding: '0.7rem 0.85rem',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="font-mono" style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.85rem' }}>
                        {item.extinguisher_code}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        • {item.type} {item.capacity}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.location}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Por {item.inspector_name} • {item.inspection_date.substring(0, 16)}
                    </span>
                  </div>

                  <div>
                    {item.passed === 1 ? (
                      <span className="badge badge-green">OK</span>
                    ) : (
                      <span className="badge badge-red">Falla</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dokploy / Testing utilities footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        background: 'rgba(15, 23, 42, 0.4)',
        borderRadius: '8px',
        border: '1px solid rgba(148, 163, 184, 0.08)',
        fontSize: '0.8rem',
        color: '#64748b',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <span>🐳 Despliegue listo para <strong>Dokploy & Docker</strong> con base de datos SQLite integrada.</span>
        <button 
          onClick={onResetSeed}
          className="btn btn-outline btn-sm"
          style={{ fontSize: '0.75rem' }}
          title="Vuelve a cargar los 130 matafuegos de prueba con datos simulados"
        >
          <RotateCcw size={13} />
          <span>Restaurar 130 de Prueba</span>
        </button>
      </div>

    </div>
  );
}
