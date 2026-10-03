import React, { useState, useEffect } from 'react';
import { 
  X, 
  DeviceMobile, 
  Key, 
  Backspace, 
  Check, 
  WarningCircle, 
  ArrowsClockwise,
  UserCheck
} from '@phosphor-icons/react';

export default function QuickPinSwitchModal({ onClose, onSwitchSuccess }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchInspectors = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('/api/users?activo=1');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (e) {
      console.warn('Error fetching inspectors:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchInspectors();
  }, []);

  const handleDigit = (digit) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setError(null);
    }
  };

  const handleDeleteDigit = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      setError('Seleccione un colaborador');
      return;
    }
    if (pin.length < 4) {
      setError('El PIN debe tener al menos 4 números');
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
      const data = await res.json();
      if (data.success) {
        onSwitchSuccess(data.user);
      } else {
        setError(data.error || 'PIN incorrecto');
        setPin('');
      }
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', textAlign: 'center', padding: '1.5rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <DeviceMobile size={22} color="var(--milicic-orange)" weight="bold" />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Cambio Rápido de Operador
            </span>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.4rem' }}>
            <X size={16} weight="bold" />
          </button>
        </div>

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
            gap: '0.4rem'
          }}>
            <WarningCircle size={16} weight="bold" />
            <span>{error}</span>
          </div>
        )}

        {/* User Picker */}
        <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
          <label className="form-label" htmlFor="user-select">Colaborador en Turno *</label>
          {loadingUsers ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Cargando usuarios...</div>
          ) : (
            <select
              id="user-select"
              className="form-control"
              value={selectedUser?.id || ''}
              onChange={(e) => {
                const found = users.find(u => u.id === e.target.value);
                setSelectedUser(found || null);
                setError(null);
              }}
            >
              <option value="">-- Seleccione su nombre --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido} ({u.rol})
                </option>
              ))}
            </select>
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
            title="Borrar"
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
            disabled={submitting || pin.length < 4 || !selectedUser}
            className="btn btn-primary"
            style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Confirmar"
          >
            {submitting ? <ArrowsClockwise size={20} className="animate-spin" /> : <Check size={22} weight="bold" />}
          </button>
        </div>

      </div>
    </div>
  );
}
