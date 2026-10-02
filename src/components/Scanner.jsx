import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  MagnifyingGlass, 
  FireExtinguisher, 
  WarningCircle, 
  CheckCircle, 
  ArrowsClockwise, 
  Lightning, 
  LightningSlash, 
  Keyboard, 
  ShieldWarning, 
  ArrowRight, 
  Info 
} from '@phosphor-icons/react';

export default function Scanner({ extinguishers = [], onSelectCode }) {
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'
  const [manualCode, setManualCode] = useState('');
  const [isSecure, setIsSecure] = useState(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return false;
    }
    return true;
  });
  const [cameraError, setCameraError] = useState(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'La cámara requiere HTTPS. Por favor abrí la app desde una dirección segura (https://...)';
    }
    return null;
  });
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const scannerInstanceRef = useRef(null);
  const videoTrackRef = useRef(null);
  const isStartingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const hasStoppedRef = useRef(false);

  // Parse QR content
  const handleDecodedText = (decodedText) => {
    if (isProcessingRef.current) return;
    const raw = (decodedText || '').trim();
    if (!raw) return;

    isProcessingRef.current = true;
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 2000);

    // Haptic feedback upon scan (safe guarded)
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([60]);
      }
    } catch (_vErr) {
      // Ignore vibration error if blocked by browser policy
    }

    // 1. Check for short public URL /m/<publicId>
    const mMatch = raw.match(/\/m\/([a-zA-Z0-9_-]+)/i);
    if (mMatch) {
      onSelectCode(mMatch[1]);
      return;
    }

    // 2. Check for code= parameter
    if (raw.includes('code=')) {
      try {
        const url = new URL(raw);
        const codeParam = url.searchParams.get('code');
        if (codeParam) {
          onSelectCode(codeParam.toUpperCase());
          return;
        }
      } catch (_e) {
        const match = raw.match(/code=([A-Za-z0-9_-]+)/i);
        if (match) {
          onSelectCode(match[1].toUpperCase());
          return;
        }
      }
    }

    // 3. Check for standalone or embedded MF-XXX pattern
    const mfMatch = raw.match(/(MF-\d{3,})/i);
    if (mfMatch) {
      onSelectCode(mfMatch[1].toUpperCase());
      return;
    }

    // 4. Check for hexadecimal public_id (12 to 24 chars)
    const hexMatch = raw.match(/\b([a-fA-F0-9]{12,24})\b/);
    if (hexMatch) {
      onSelectCode(hexMatch[1].toLowerCase());
      return;
    }

    // 5. Fallback clean string
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
    if (mode !== 'camera' || !isSecure) return;

    let isMounted = true;

    const startScanner = async () => {
      await new Promise(resolve => setTimeout(resolve, 80));
      if (!isMounted) return;

      const container = document.getElementById('qr-reader-container');
      if (!container) {
        console.warn('qr-reader-container not found in DOM');
        return;
      }

      if (isStartingRef.current) return;
      isStartingRef.current = true;

      try {
        setCameraError(null);

        if (scannerInstanceRef.current) {
          try {
            if (scannerInstanceRef.current.isScanning) {
              await scannerInstanceRef.current.stop();
            }
            scannerInstanceRef.current.clear();
          } catch (cleanErr) {
            console.warn('Previous scanner cleanup:', cleanErr);
          }
          scannerInstanceRef.current = null;
        }

        const html5QrCode = new Html5Qrcode('qr-reader-container');
        scannerInstanceRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.max(180, Math.floor(minEdge * 0.72));
            return { width: qrboxSize, height: qrboxSize };
          }
        };

        const onScanSuccess = async (decodedText) => {
          if (!isMounted || hasStoppedRef.current) return;
          hasStoppedRef.current = true;

          try {
            if (html5QrCode && html5QrCode.isScanning) {
              await html5QrCode.stop();
            }
          } catch (stopErr) {
            console.warn('html5QrCode stop error ignored:', stopErr);
          }

          try {
            if (html5QrCode) {
              html5QrCode.clear();
            }
          } catch (_clearErr) {
            // Container may already be removed by React unmount
          }

          if (isMounted) {
            handleDecodedText(decodedText);
          }
        };

        const onScanError = () => {};

        let cameraParam = { facingMode: "environment" };
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            const rearCam = devices.find(d => /back|rear|trasera|trasero|environment|exterior/i.test(d.label)) || devices[devices.length - 1];
            if (rearCam && rearCam.id) {
              cameraParam = rearCam.id;
            }
          }
        } catch (deviceErr) {
          console.warn('getCameras error, using default facingMode:', deviceErr);
          cameraParam = { facingMode: "environment" };
        }

        try {
          await html5QrCode.start(cameraParam, config, onScanSuccess, onScanError);
        } catch (firstErr) {
          console.warn('Primary camera start failed, attempting fallback:', firstErr);
          await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, onScanError);
        }

        if (isMounted) {
          hasStoppedRef.current = false;
          setIsScanning(true);

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
          const rawMsg = err?.message || String(err);
          if (err.name === 'NotAllowedError' || /permission|denied|allowed/i.test(rawMsg)) {
            setCameraError('Permiso de cámara denegado. Tocá el candado en la barra de direcciones de tu navegador y permití el acceso a la Cámara.');
          } else if (/not found|notfound|no camera/i.test(rawMsg) || err.name === 'NotFoundError') {
            setCameraError('No se encontró ninguna cámara disponible en este dispositivo.');
          } else if (/notreadable|trackstart|in use/i.test(rawMsg) || err.name === 'NotReadableError') {
            setCameraError('La cámara está siendo utilizada por otra aplicación o pestaña. Por favor cerrala e intentá nuevamente.');
          } else if (!window.isSecureContext) {
            setCameraError('La cámara requiere un contexto seguro (HTTPS). Abrí la aplicación desde una dirección HTTPS.');
          } else {
            setCameraError(`No se pudo iniciar la cámara trasera (${rawMsg}). Podés reintentar o usar la selección manual.`);
          }
        }
      } finally {
        isStartingRef.current = false;
      }
    };

    hasStoppedRef.current = false;
    startScanner();

    return () => {
      isMounted = false;
      const scanner = scannerInstanceRef.current;
      scannerInstanceRef.current = null;
      if (scanner && !hasStoppedRef.current) {
        hasStoppedRef.current = true;
        try {
          if (scanner.isScanning) {
            scanner.stop()
              .catch(err => console.warn('Cleanup stop error ignored:', err))
              .finally(() => {
                try {
                  scanner.clear();
                } catch (_cErr) {
                  // Container may already be removed by React unmount
                }
              });
          } else {
            try {
              scanner.clear();
            } catch (_cErr) {
              // Container may already be removed by React unmount
            }
          }
        } catch (err) {
          console.warn('Cleanup scanner error ignored:', err);
        }
      }
    };
  }, [mode, isSecure, retryCount]);

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
            <Camera size={15} weight="bold" aria-hidden="true" />
            <span>Cámara</span>
          </button>

          <button
            onClick={() => setMode('manual')}
            className={`btn btn-sm ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ minHeight: '34px', padding: '0.2rem 0.65rem', fontSize: '0.78rem' }}
          >
            <Keyboard size={15} weight="bold" aria-hidden="true" />
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
            <ShieldWarning size={18} weight="bold" aria-hidden="true" />
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
          
          {/* Always mounted container to prevent element not found errors */}
          <div 
            className="scanner-fullscreen-wrapper" 
            style={{ display: cameraError ? 'none' : 'flex' }}
          >
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

            {/* Reticle Overlay with Industrial Milicic Style */}
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
                aria-label={torchOn ? 'Apagar linterna' : 'Encender linterna'}
              >
                {torchOn ? <Lightning size={20} weight="fill" aria-hidden="true" /> : <LightningSlash size={20} weight="bold" aria-hidden="true" />}
              </button>
            )}

            {/* Footer instruction overlay */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              background: 'rgba(15, 23, 42, 0.85)',
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

          {/* Camera Error Message Box */}
          {cameraError && (
            <div style={{
              padding: '1.75rem 1.25rem',
              textAlign: 'center',
              color: 'var(--status-fault-text)',
              background: 'var(--status-fault-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--status-fault-border)'
            }}>
              <WarningCircle size={36} weight="bold" style={{ margin: '0 auto 0.65rem auto' }} aria-hidden="true" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--status-fault-text)' }}>
                No se pudo activar la cámara
              </h3>
              <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '1.25rem', lineHeight: 1.4 }}>
                {cameraError}
              </p>
              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setCameraError(null);
                    setRetryCount(c => c + 1);
                  }} 
                  className="btn btn-secondary"
                  style={{ minHeight: '44px', fontWeight: 800 }}
                >
                  <ArrowsClockwise size={16} weight="bold" aria-hidden="true" />
                  <span>Reintentar Cámara</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setMode('manual')} 
                  className="btn btn-primary"
                  style={{ minHeight: '44px', fontWeight: 800 }}
                >
                  <Keyboard size={16} weight="bold" aria-hidden="true" />
                  <span>Ingresar Código</span>
                </button>
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
              <button type="submit" className="btn btn-secondary" style={{ flexShrink: 0 }} aria-label="Buscar código">
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
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
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
              <span>Abrir Ficha de Inspección</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
