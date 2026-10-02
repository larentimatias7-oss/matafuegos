import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  Search, 
  Flame, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Zap,
  ZapOff,
  Keyboard,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';

export default function Scanner({ extinguishers = [], onSelectCode }) {
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isSecure, setIsSecure] = useState(true);

  const scannerInstanceRef = useRef(null);
  const videoTrackRef = useRef(null);

  useEffect(() => {
    // Check if secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setIsSecure(false);
      setCameraError('La cámara requiere HTTPS. Por favor abrí la app desde una dirección segura (https://...)');
    }
  }, []);

  // Parse QR content
  const handleDecodedText = (decodedText) => {
    const raw = decodedText.trim();

    // Haptic feedback upon scan
    if (navigator.vibrate) {
      navigator.vibrate([60]);
    }

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

  const toggleTorch = async () => {
    if (videoTrackRef.current) {
      try {
        const next = !torchOn;
        await videoTrackRef.current.applyConstraints({
          advanced: [{ torch: next }]
        });
        setTorchOn(next);
      } catch (err) {
        console.warn('Torch toggle error:', err);
      }
    }
  };

  useEffect(() => {
    if (mode === 'camera' && isSecure) {
      let isMounted = true;

      const startScanner = async () => {
        try {
          setCameraError(null);
          const html5QrCode = new Html5Qrcode('qr-reader-container');
          scannerInstanceRef.current = html5QrCode;

          const config = {
            fps: 15,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0
          };

          await html5QrCode.start(
            { facingMode: { ideal: 'environment' } },
            config,
            (decodedText) => {
              if (isMounted) {
                html5QrCode.stop().then(() => {
                  handleDecodedText(decodedText);
                }).catch(() => {
                  handleDecodedText(decodedText);
                });
              }
            },
            () => {}
          );

          if (isMounted) {
            setIsScanning(true);

            // Detect torch support
            try {
              const videoElement = document.querySelector('#qr-reader-container video');
              if (videoElement && videoElement.srcObject) {
                const track = videoElement.srcObject.getVideoTracks()[0];
                videoTrackRef.current = track;
                const capabilities = track.getCapabilities ? track.getCapabilities() : {};
                if (capabilities.torch) {
                  setHasTorch(true);
                }
              }
            } catch (torchErr) {
              console.warn('Torch detection error:', torchErr);
            }
          }
        } catch (err) {
          console.warn('Camera start error:', err);
          if (isMounted) {
            setIsScanning(false);
            if (err.name === 'NotAllowedError' || err.toString().includes('Permission denied')) {
              setCameraError('Permiso de cámara denegado. Para habilitarlo: tocá el candado en la barra del navegador, seleccioná "Permisos del sitio" y activá la Cámara.');
            } else if (!window.isSecureContext) {
              setCameraError('La cámara requiere un contexto seguro (HTTPS). Abrí la aplicación desde una dirección HTTPS.');
            } else {
              setCameraError('No se pudo iniciar la cámara trasera. Asegurate de que no esté en uso por otra app o utilizá la selección manual abajo.');
            }
          }
        }
      };

      startScanner();

      return () => {
        isMounted = false;
        if (scannerInstanceRef.current) {
          scannerInstanceRef.current.stop().catch(() => {}).finally(() => {
            scannerInstanceRef.current.clear();
          });
        }
      };
    }
  }, [mode, isSecure]);

  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    if (manualCode.trim()) {
      handleDecodedText(manualCode.trim());
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* Top Banner */}
      <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Escanear Código QR
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
            Apuntá la cámara al extintor para abrir la ficha de control.
          </p>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-app)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
          <button
            onClick={() => setMode('camera')}
            className={`btn btn-sm ${mode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ minHeight: '34px', padding: '0.2rem 0.65rem', fontSize: '0.78rem' }}
          >
            <Camera size={14} />
            <span>Cámara</span>
          </button>

          <button
            onClick={() => setMode('manual')}
            className={`btn btn-sm ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ minHeight: '34px', padding: '0.2rem 0.65rem', fontSize: '0.78rem' }}
          >
            <Keyboard size={14} />
            <span>Manual</span>
          </button>
        </div>
      </div>

      {/* Security Context Warning */}
      {!isSecure && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--status-fault-bg)',
          border: '1.5px solid var(--status-fault-border)',
          color: 'var(--status-fault-text)',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            <ShieldAlert size={18} />
            <span>La cámara requiere HTTPS</span>
          </div>
          <p style={{ marginBottom: '0.65rem' }}>
            Los navegadores bloquean la cámara (getUserMedia) en conexiones HTTP no seguras. Abrí la app desde la dirección <strong>https://...</strong> o usá el túnel seguro para escanear con la cámara.
          </p>
          <button 
            onClick={() => setMode('manual')}
            className="btn btn-secondary btn-sm"
          >
            Usar Entrada Manual por Código
          </button>
        </div>
      )}

      {/* Mode 1: Camera Scanner */}
      {mode === 'camera' && isSecure && (
        <div className="card" style={{ padding: '0.5rem', position: 'relative', overflow: 'hidden' }}>
          
          {cameraError ? (
            <div style={{
              padding: '1.5rem 1rem',
              textAlign: 'center',
              color: 'var(--status-fault-text)',
              background: 'var(--status-fault-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--status-fault-border)'
            }}>
              <AlertCircle size={32} style={{ margin: '0 auto 0.65rem auto' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {cameraError}
              </p>
              <button 
                onClick={() => setMode('manual')} 
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.5rem' }}
              >
                <Keyboard size={15} />
                <span>Ingresar Código Manualmente</span>
              </button>
            </div>
          ) : (
            <div className="scanner-fullscreen-wrapper">
              {/* HTML5 QrCode Target */}
              <div 
                id="qr-reader-container" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  minHeight: '340px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }} 
              />

              {/* Reticle Overlay */}
              <div className="scanner-reticle-overlay">
                <div className="scanner-frame">
                  <div className="scanner-scan-line" />
                </div>
              </div>

              {/* Torch Button if available */}
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: torchOn ? 'var(--milicic-orange)' : 'rgba(0,0,0,0.6)',
                    color: '#ffffff',
                    border: '1.5px solid rgba(255,255,255,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                  title={torchOn ? 'Apagar linterna' : 'Encender linterna'}
                >
                  {torchOn ? <Zap size={20} /> : <ZapOff size={20} />}
                </button>
              )}

              {/* Footer instruction overlay */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                right: '12px',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                textAlign: 'center',
                backdropFilter: 'blur(4px)',
                zIndex: 10
              }}>
                Encuadre el código QR del extintor dentro del recuadro naranja
              </div>
            </div>
          )}

          {/* Quick Fallback Input Below Camera */}
          <div style={{ marginTop: '0.75rem', padding: '0.5rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 700 }}>
              ¿Problemas para escanear? Ingreso rápido por código:
            </div>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.4rem' }}>
              <input 
                type="text"
                placeholder="Ej: MF-014 o public_id"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="input"
                style={{ flex: 1, textTransform: 'uppercase' }}
              />
              <button type="submit" className="btn btn-secondary" style={{ flexShrink: 0 }}>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mode 2: Manual Selection View */}
      {mode === 'manual' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Selección Manual de Extintor
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Ingresá el código del extintor o elegilo de la lista para auditarlo:
          </p>

          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">Escribir Código (ej: MF-001 al MF-130)</label>
              <input 
                type="text"
                required
                placeholder="MF-XXX..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="input font-mono"
                style={{ textTransform: 'uppercase', fontSize: '1.1rem', fontWeight: 700 }}
              />
            </div>

            {extinguishers.length > 0 && (
              <div>
                <label className="label">O seleccionar del listado de la planta</label>
                <select 
                  onChange={(e) => {
                    if (e.target.value) handleDecodedText(e.target.value);
                  }}
                  className="select font-mono"
                  defaultValue=""
                >
                  <option value="" disabled>Seleccionar extintor...</option>
                  {extinguishers.map((ext) => (
                    <option key={ext.id} value={ext.code}>
                      {ext.code} - {ext.location} ({ext.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" style={{ minHeight: '48px', fontWeight: 800 }}>
              <ArrowRight size={18} />
              <span>Abrir Ficha de Inspección</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
