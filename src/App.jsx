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
import UsersList from './components/UsersList';
import AuditViewer from './components/AuditViewer';
import UserProfileModal from './components/UserProfileModal';
import QuickPinSwitchModal from './components/QuickPinSwitchModal';
import AccessDenied from './components/AccessDenied';
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
        return parsed;
      } catch (_e) {
        // Fallback al usuario predeterminado
      }
    }
    return { name: 'Santiago Amaya (Inspector HyS)', role: 'INSPECTOR', id: '11111111-1111-4111-8111-111111111111' };
  });

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPinSwitchModal, setShowPinSwitchModal] = useState(false);

  // Theme State (Light default per Milicic specifications)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('firecontrol_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('firecontrol_theme', theme);
  }, [theme]);

  // Inspection flow
  const [inspectingExtinguisher, setInspectingExtinguisher] = useState(null);

  // Modal flow (create, edit, view QR)
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create',
    extinguisher: null
  });

  // Verify server session on load
  const verifySession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        localStorage.setItem('firecontrol_user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.warn('Error verificando sesión con el servidor:', e);
    }
  };

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

  const handleSelectCode = async (codeOrPublicId) => {
    if (!codeOrPublicId) return;
    try {
      let target = String(codeOrPublicId).trim();
      if (target.includes('/m/')) {
        const m = target.match(/\/m\/([a-zA-Z0-9_-]+)/i);
        if (m) target = m[1];
      } else if (target.includes('code=')) {
        const m = target.match(/code=([A-Za-z0-9_-]+)/i);
        if (m) target = m[1];
      }
      target = target.split('#')[0].split('?')[0].replace(/\/+$/, '').trim();

      const res = await fetch(`/api/extinguishers/${encodeURIComponent(target)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setInspectingExtinguisher(data.data);
        setActiveTab('scan');
        return;
      }

      // Fallback: check in local state extinguishers array
      const localFound = extinguishers.find(e => 
        (e.code && e.code.toUpperCase() === target.toUpperCase()) ||
        (e.public_id && e.public_id.toLowerCase() === target.toLowerCase()) ||
        String(e.id) === target
      );

      if (localFound) {
        setInspectingExtinguisher(localFound);
        setActiveTab('scan');
      } else {
        alert(`No se encontró ningún matafuego con el código "${codeOrPublicId}".`);
      }
    } catch (e) {
      // Offline fallback: check local extinguishers array
      const target = String(codeOrPublicId).trim().toUpperCase();
      const localFound = extinguishers.find(e => 
        (e.code && e.code.toUpperCase() === target) ||
        (e.public_id && e.public_id.toLowerCase() === target.toLowerCase()) ||
        String(e.id) === target
      );
      if (localFound) {
        setInspectingExtinguisher(localFound);
        setActiveTab('scan');
      } else {
        alert(`Error al buscar extintor: ${e.message}`);
      }
    }
  };

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
    verifySession();

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

  useEffect(() => {
    fetchData();

    // Check if URL has ?code=MF-XXX or #check
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      handleSelectCode(codeParam.toUpperCase());
    }
  }, []);

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
        } else {
          alert(data.error);
        }
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (_e) {
      // Ignorar error de red en logout
    }
    setUser(null);
    localStorage.removeItem('firecontrol_user');
    setShowProfileModal(false);
    setShowLoginModal(true);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const userRole = user?.role || 'INSPECTOR';

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
        isOnline={isOnline}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenPinSwitch={() => setShowPinSwitchModal(true)}
        onOpenLogin={() => setShowLoginModal(true)}
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
          userRole === 'AUDITOR' ? (
            <AccessDenied 
              userRole={userRole} 
              requiredRole="INSPECTOR o SUPERVISOR" 
              moduleName="Mi Ruta de Inspección" 
              onReturn={() => setActiveTab('dashboard')} 
            />
          ) : (
            <RouteView 
              onInspectCode={(code) => handleSelectCode(code)}
              currentUser={user}
            />
          )
        )}

        {/* TAB 3: ESCANEAR / CONTROL MENSUAL */}
        {activeTab === 'scan' && (
          userRole === 'AUDITOR' ? (
            <AccessDenied 
              userRole={userRole} 
              requiredRole="INSPECTOR, SUPERVISOR o ADMIN" 
              moduleName="Control Mensual de Extintores" 
              onReturn={() => setActiveTab('dashboard')} 
            />
          ) : (
            inspectingExtinguisher ? (
              <InspectionForm 
                extinguisher={inspectingExtinguisher}
                currentUser={user}
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
          )
        )}

        {/* TAB 4: INVENTARIO EXTINTORES */}
        {activeTab === 'extinguishers' && (
          <ExtinguishersList 
            extinguishers={extinguishers}
            currentUser={user}
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
          <CasesList currentUser={user} />
        )}

        {/* TAB 6: IMPRESIÓN DE ETIQUETAS QR */}
        {activeTab === 'qrs' && (
          ['SUPERADMIN', 'ADMIN', 'SUPERVISOR'].includes(userRole) ? (
            <QrPrinter />
          ) : (
            <AccessDenied 
              userRole={userRole} 
              requiredRole="SUPERVISOR o ADMIN" 
              moduleName="Impresión de Etiquetas QR" 
              onReturn={() => setActiveTab('dashboard')} 
            />
          )
        )}

        {/* TAB 7: HISTORIAL AUDITABLE */}
        {activeTab === 'history' && (
          <InspectionHistory onExportExcel={handleExportExcel} currentUser={user} />
        )}

        {/* TAB 8: GESTIÓN DE USUARIOS */}
        {activeTab === 'users' && (
          ['SUPERADMIN', 'ADMIN'].includes(userRole) ? (
            <UsersList currentUser={user} />
          ) : (
            <AccessDenied 
              userRole={userRole} 
              requiredRole="ADMIN o SUPERADMIN" 
              moduleName="Gestión de Usuarios y Permisos" 
              onReturn={() => setActiveTab('dashboard')} 
            />
          )
        )}

        {/* TAB 9: AUDITORÍA Y TRAZABILIDAD */}
        {activeTab === 'audit' && (
          ['SUPERADMIN', 'ADMIN', 'AUDITOR'].includes(userRole) ? (
            <AuditViewer />
          ) : (
            <AccessDenied 
              userRole={userRole} 
              requiredRole="ADMIN, AUDITOR o SUPERADMIN" 
              moduleName="Auditoría del Sistema" 
              onReturn={() => setActiveTab('dashboard')} 
            />
          )
        )}

        {/* TAB 10: MICROSOFT 365 INTEGRATION */}
        {activeTab === 'm365' && (
          <M365SyncModal 
            onExportExcel={handleExportExcel} 
            onRefreshData={fetchData}
            currentUser={user}
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

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          onLogin={(u) => {
            setUser(u);
            localStorage.setItem('firecontrol_user', JSON.stringify(u));
            setShowLoginModal(false);
            fetchData();
          }}
          onClose={() => setShowLoginModal(false)}
          onOpenPinSwitch={() => {
            setShowLoginModal(false);
            setShowPinSwitchModal(true);
          }}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
          onRefreshUser={verifySession}
        />
      )}

      {/* Quick PIN Switch Modal */}
      {showPinSwitchModal && (
        <QuickPinSwitchModal
          onClose={() => setShowPinSwitchModal(false)}
          onSwitchSuccess={(newUser) => {
            setUser(newUser);
            localStorage.setItem('firecontrol_user', JSON.stringify(newUser));
            setShowPinSwitchModal(false);
            fetchData();
          }}
        />
      )}

    </div>
  );
}
