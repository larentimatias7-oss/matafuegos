import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  QrCode, 
  Funnel, 
  Gear, 
  Check, 
  Stack, 
  FileText,
  Tag,
  MagnifyingGlass
} from '@phosphor-icons/react';

export default function QrPrinter() {
  const [qrs, setQrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [labelFormat, setLabelFormat] = useState('grid_a4'); // 'grid_a4' | 'single_tag'
  const [singleCodeSearch, setSingleCodeSearch] = useState('');
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);

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
      .catch(console.error)
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
      loadQrs();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingUrl(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const displayedQrs = singleCodeSearch 
    ? qrs.filter(q => q.code.toLowerCase().includes(singleCodeSearch.toLowerCase()) || q.location.toLowerCase().includes(singleCodeSearch.toLowerCase()))
    : qrs;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Mobile Friendly Notice */}
      <div className="mobile-only no-print" style={{
        background: 'var(--milicic-orange-soft)',
        border: '1.5px solid var(--milicic-orange-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1rem',
        color: 'var(--milicic-slate-dark)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.9rem', color: 'var(--milicic-orange-dark)', marginBottom: '0.25rem' }}>
          <Printer size={18} />
          <span>Aviso sobre Impresión de Etiquetas</span>
        </div>
        <p style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.4, color: 'var(--text-body)' }}>
          Esta función está pensada para usar desde una computadora conectada a una impresora láser para hojas A4. Podés previsualizar las etiquetas desde tu celular, pero te recomendamos imprimir desde el escritorio.
        </p>
      </div>

      {/* Controls & Configuration */}
      <div className="card no-print">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 className="card-title">
              Generador de Etiquetas QR (Norma IRAM 3517-2)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Códigos QR Nivel H con alta tolerancia a suciedad, legibles a 5 cm y 30 cm de distancia.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={handlePrint}
              className="btn btn-primary"
            >
              <Printer size={18} />
              <span>Imprimir {displayedQrs.length} Etiquetas</span>
            </button>
          </div>
        </div>

        {/* Format Selector & Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1rem'
        }}>
          <div>
            <label className="label">Formato de Impresión</label>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setLabelFormat('grid_a4')}
                className={`btn btn-sm ${labelFormat === 'grid_a4' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                <Stack size={14} weight="bold" aria-hidden="true" />
                <span>Grilla A4 (12 por hoja)</span>
              </button>
              <button
                type="button"
                onClick={() => setLabelFormat('single_tag')}
                className={`btn btn-sm ${labelFormat === 'single_tag' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                <Tag size={14} />
                <span>Etiqueta 70x40 mm</span>
              </button>
            </div>
          </div>

          <div>
            <label className="label">Filtrar por Nivel / Piso</label>
            <select 
              value={selectedFloor} 
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="select"
              style={{ minHeight: '38px' }}
            >
              <option value="">Todos los Pisos</option>
              <option value="Planta Baja">Planta Baja</option>
              <option value="Piso 1">Piso 1</option>
              <option value="Piso 2">Piso 2</option>
              <option value="Piso 3">Piso 3</option>
              <option value="Piso 4">Piso 4</option>
              <option value="Subsuelo">Subsuelo / Cochera</option>
              <option value="Exterior / Depósito">Depósito / Obra</option>
            </select>
          </div>

          <div>
            <label className="label">Reimprimir 1 Extintor (Buscador)</label>
            <div style={{ position: 'relative' }}>
              <MagnifyingGlass size={16} weight="bold" color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} aria-hidden="true" />
              <input
                type="text"
                placeholder="Ej: MF-025..."
                value={singleCodeSearch}
                onChange={e => setSingleCodeSearch(e.target.value)}
                className="input"
                style={{ paddingLeft: '2.2rem', minHeight: '38px' }}
              />
            </div>
          </div>
        </div>

        {/* Base URL configuration */}
        <form onSubmit={handleSaveBaseUrl} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            URL Base para QR:
          </span>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="input"
            style={{ maxWidth: '380px', minHeight: '36px', fontSize: '0.85rem' }}
            placeholder="https://matafuegos.milicic.com.ar"
          />
          <button type="submit" disabled={savingUrl} className="btn btn-secondary btn-sm">
            {urlSaved ? <Check size={14} weight="bold" color="var(--status-ok-text)" aria-hidden="true" /> : <Gear size={14} weight="bold" aria-hidden="true" />}
            <span>{urlSaved ? 'Guardado' : 'Actualizar Dominio'}</span>
          </button>
        </form>
      </div>

      {/* Printable Labels Container */}
      {loading ? (
        <div className="card skeleton" style={{ height: '300px' }} />
      ) : (
        <div className="print-area">
          {labelFormat === 'grid_a4' ? (
            /* FORMATO 1: GRILLA A4 */
            <div className="qr-label-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px'
            }}>
              {displayedQrs.map((item) => (
                <div 
                  key={item.id} 
                  className="qr-label-card"
                  style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                >
                  {/* Header with Milicic Logo */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    borderBottom: '2px solid #ea580c',
                    paddingBottom: '0.35rem',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <img src="/logo-milicic.svg" alt="Milicic" style={{ height: '18px', width: 'auto' }} onError={(e) => { e.target.src = '/logo-milicic.png'; }} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0f172a' }}>
                        CONTROL EXTINTOR
                      </span>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#ea580c', background: '#fff7ed', padding: '1px 5px', borderRadius: '3px' }}>
                      IRAM 3517-2
                    </span>
                  </div>

                  {/* QR Image (Level H) */}
                  <div style={{
                    background: '#ffffff',
                    padding: '4px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    marginBottom: '0.5rem'
                  }}>
                    <img 
                      src={item.qrDataUrl} 
                      alt={`QR ${item.code}`}
                      style={{ width: '140px', height: '140px', display: 'block' }}
                    />
                  </div>

                  {/* Code */}
                  <div className="font-mono" style={{
                    fontSize: '1.45rem',
                    fontWeight: 900,
                    color: '#0f172a',
                    lineHeight: 1.1
                  }}>
                    {item.code}
                  </div>

                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ea580c', marginBottom: '0.2rem' }}>
                    {item.type} • {item.capacity}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#334155', fontWeight: 600, minHeight: '1.8rem', lineHeight: 1.25 }}>
                    {item.location}
                  </div>

                  <div style={{
                    borderTop: '1px dashed #cbd5e1',
                    width: '100%',
                    paddingTop: '0.35rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.65rem',
                    color: '#64748b'
                  }}>
                    <span>{item.floor}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>id: {item.public_id}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* FORMATO 2: ETIQUETA INDIVIDUAL 70x40 mm CON CÓDIGO EN GRANDE AL LADO */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '12px'
            }}>
              {displayedQrs.map((item) => (
                <div 
                  key={item.id} 
                  className="qr-label-card"
                  style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    border: '2px solid #000000',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                >
                  {/* Left: QR Code */}
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <img 
                      src={item.qrDataUrl} 
                      alt={`QR ${item.code}`}
                      style={{ width: '110px', height: '110px', display: 'block' }}
                    />
                    <span style={{ fontSize: '0.62rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                      id: {item.public_id}
                    </span>
                  </div>

                  {/* Right: Big Code, Location, Logo */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <img src="/logo-milicic.svg" alt="Milicic" style={{ height: '16px', width: 'auto' }} onError={(e) => { e.target.src = '/logo-milicic.png'; }} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ea580c' }}>IRAM 3517-2</span>
                    </div>

                    <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                      {item.code}
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ea580c' }}>
                      {item.type} {item.capacity}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600, lineHeight: 1.2 }}>
                      {item.location}
                    </div>

                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      Nivel: {item.floor} • Sector: {item.area || 'General'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
