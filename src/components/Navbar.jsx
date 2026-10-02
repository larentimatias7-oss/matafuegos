import React from 'react';
import { 
  Flame, 
  LayoutDashboard, 
  ScanLine, 
  History, 
  FileSpreadsheet, 
  Printer, 
  Plus,
  MapPin,
  AlertTriangle,
  Sun,
  Moon,
  UserCheck,
  LogOut,
  CalendarCheck
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onNewExtinguisher, 
  theme = 'light', 
  onToggleTheme,
  user,
  onLogout,
  currentRound
}) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'route', label: 'Mi Ruta', icon: MapPin },
    { id: 'scan', label: 'Control Rápido', icon: ScanLine, highlight: true },
    { id: 'extinguishers', label: 'Inventario', icon: Flame },
    { id: 'cases', label: 'Anomalías / Casos', icon: AlertTriangle },
    { id: 'qrs', label: 'Etiquetas QR', icon: Printer },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'm365', label: 'Microsoft 365', icon: FileSpreadsheet },
  ];

  return (
    <header className="no-print" style={{
      background: 'var(--milicic-slate-dark)',
      borderBottom: '2px solid var(--milicic-orange)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0.6rem 0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Brand Milicic */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: '#ffffff',
            padding: '4px 8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <img 
              src="/logo-milicic.svg" 
              alt="Milicic S.A." 
              style={{ height: '26px', width: 'auto' }} 
              onError={(e) => { e.target.src = '/logo-milicic.png'; }} 
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', letterSpacing: '-0.01em' }}>
                Control Matafuegos
              </span>
              <span style={{
                background: 'var(--milicic-orange)',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.15rem 0.45rem',
                borderRadius: '3px'
              }}>
                IRAM 3517-2
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CalendarCheck size={12} color="#fdba74" />
              <span>Ronda: {currentRound?.name || 'Mensual Activa'}</span>
            </div>
          </div>
        </div>

        {/* User & Theme Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="btn btn-secondary btn-sm"
            style={{ minHeight: '38px', padding: '0.35rem 0.6rem' }}
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#475569" />}
          </button>

          {/* User badge */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#f8fafc',
              fontSize: '0.8rem'
            }}>
              <UserCheck size={14} color="#34d399" />
              <span style={{ fontWeight: 600 }}>{user.name}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({user.role})</span>
            </div>
          )}

          {/* New Extinguisher button */}
          <button
            onClick={onNewExtinguisher}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700 }}
          >
            <Plus size={16} />
            <span className="hidden-mobile">Nuevo Equipo</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div style={{
        background: '#090d16',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0.25rem 0.85rem',
        overflowX: 'auto',
        display: 'flex',
        gap: '0.25rem'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                minHeight: '42px',
                padding: '0.4rem 0.85rem',
                borderRadius: '5px',
                border: 'none',
                fontSize: '0.84rem',
                fontWeight: isActive ? 800 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                background: isActive 
                  ? (tab.highlight ? 'var(--milicic-orange)' : 'rgba(255, 255, 255, 0.15)') 
                  : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid transparent'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
