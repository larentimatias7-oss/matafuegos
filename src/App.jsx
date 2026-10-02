import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ExtinguishersList from './components/ExtinguishersList';
import Scanner from './components/Scanner';
import InspectionForm from './components/InspectionForm';
import QrPrinter from './components/QrPrinter';
import InspectionHistory from './components/InspectionHistory';
import M365SyncModal from './components/M365SyncModal';
import ExtinguisherModal from './components/ExtinguisherModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [extinguishers, setExtinguishers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
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

  const handleSelectCode = async (code) => {
    try {
      const res = await fetch(`/api/extinguishers/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setInspectingExtinguisher(data.data);
        setActiveTab('scan');
      } else {
        alert(`No se encontró ningún matafuego con el código "${code}".`);
      }
    } catch (e) {
      alert(`Error al buscar matafuego: ${e.message}`);
    }
  };

  const handleExportExcel = () => {
    window.location.href = '/api/m365/export-excel';
  };

  const handleResetSeed = async () => {
    if (window.confirm('¿Querés reiniciar la base de datos con los 130 matafuegos de prueba con datos y fechas reales?')) {
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
    if (window.confirm('¿Estás seguro de eliminar este matafuego de la base de datos?')) {
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

  return (
    <div className="app-container">
      {/* Navbar with brand, tabs and fast actions */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'scan') setInspectingExtinguisher(null);
        }}
        onNewExtinguisher={() => setModalState({ open: true, mode: 'create', extinguisher: null })}
        stats={stats}
      />

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={stats}
            onNavigate={(tab) => setActiveTab(tab)}
            onExportExcel={handleExportExcel}
            onResetSeed={handleResetSeed}
            loading={loading}
          />
        )}

        {/* TAB 2: INVENTARIO EXTINTORES */}
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
            />
          ) : (
            <Scanner 
              extinguishers={extinguishers}
              onSelectCode={handleSelectCode}
            />
          )
        )}

        {/* TAB 4: IMPRESIÓN MASIVA DE QRS */}
        {activeTab === 'qrs' && (
          <QrPrinter />
        )}

        {/* TAB 5: HISTORIAL AUDITORÍA */}
        {activeTab === 'history' && (
          <InspectionHistory onExportExcel={handleExportExcel} />
        )}

        {/* TAB 6: MICROSOFT 365 INTEGRATION */}
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

    </div>
  );
}
