import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  Search, 
  Flame, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function Scanner({ extinguishers = [], onSelectCode }) {
  const [mode, setMode] = useState('camera'); // 'camera' or 'manual'
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const qrReaderRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  // Parse QR content (supports /m/:publicId, code=MF-XXX, or direct code)
  const handleDecodedText = (decodedText) => {
    const raw = decodedText.trim();

    // Check for short public URL /m/<publicId>
    const mMatch = raw.match(/\/m\/([a-zA-Z0-9_-]+)/);
    if (mMatch) {
      onSelectCode(mMatch[1]);
      return;
    }

    if (raw.includes('code=')) {
      try {
        const url = new URL(raw);
        const codeParam = url.searchParams.get('code');
        if (codeParam) {
          onSelectCode(codeParam.toUpperCase());
          return;
        }
      } catch (e) {
        const match = raw.match(/code=([A-Za-z0-9_-]+)/);
        if (match) {
          onSelectCode(match[1].toUpperCase());
          return;
        }
      }
    }

    onSelectCode(raw.toUpperCase());
  };

  useEffect(() => {
    if (mode === 'camera') {
      const startScanner = async () => {
        try {
          setCameraError(null);
          const html5QrCode = new Html5Qrcode('qr-reader-container');
          scannerInstanceRef.current = html5QrCode;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          };

          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              // On success
              html5QrCode.stop().then(() => {
                handleDecodedText(decodedText);
              }).catch(() => {
                handleDecodedText(decodedText);
              });
            },
            (errorMessage) => {
              // Ignore frame errors
            }
          );
          setIsScanning(true);
        } catch (err) {
          console.warn('Camera start error:', err);
          setCameraError('No se pudo acceder a la cámara o permisos denegados. Podés usar el selector manual abajo.');
          setIsScanning(false);
        }
      };

      startScanner();

      return () => {
        if (scannerInstanceRef.current) {
          scannerInstanceRef.current.stop().catch(() => {}).finally(() => {
            scannerInstanceRef.current.clear();
          });
        }
      };
    }
  }, [mode]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDecodedText(manualCode.trim());
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 0.75rem auto'
        }}>
          <Camera size={28} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
          Escanear Matafuego
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Apuntá con la cámara al código QR de la etiqueta del extintor para abrir la ficha de control mensual.
        </p>

        {/* Mode Switch Tabs */}
        <div style={{
          display: 'inline-flex',
          background: '#0f172a',
          padding: '0.25rem',
          borderRadius: '8px',
          marginTop: '1rem',
          border: '1px solid rgba(148, 163, 184, 0.15)'
        }}>
          <button
            onClick={() => setMode('camera')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'camera' ? '#ef4444' : 'transparent',
              color: mode === 'camera' ? '#fff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            📷 Cámara en Vivo
          </button>
          <button
            onClick={() => setMode('manual')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'manual' ? '#ef4444' : 'transparent',
              color: mode === 'manual' ? '#fff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            ⌨️ Selección Manual
          </button>
        </div>
      </div>

      {/* Camera Scanner View */}
      {mode === 'camera' && (
        <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
          {cameraError ? (
            <div style={{
              padding: '1.25rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={24} style={{ margin: '0 auto 0.5rem auto' }} />
              <p>{cameraError}</p>
              <button 
                onClick={() => setMode('manual')} 
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.75rem' }}
              >
                Cambiar a Entrada Manual
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
              <div 
                id="qr-reader-container" 
                style={{ 
                  width: '100%', 
                  minHeight: '280px',
                  background: '#000',
                  borderRadius: '12px'
                }} 
              />
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                Centrá el código QR dentro del recuadro para detectar automáticamente.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Selection View */}
      {(mode === 'manual' || cameraError) && (
        <div className="glass-card">
          <form onSubmit={handleManualSubmit}>
            <label className="label">Seleccionar Matafuego por Código o Ubicación</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <select
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="select"
                style={{ flex: 1 }}
              >
                <option value="">-- Elegir un matafuego de la lista --</option>
                {extinguishers.map((ext) => (
                  <option key={ext.id} value={ext.code}>
                    {ext.code} - {ext.location} ({ext.type} {ext.capacity})
                  </option>
                ))}
              </select>
              <button type="submit" disabled={!manualCode} className="btn btn-primary">
                Inspeccionar
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <label className="label">O escribir el código directamente</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Ej: MF-001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  className="input font-mono"
                  style={{ textTransform: 'uppercase' }}
                />
                <button type="submit" disabled={!manualCode} className="btn btn-secondary">
                  Abrir
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Quick Tips for Inspector */}
      <div style={{
        padding: '1rem',
        borderRadius: '8px',
        background: 'rgba(37, 99, 235, 0.08)',
        border: '1px solid rgba(37, 99, 235, 0.2)',
        fontSize: '0.8rem',
        color: '#93c5fd',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start'
      }}>
        <Sparkles size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ display: 'block', marginBottom: '0.2rem', color: '#bfdbfe' }}>
            Ronda Rápida de Inspección:
          </strong>
          Pegá las etiquetas QR generadas en la parte frontal o soporte de cada matafuego. Al escanearlo, el formulario te permite pulsar <strong>"Todo OK"</strong> en un solo toque, registrando el control en menos de 10 segundos.
        </div>
      </div>

    </div>
  );
}
