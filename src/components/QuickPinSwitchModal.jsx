import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  DeviceMobile, 
  Backspace, 
  Check, 
  WarningCircle, 
  ArrowsClockwise,
  Info,
  WifiSlash
} from '@phosphor-icons/react';

async function computeSha256(message) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return null;
}

export default function QuickPinSwitchModal({ onClose, onSwitchSuccess }) {
  const [users, setUsers] = useState(() => {
    try {
      const cached = localStorage.getItem('firecontrol_pin_operators');
      return cached ? JSON.parse(cached) : [];
    } catch (_e) {
      return [];
    }
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(() => {
    return !localStorage.getItem('firecontrol_pin_operators');
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchInspectors = async () => {
    try {
      setError(null);

      // Si estamos offline, usar directamente los colaboradores en memoria local
      if (!navigator.onLine) {
        const cached = localStorage.getItem('firecontrol_pin_operators');
        if (cached) {
          setUsers(JSON.parse(cached));
          setLoadingUsers(false);
          return;
        }
      }

      // Intentar primero con el endpoint público de operadores de turno
      let res = await fetch('/api/auth/pin-operators');
      if (!res.ok) {
        // Fallback a /api/users si tiene permisos
        res = await fetch('/api/users?activo=1');
      }
      const data = await res.json().catch(() => ({}));
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
        localStorage.setItem('firecontrol_pin_operators', JSON.stringify(data.data));
      } else {
        const cached = localStorage.getItem('firecontrol_pin_operators');
        if (cached) {
          setUsers(JSON.parse(cached));
        } else {
          setError('No se pudo obtener la lista de colaboradores.');
        }
      }
    } catch (e) {
      console.warn('Error fetching inspectors (usando caché local):', e);
      const cached = localStorage.getItem('firecontrol_pin_operators');
      if (cached) {
        setUsers(JSON.parse(cached));
      } else {
        setError('Error de conexión al cargar colaboradores.');
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchInspectors();
  }, []);

  const handleDigit = useCallback((digit) => {
    if (!selectedUser) {
      setError('Seleccione primero su nombre en la lista de colaboradores');
      return;
    }
    if (selectedUser.has_pin === 0) {
      setError('Este colaborador no tiene PIN configurado. Ingrese con contraseña para asignarlo.');
      return;
    }
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setError(null);
    }
  }, [pin, selectedUser]);

  const handleDeleteDigit = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedUser) {
      setError('Seleccione su nombre en la lista de colaboradores');
      return;
    }
    if (selectedUser.has_pin === 0) {
      setError('Este usuario no tiene PIN asignado. Ingrese inicialmente con contraseña para crear su PIN.');
      return;
    }
    if (pin.length < 4) {
      setError('El PIN debe tener entre 4 y 6 números');
      return;
    }

    const verifyOffline = async () => {
      if (selectedUser.offline_pin_hash) {
        const computed = await computeSha256('milicic_fc365_offline_salt:' + selectedUser.id + ':' + pin.trim());
        if (computed && computed === selectedUser.offline_pin_hash) {
          const offlineUser = {
            id: selectedUser.id,
            name: `${selectedUser.nombre} ${selectedUser.apellido}`.trim(),
            nombre: selectedUser.nombre,
            apellido: selectedUser.apellido,
            email: selectedUser.email,
            role: selectedUser.rol,
            rol: selectedUser.rol,
            tenant: 'Milicic S.A.',
            organizacion_id: 1,
            isGlobalScope: true,
            sectores: []
          };
          onSwitchSuccess(offlineUser);
          return true;
        } else {
          setError('PIN incorrecto (verificación local en dispositivo).');
          setPin('');
          return false;
        }
      } else {
        setError('Sin conexión para validar este colaborador. Inicie sesión una vez con red para descargar credenciales de campo.');
        setPin('');
        return false;
      }
    };

    if (!navigator.onLine) {
      setSubmitting(true);
      setError(null);
      try {
        await verifyOffline();
      } catch (errOffline) {
        setError('Error en validación offline: ' + errOffline.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/auth/pin-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: selectedUser.id, pin })
      });
      const data = await res.json().catch(() => ({}));
      if (data.offline || res.status === 503) {
        await verifyOffline();
        return;
      }
      if (data.success) {
        onSwitchSuccess(data.user);
      } else {
        setError(data.error || 'PIN incorrecto');
        setPin('');
      }
    } catch (err) {
      console.warn('Error en red durante pin-switch, intentando validación local:', err);
      const ok = await verifyOffline();
      if (!ok && !error) {
        setError(err.message || 'Error al validar el PIN');
        setPin('');
      }
    } finally {
      setSubmitting(false);
    }
  }, [selectedUser, pin, onSwitchSuccess, error]);

  // Soporte para teclado físico de computadora o tablet
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar si el usuario está interactuando con el select
      if (e.target.tagName === 'SELECT') return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteDigit();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDeleteDigit, handleSubmit, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', textAlign: 'center', padding: '1.5rem', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <DeviceMobile size={22} color="var(--milicic-orange)" weight="bold" />
            <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', margin: 0 }}>
              Cambio Rápido de Inspector
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.4rem' }} aria-label="Cerrar">
            <X size={16} weight="bold" />
          </button>
        </div>

        {!navigator.onLine && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--status-pending-bg, #fef3c7)',
            color: 'var(--status-pending-text, #92400e)',
            padding: '0.3rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.74rem',
            fontWeight: 700,
            marginBottom: '0.85rem'
          }}>
            <WifiSlash size={14} weight="bold" />
            <span>Modo Sin Conexión • Validación en Dispositivo</span>
          </div>
        )}

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Seleccione su usuario e ingrese su PIN de 4-6 dígitos para operar en este dispositivo compartido:
        </div>

        {error && (
          <div style={{
            padding: '0.5rem 0.75rem',
            background: 'var(--status-fault-bg)',
            color: 'var(--status-fault-text)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            lineHeight: 1.35
          }}>
            <WarningCircle size={18} weight="bold" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* User Picker */}
        <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
          <label className="form-label" htmlFor="user-select" style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)' }}>
            Colaborador en Turno *
          </label>
          {loadingUsers ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0' }}>
              <ArrowsClockwise size={16} className="animate-spin" />
              <span>Cargando colaboradores disponibles...</span>
            </div>
          ) : (
            <select
              id="user-select"
              className="form-control"
              value={selectedUser?.id || ''}
              onChange={(e) => {
                const found = users.find(u => u.id === e.target.value);
                setSelectedUser(found || null);
                setPin('');
                setError(null);
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              <option value="">-- Seleccione su nombre --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido} ({u.rol}){u.has_pin === 0 ? ' • [Sin PIN]' : ''}
                </option>
              ))}
            </select>
          )}

          {selectedUser && selectedUser.has_pin === 0 && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.45rem 0.65rem',
              background: 'var(--status-pending-bg, #fef3c7)',
              color: 'var(--status-pending-text, #92400e)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <Info size={16} weight="bold" style={{ flexShrink: 0 }} />
              <span>Este colaborador no tiene PIN configurado. Ingrese con contraseña para definirlo en su perfil.</span>
            </div>
          )}
        </div>

        {/* PIN Dots Display */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          margin: '1.25rem 0'
        }}>
          {[0, 1, 2, 3, 4, 5].map(idx => (
            <div
              key={idx}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '2px solid var(--milicic-orange)',
                background: pin.length > idx ? 'var(--milicic-orange)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            />
          ))}
        </div>

        {/* Keypad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          maxWidth: '280px',
          margin: '0 auto 1.25rem auto'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(String(num))}
              className="btn btn-secondary"
              style={{
                height: '52px',
                fontSize: '1.3rem',
                fontWeight: 800,
                borderRadius: 'var(--radius-md)'
              }}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDeleteDigit}
            className="btn btn-secondary"
            style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Borrar dígito"
            aria-label="Borrar dígito"
          >
            <Backspace size={20} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="btn btn-secondary"
            style={{
              height: '52px',
              fontSize: '1.3rem',
              fontWeight: 800,
              borderRadius: 'var(--radius-md)'
            }}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary"
            style={{
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (!selectedUser || pin.length < 4 || selectedUser.has_pin === 0) ? 0.5 : 1
            }}
            title="Confirmar ingreso con PIN"
            aria-label="Confirmar ingreso con PIN"
          >
            {submitting ? <ArrowsClockwise size={20} className="animate-spin" /> : <Check size={22} weight="bold" />}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}
