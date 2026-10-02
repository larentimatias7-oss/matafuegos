import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  QrCode, 
  Filter, 
  Download, 
  Flame, 
  Settings, 
  Check, 
  ExternalLink,
  Layers
} from 'lucide-react';

export default function QrPrinter() {
  const [qrs, setQrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);

  // Fetch settings to get configured base URL
  useEffect(() => {
    fetch('/api/m365/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings?.base_url) {
          setBaseUrl(data.settings.base_url);
        } else {
          setBaseUrl(window.location.origin);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch batch QRs
  const loadQrs = () => {
    setLoading(true);
    let url = '/api/qrs/batch';
    const params = [];
    if (selectedFloor) params.push(`floor=${encodeURIComponent(selectedFloor)}`);
    if (selectedArea) params.push(`area=${encodeURIComponent(selectedArea)}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setQrs(data.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQrs();
  }, [selectedFloor, selectedArea]);

  const handleSaveBaseUrl = async (e) => {
    e.preventDefault();
    setSavingUrl(true);
    try {
      await fetch('/api/m365/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_url: baseUrl.trim() })
      });
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 2000);
      loadQrs(); // regenerate with new URL
    } catch (e) {
      console.error(e);
    } finally {
      setSavingUrl(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Configuration & Print Actions (Hidden on print) */}
      <div className="glass-card no-print">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Printer size={22} color="#ef4444" />
              <span>Generador de Etiquetas QR para Impresión ({qrs.length})</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Diseño optimizado para imprimir en hojas adhesivas A4 o recortar. Cada etiqueta incluye código QR, identificación y ubicación.
            </p>
          </div>

          <button 
            onClick={handlePrint}
            className="btn btn-primary btn-lg"
          >
            <Printer size={18} />
            <span>Imprimir {qrs.length} Etiquetas</span>
          </button>
        </div>

        {/* Base URL configuration (critical for Dokploy / production domain) */}
        <form onSubmit={handleSaveBaseUrl} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
            URL Base para los Códigos QR:
          </span>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="input"
            style={{ maxWidth: '340px', padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
            placeholder="https://matafuegos.miempresa.com"
          />
          <button type="submit" disabled={savingUrl} className="btn btn-secondary btn-sm">
            {urlSaved ? <Check size={14} color="#10b981" /> : <Settings size={14} />}
            <span>{urlSaved ? 'Guardado' : 'Actualizar QRs'}</span>
          </button>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            (Poné el dominio de Dokploy o IP de tu red para que los celulares puedan abrir la app al escanear)
          </span>
        </form>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="#94a3b8" />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Filtrar por Nivel:</span>
          </div>
          <select 
            value={selectedFloor} 
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="select"
            style={{ maxWidth: '240px' }}
          >
            <option value="">Todos los Pisos (130 etiquetas)</option>
            <option value="Planta Baja">Planta Baja</option>
            <option value="Piso 1">Piso 1</option>
            <option value="Piso 2">Piso 2</option>
            <option value="Piso 3">Piso 3</option>
            <option value="Piso 4">Piso 4</option>
            <option value="Subsuelo">Subsuelo / Cochera</option>
            <option value="Exterior / Depósito">Depósito / Exterior</option>
          </select>
        </div>
      </div>

      {/* Labels Grid for Screen and Print */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#94a3b8' }}>Generando códigos QR de alta resolución...</p>
        </div>
      ) : (
        <div className="print-area">
          <div className="qr-label-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {qrs.map((item) => (
              <div 
                key={item.id} 
                className="qr-label-card"
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                {/* Header of the label */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  borderBottom: '2px solid #ea580c',
                  paddingBottom: '0.4rem',
                  marginBottom: '0.6rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <img src="/logo-milicic.svg" alt="Milicic" style={{ height: '18px', width: 'auto' }} onError={(e) => { e.target.src = '/logo-milicic.png'; }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em' }}>
                      CONTROL EXTINTOR
                    </span>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '1px 6px', borderRadius: '4px', border: '1px solid #fdba74' }}>
                    IRAM 3517-2
                  </span>
                </div>

                {/* QR Code image */}
                <div style={{
                  background: '#ffffff',
                  padding: '0.4rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  marginBottom: '0.6rem'
                }}>
                  <img 
                    src={item.qrDataUrl} 
                    alt={`QR ${item.code}`}
                    style={{ width: '150px', height: '150px', display: 'block' }}
                  />
                </div>

                {/* Code and Specs */}
                <div style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#0f172a',
                  letterSpacing: '0.02em',
                  lineHeight: 1.2
                }}>
                  {item.code}
                </div>

                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#2563eb',
                  marginBottom: '0.35rem'
                }}>
                  {item.type} • {item.capacity}
                </div>

                <div style={{
                  fontSize: '0.75rem',
                  color: '#334155',
                  fontWeight: 600,
                  maxWidth: '250px',
                  lineHeight: 1.3,
                  marginBottom: '0.5rem',
                  minHeight: '2rem'
                }}>
                  {item.location}
                </div>

                {/* Footer instructions */}
                <div style={{
                  borderTop: '1px dashed #cbd5e1',
                  width: '100%',
                  paddingTop: '0.4rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.65rem',
                  color: '#64748b'
                }}>
                  <span>Nivel: {item.floor || 'PB'}</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>Escanear para auditar</span>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
