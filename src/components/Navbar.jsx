import React, { useState } from 'react';
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
  CalendarCheck, 
  BookOpen,
  Menu,
  X,
  ChevronRight,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onNewExtinguisher, 
  theme = 'light', 
  onToggleTheme, 
  user, 
  currentRound,
  isOnline = true
}) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  const getTabTitle = (tabId) => {
    switch (tabId) {
      case 'dashboard': return 'Dashboard General';
      case 'route': return 'Mi Ruta de Inspección';
      case 'scan': return 'Control Mensual';
      case 'extinguishers': return 'Inventario de Extintores';
      case 'cases': return 'Casos y Anomalías';
      case 'qrs': return 'Impresión de Etiquetas QR';
      case 'history': return 'Historial de Inspecciones';
      case 'm365': return 'Integración Microsoft 365';
      default: return 'Control de Extintores';
    }
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* =========================================================================
          1. COMPACT MOBILE HEADER (< 1025px)
          ========================================================================= */}
      <header className="mobile-header no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            background: '#ffffff',
            padding: '3px 6px',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}>
            <img 
              src="/logo-milicic.svg" 
              alt="Milicic S.A." 
              style={{ height: '22px', width: 'auto' }} 
              onError={(e) => { e.target.src = '/logo-milicic.png'; }} 
            />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff', lineHeight: 1.15 }}>
              {getTabTitle(activeTab)}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Milicic HSE</span>
              <span>•</span>
              <span style={{ color: isOnline ? '#4ade80' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px' }}>
                {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                {isOnline ? 'En línea' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={onToggleTheme}
            className="btn btn-secondary btn-sm"
            style={{ minHeight: '34px', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#cbd5e1" />}
          </button>

          <button
            onClick={onNewExtinguisher}
            className="btn btn-primary btn-sm"
            style={{ minHeight: '34px', padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
            title="Nuevo Extintor"
          >
            <Plus size={15} />
            <span>Nuevo</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. DESKTOP HEADER (> 1024px)
          ========================================================================= */}
      <header className="desktop-only no-print" style={{
        background: 'var(--milicic-slate-dark)',
        borderBottom: '2px solid var(--milicic-orange)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0.6rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          {/* Brand Milicic */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: '#ffffff',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <img 
                src="/logo-milicic.svg" 
                alt="Milicic S.A." 
                style={{ height: '28px', width: 'auto' }} 
                onError={(e) => { e.target.src = '/logo-milicic.png'; }} 
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff', letterSpacing: '-0.01em' }}>
                  Control de Extintores
                </span>
                <span style={{
                  background: 'var(--milicic-orange)',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '3px'
                }}>
                  IRAM 3517-2
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CalendarCheck size={13} color="#fdba74" />
                <span>Ronda Activa: {currentRound?.name || 'Octubre 2026'}</span>
              </div>
            </div>
          </div>

          {/* User & Theme Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={onToggleTheme}
              className="btn btn-secondary btn-sm"
              style={{ minHeight: '38px', padding: '0.35rem 0.65rem' }}
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#475569" />}
            </button>

            {user && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                fontSize: '0.82rem'
              }}>
                <UserCheck size={14} color="#34d399" />
                <span style={{ fontWeight: 600 }}>{user.name}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({user.role})</span>
              </div>
            )}

            <button
              onClick={onNewExtinguisher}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700 }}
            >
              <Plus size={16} />
              <span>Nuevo Extintor</span>
            </button>
          </div>
        </div>

        {/* Desktop Tabs Bar */}
        <div style={{
          background: '#090d16',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0.25rem 1.25rem',
          display: 'flex',
          gap: '0.25rem',
          overflowX: 'auto'
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

          <a
            href="/documentacion"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              minHeight: '42px',
              padding: '0.4rem 0.85rem',
              borderRadius: '5px',
              fontSize: '0.84rem',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              color: '#fdba74',
              background: 'rgba(234, 88, 12, 0.15)',
              border: '1px solid rgba(253, 186, 116, 0.3)',
              marginLeft: 'auto'
            }}
            title="Centro de Documentación Oficial de Milicic S.A."
          >
            <BookOpen size={16} />
            <span>Manuales & Docs</span>
          </a>
        </div>
      </header>

      {/* =========================================================================
          3. FIXED MOBILE BOTTOM NAVIGATION BAR (< 1025px)
          ========================================================================= */}
      <nav className="mobile-bottom-nav no-print">
        {/* Tab 1: Inicio / Dashboard */}
        <button
          onClick={() => handleSelectTab('dashboard')}
          className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Inicio</span>
        </button>

        {/* Tab 2: Inventario */}
        <button
          onClick={() => handleSelectTab('extinguishers')}
          className={`mobile-nav-btn ${activeTab === 'extinguishers' ? 'active' : ''}`}
        >
          <Flame size={20} />
          <span>Inventario</span>
        </button>

        {/* Tab 3: Escanear (Central destacado) */}
        <button
          onClick={() => handleSelectTab('scan')}
          className="mobile-nav-scan"
          aria-label="Escanear Código QR"
          title="Escanear Código QR"
        >
          <ScanLine size={26} strokeWidth={2.4} />
        </button>

        {/* Tab 4: Historial */}
        <button
          onClick={() => handleSelectTab('history')}
          className={`mobile-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
        >
          <History size={20} />
          <span>Historial</span>
        </button>

        {/* Tab 5: Más (Abre Drawer / Bottom Sheet) */}
        <button
          onClick={() => setShowMoreMenu(true)}
          className={`mobile-nav-btn ${['route', 'cases', 'qrs', 'm365'].includes(activeTab) ? 'active' : ''}`}
        >
          <Menu size={20} />
          <span>Más</span>
        </button>
      </nav>

      {/* =========================================================================
          4. MOBILE "MÁS" MENU (BOTTOM SHEET / DRAWER)
          ========================================================================= */}
      {showMoreMenu && (
        <div className="modal-overlay" onClick={() => setShowMoreMenu(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drag-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                  Menú y Herramientas
                </span>
                <span className="status-badge info" style={{ fontSize: '0.65rem' }}>
                  Milicic HSE
                </span>
              </div>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="btn btn-secondary btn-sm"
                style={{ minHeight: '34px', padding: '0.2rem 0.5rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Opción: Mi Ruta */}
              <button
                onClick={() => handleSelectTab('route')}
                className="btn btn-secondary btn-full"
                style={{ justifyContent: 'space-between', minHeight: '50px', background: activeTab === 'route' ? 'var(--milicic-orange-soft)' : undefined }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <MapPin size={18} color="var(--milicic-orange)" />
                  <span style={{ fontWeight: 700 }}>Mi Ruta de Inspección</span>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>

              {/* Opción: Casos y Anomalías */}
              <button
                onClick={() => handleSelectTab('cases')}
                className="btn btn-secondary btn-full"
                style={{ justifyContent: 'space-between', minHeight: '50px', background: activeTab === 'cases' ? 'var(--milicic-orange-soft)' : undefined }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <AlertTriangle size={18} color="#dc2626" />
                  <span style={{ fontWeight: 700 }}>Casos y Anomalías</span>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>

              {/* Opción: Etiquetas QR */}
              <button
                onClick={() => handleSelectTab('qrs')}
                className="btn btn-secondary btn-full"
                style={{ justifyContent: 'space-between', minHeight: '50px', background: activeTab === 'qrs' ? 'var(--milicic-orange-soft)' : undefined }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Printer size={18} color="var(--text-main)" />
                  <span style={{ fontWeight: 700 }}>Impresión de Etiquetas QR</span>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>

              {/* Opción: Microsoft 365 */}
              <button
                onClick={() => handleSelectTab('m365')}
                className="btn btn-secondary btn-full"
                style={{ justifyContent: 'space-between', minHeight: '50px', background: activeTab === 'm365' ? 'var(--milicic-orange-soft)' : undefined }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <FileSpreadsheet size={18} color="#16a34a" />
                  <span style={{ fontWeight: 700 }}>Microsoft 365 & Excel</span>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>

              {/* Opción: Documentación Oficial */}
              <a
                href="/documentacion"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-full"
                style={{ justifyContent: 'space-between', minHeight: '50px', textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <BookOpen size={18} color="var(--milicic-orange)" />
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Centro de Documentación</span>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </a>
            </div>

            {/* User Info & Quick Action Footer */}
            <div style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {user?.name || 'Inspector HyS'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Rol: {user?.role || 'INSPECTOR'} • Milicic S.A.
                </div>
              </div>

              <button
                onClick={onToggleTheme}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#475569" />}
                <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
