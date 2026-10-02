import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import RouteView from './components/RouteView';
import ExtinguishersList from './components/ExtinguishersList';
import Scanner from './components/Scanner';
import InspectionForm from './components/InspectionForm';
import CasesList from './components/CasesList';
import QrPrinter from './components/QrPrinter';
import InspectionHistory from './components/InspectionHistory';
import M365SyncModal from './components/M365SyncModal';
import ExtinguisherModal from './components/ExtinguisherModal';
import LoginModal from './components/LoginModal';
import { WifiSlash, Cloud, ArrowsClockwise, CheckCircle } from '@phosphor-icons/react';
import { getOfflineInspections, syncOfflineInspections } from './utils/offlineQueue';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [extinguishers, setExtinguishers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  // User & Auth State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('firecontrol_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name && (parsed.name.includes('Santi ') || parsed.name === 'Santi')) {
          parsed.name = 'Santiago Amaya (Inspector HyS)';
          localStorage.setItem('firecontrol_user', JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {}
    }
    return { name: 'Santiago Amaya (Inspector HyS)', role: 'INSPECTOR' };
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Theme State (Light default per Milicic specifications)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('firecontrol_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('firecontrol_theme', theme);
  }, [theme]);

  const checkOfflineQueue = async () => {
    try {
      const items = await getOfflineInspections();
      setPendingOfflineCount(items.length);
    } catch (e) {
      console.warn('Error verificando cola offline:', e);
    }
  };

  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const result = await syncOfflineInspections();
      if (result.synced > 0) {
        setSyncFeedback(`Se sincronizaron ${result.synced} inspección(es) exitosamente.`);
        fetchData();
      }
      await checkOfflineQueue();
    } catch (e) {
      setSyncFeedback('Error sincronizando cola: ' + e.message);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // Network online/offline listener and auto-sync
  useEffect(() => {
    checkOfflineQueue();

    const handleOnline = () => {
      setIsOnline(true);
      handleTriggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodically check queue
    const interval = setInterval(() => {
      checkOfflineQueue();
      if (navigator.onLine && pendingOfflineCount > 0) {
        handleTriggerSync();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [pendingOfflineCount]);

  // Inspection flow
  const [inspectingExtinguisher, setInspectingExtinguisher] = useState(null);

  // Modal flow (create, edit, view QR)
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create',
    extinguisher: null
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [extRes, statsRes] = await Promise.all([
        fetch('/api/extinguishers'),
        fetch('/api/inspections/stats')
      ]);

      const extData = await extRes.json();
      const statsData = await statsRes.json();

      if (extData.success) setExtinguishers(extData.data);
      if (statsData.success) setStats(statsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check if URL has ?code=MF-XXX or #check
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      handleSelectCode(codeParam.toUpperCase());
    }
  }, []);

  const handleSelectCode = async (codeOrPublicId) => {
    try {
      const res = await fetch(`/api/extinguishers/${encodeURIComponent(codeOrPublicId)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setInspectingExtinguisher(data.data);
        setActiveTab('scan');
      } else {
        alert(`No se encontró ningún matafuego con el código "${codeOrPublicId}".`);
      }
    } catch (e) {
      alert(`Error al buscar extintor: ${e.message}`);
    }
  };

  const handleExportExcel = () => {
    window.location.href = '/api/m365/export-excel';
  };

  const handleResetSeed = async () => {
    if (window.confirm('¿Desea reiniciar los 130 matafuegos con datos técnicos completos de Milicic S.A.?')) {
      try {
        const res = await fetch('/api/extinguishers/reset-seed', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          alert(data.message);
          fetchData();
        }
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const handleDeleteExtinguisher = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este extintor del inventario?')) {
      try {
        const res = await fetch(`/api/extinguishers/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          fetchData();
        }
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="app-container">
      
      {/* Offline Status or Pending Sync Warning Bar */}
      {(!isOnline || pendingOfflineCount > 0 || syncFeedback) && (
        <div style={{
          background: !isOnline ? 'var(--status-pending-bg)' : 'var(--milicic-orange-light)',
          color: !isOnline ? 'var(--status-pending-text)' : 'var(--milicic-orange-dark)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.45rem 1rem',
          fontSize: '0.82rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!isOnline ? <WifiSlash size={16} aria-hidden="true" /> : <Cloud size={16} aria-hidden="true" />}
            <span>
              {syncFeedback ? syncFeedback :
               !isOnline ? `Modo Sin Conexión (${pendingOfflineCount} guardado/s en dispositivo)` :
               `Hay ${pendingOfflineCount} inspección(es) pendiente(s) de sincronizar`}
            </span>
          </div>

          {isOnline && pendingOfflineCount > 0 && (
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="btn btn-primary"
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem', minHeight: '34px' }}
            >
              <ArrowsClockwise size={14} className={isSyncing ? 'animate-spin' : ''} aria-hidden="true" />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}</span>
            </button>
          )}
        </div>
      )}

      {/* Corporate Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'scan') setInspectingExtinguisher(null);
        }}
        onNewExtinguisher={() => setModalState({ open: true, mode: 'create', extinguisher: null })}
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        currentRound={stats?.activeRound}
      />

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={stats}
            extinguishers={extinguishers}
            onNavigate={(tab) => setActiveTab(tab)}
            onExportExcel={handleExportExcel}
            onResetSeed={handleResetSeed}
            onInspectExtinguisher={(ext) => {
              setInspectingExtinguisher(ext);
              setActiveTab('scan');
            }}
            loading={loading}
          />
        )}

        {/* TAB 2: MI RUTA DE INSPECCIÓN */}
        {activeTab === 'route' && (
          <RouteView 
            onInspectCode={(code) => handleSelectCode(code)}
          />
        )}

        {/* TAB 3: ESCANEAR / CONTROL MENSUAL */}
        {activeTab === 'scan' && (
          inspectingExtinguisher ? (
            <InspectionForm 
              extinguisher={inspectingExtinguisher}
              onBack={() => setInspectingExtinguisher(null)}
              onSaved={() => {
                fetchData();
                setInspectingExtinguisher(null);
              }}
              onInspectNext={(nextCode) => {
                fetchData();
                handleSelectCode(nextCode);
              }}
            />
          ) : (
            <Scanner 
              extinguishers={extinguishers}
              onSelectCode={handleSelectCode}
            />
          )
        )}

        {/* TAB 4: INVENTARIO EXTINTORES */}
        {activeTab === 'extinguishers' && (
          <ExtinguishersList 
            extinguishers={extinguishers}
            onInspect={(ext) => {
              setInspectingExtinguisher(ext);
              setActiveTab('scan');
            }}
            onEdit={(ext) => setModalState({ open: true, mode: 'edit', extinguisher: ext })}
            onDelete={handleDeleteExtinguisher}
            onShowQr={(ext) => setModalState({ open: true, mode: 'qr', extinguisher: ext })}
            onNewExtinguisher={() => setModalState({ open: true, mode: 'create', extinguisher: null })}
          />
        )}

        {/* TAB 5: CASOS Y ANOMALÍAS */}
        {activeTab === 'cases' && (
          <CasesList />
        )}

        {/* TAB 6: IMPRESIÓN DE ETIQUETAS QR */}
        {activeTab === 'qrs' && (
          <QrPrinter />
        )}

        {/* TAB 7: HISTORIAL AUDITABLE */}
        {activeTab === 'history' && (
          <InspectionHistory onExportExcel={handleExportExcel} />
        )}

        {/* TAB 8: MICROSOFT 365 INTEGRATION */}
        {activeTab === 'm365' && (
          <M365SyncModal 
            onExportExcel={handleExportExcel} 
            onRefreshData={fetchData}
          />
        )}

      </main>

      {/* Modal for Create / Edit / QR */}
      {modalState.open && (
        <ExtinguisherModal 
          mode={modalState.mode}
          extinguisher={modalState.extinguisher}
          onClose={() => setModalState({ open: false, mode: 'create', extinguisher: null })}
          onSave={() => {
            setModalState({ open: false, mode: 'create', extinguisher: null });
            fetchData();
          }}
        />
      )}

      {/* Optional Login Modal */}
      {showLoginModal && (
        <LoginModal 
          onLogin={(u) => {
            setUser(u);
            localStorage.setItem('firecontrol_user', JSON.stringify(u));
            setShowLoginModal(false);
          }}
        />
      )}

    </div>
  );
}
