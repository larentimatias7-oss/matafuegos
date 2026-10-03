import React, { useState } from 'react';
import { 
  Lock, 
  Envelope, 
  Key, 
  MicrosoftOutlookLogo, 
  DeviceMobile, 
  ArrowRight, 
  WarningCircle, 
  ArrowsClockwise, 
  X
} from '@phosphor-icons/react';

export default function LoginModal({ onLogin, onClose, onOpenPinSwitch }) {
  const [useLocal, setUseLocal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEntraLogin = () => {
    window.location.href = '/api/auth/entra/login';
  };

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Credenciales inválidas o cuenta bloqueada');
      }

      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1200 }}>
      <div 
        className="modal-content"
        style={{ maxWidth: '440px', width: '100%', padding: '2rem 1.5rem', textAlign: 'center', position: 'relative' }}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ position: 'absolute', right: '1rem', top: '1rem', width: '32px', height: '32px', padding: 0 }}
            aria-label="Cerrar ventana"
          >
            <X size={16} weight="bold" />
          </button>
        )}

        {/* Milicic Logo */}
        <div style={{
          background: '#ffffff',
          display: 'inline-flex',
          padding: '6px 16px',
          borderRadius: '8px',
          marginBottom: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <img 
            src="/logo-milicic.svg" 
            alt="Milicic S.A." 
            style={{ height: '36px', width: 'auto' }} 
            onError={(e) => { e.target.src = '/logo-milicic.png'; }} 
          />
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          FireControl 365
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Sistema de Inspección Periódica de Matafuegos • Milicic S.A.
        </p>

        {error && (
          <div style={{
            padding: '0.65rem 0.85rem',
            background: 'var(--status-fault-bg)',
            color: 'var(--status-fault-text)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <WarningCircle size={18} weight="bold" />
            <span>{error}</span>
          </div>
        )}

        {/* Option 1: Microsoft 365 Entra ID (Primary) */}
        <button
          onClick={handleEntraLogin}
          className="btn btn-full"
          style={{
            background: '#0078d4',
            color: '#ffffff',
            minHeight: '48px',
            fontSize: '0.92rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            boxShadow: '0 4px 10px rgba(0, 120, 212, 0.25)',
            marginBottom: '0.85rem'
          }}
        >
          <MicrosoftOutlookLogo size={20} weight="bold" aria-hidden="true" />
          <span>Ingresar con Microsoft 365</span>
        </button>

        {/* Option 2: Shared device PIN switch */}
        {onOpenPinSwitch && (
          <button
            onClick={onOpenPinSwitch}
            className="btn btn-secondary btn-full"
            style={{
              minHeight: '44px',
              fontSize: '0.86rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}
          >
            <DeviceMobile size={18} color="var(--milicic-orange)" weight="bold" aria-hidden="true" />
            <span>Cambio rápido en dispositivo compartido (PIN)</span>
          </button>
        )}

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          margin: '1.25rem 0 1rem 0',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span>O acceso secundario</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {!useLocal ? (
          <button
            onClick={() => setUseLocal(true)}
            className="btn btn-secondary btn-full"
            style={{ fontSize: '0.82rem' }}
          >
            <Key size={16} />
            <span>Usar cuenta local con contraseña</span>
          </button>
        ) : (
          /* Option 3: Local Account Form */
          <form onSubmit={handleLocalLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
            <div>
              <label className="form-label" htmlFor="login-email">Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-email"
                  type="email"
                  required
                  className="form-control"
                  style={{ paddingLeft: '2.25rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@milicic.com.ar"
                />
                <Envelope size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="login-pass">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-pass"
                  type="password"
                  required
                  className="form-control"
                  style={{ paddingLeft: '2.25rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese contraseña"
                />
                <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full"
              style={{ minHeight: '46px', fontWeight: 700, marginTop: '0.35rem' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <ArrowsClockwise size={18} className="animate-spin" />
                  <span>Validando credenciales...</span>
                </span>
              ) : (
                <span>Ingresar al Sistema</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setUseLocal(false); setError(null); }}
              className="btn btn-secondary btn-full"
              style={{ fontSize: '0.78rem' }}
            >
              Volver a opciones principales
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
