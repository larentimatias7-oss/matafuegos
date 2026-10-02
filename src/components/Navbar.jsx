import React from 'react';
import { 
  Flame, 
  LayoutDashboard, 
  QrCode, 
  ScanLine, 
  History, 
  FileSpreadsheet, 
  Printer, 
  PlusCircle,
  CloudCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onNewExtinguisher, stats }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'extinguishers', label: 'Extintores (130)', icon: Flame },
    { id: 'scan', label: 'Escanear / Control', icon: ScanLine, highlight: true },
    { id: 'qrs', label: 'Imprimir QRs', icon: Printer },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'm365', label: 'Microsoft 365', icon: FileSpreadsheet },
  ];

  const now = new Date();
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthName = months[now.getMonth()];
  const currentYear = now.getFullYear();

  return (
    <header className="no-print" style={{
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: '#ffffff',
            padding: '4px 8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}>
            <img src="/logo-milicic.svg" alt="Milicic S.A." style={{ height: '30px', width: 'auto' }} onError={(e) => { e.target.src = '/logo-milicic.png'; }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#fff' }}>
                Control Matafuegos
              </span>
              <span style={{
                background: '#ea580c',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                letterSpacing: '0.05em'
              }}>
                MILICIC
              </span>
              <span style={{
                background: '#0078d4',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                letterSpacing: '0.05em'
              }}>
                M365
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Control Mensual IRAM 3517-2 • {monthName} {currentYear}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'rgba(30, 41, 59, 0.6)',
          padding: '0.3rem',
          borderRadius: '10px',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          overflowX: 'auto',
          maxWidth: '100%'
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
                  padding: '0.5rem 0.85rem',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  background: isActive 
                    ? (tab.highlight ? '#ea580c' : '#334155') 
                    : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={onNewExtinguisher}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <PlusCircle size={16} color="#38bdf8" />
            <span>Nuevo Extintor</span>
          </button>
        </div>
      </div>
    </header>
  );
}
