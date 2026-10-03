import React, { useState } from 'react';
import { 
  Lock, 
  Envelope, 
  Key, 
  MicrosoftOutlookLogo, 
  DeviceMobile, 
  WarningCircle, 
  ArrowsClockwise, 
  X,
  ShieldCheck
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
        throw new Error(data.error || 'Credenciales inválidas o cuenta temporalmente bloqueada');
      }

      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      style={{ 
        background: 'rgba(15, 23, 42, 0.75)', 
        backdropFilter: 'blur(6px)', 
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        className="modal-content"
        style={{ 
          maxWidth: '440px', 
          width: '100%', 
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.45), 0 0 0 1px var(--border-color)',
          textAlign: 'center', 
          position: 'relative',
          overflow: 'hidden',
          padding: '0'
        }}
      >
        {/* Top Decorative Milicic Orange Bar */}
        <div style={{
          height: '6px',
          width: '100%',
          background: 'linear-gradient(90deg, #ea580c 0%, #f97316 100%)'
        }} />

        <div style={{ padding: '2rem 1.75rem 1.75rem 1.75rem' }}>
          {/* Close button only if onClose is allowed (e.g. user already logged in) */}
          {onClose && (
            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ 
                position: 'absolute', 
                right: '1rem', 
                top: '1rem', 
                width: '32px', 
                height: '32px', 
                padding: 0,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Cerrar ventana"
            >
              <X size={16} weight="bold" />
            </button>
          )}

          {/* Milicic Logo Container */}
          <div style={{
            background: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 20px',
            borderRadius: '10px',
            marginBottom: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <img 
              src="/logo-milicic.svg" 
              alt="Milicic S.A." 
              style={{ height: '34px', width: 'auto', display: 'block' }} 
              onError={(e) => { e.target.src = '/logo-milicic.png'; }} 
            />
          </div>

          <h2 style={{ 
            fontSize: '1.4rem', 
            fontWeight: 800, 
            color: 'var(--text-main)', 
            marginBottom: '0.25rem',
            letterSpacing: '-0.02em'
          }}>
            FireControl 365
          </h2>
          
          <p style={{ 
            fontSize: '0.85rem', 
            color: 'var(--text-muted)', 
            marginBottom: '1.25rem',
            lineHeight: 1.4
          }}>
            Control Periódico de Extintores • Norma IRAM 3517-2
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.3rem 0.75rem',
            background: 'var(--milicic-orange-soft, rgba(234, 88, 12, 0.08))',
            color: '#c2410c',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
            border: '1px solid var(--milicic-orange-border, rgba(234, 88, 12, 0.2))'
          }}>
            <ShieldCheck size={14} weight="bold" />
            <span>Identificación requerida para operar</span>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem 0.9rem',
              background: 'var(--status-fault-bg)',
              color: 'var(--status-fault-text)',
              border: '1px solid var(--status-fault-border)',
              borderRadius: '8px',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              lineHeight: 1.35
            }}>
              <WarningCircle size={18} weight="bold" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {!useLocal ? (
            /* Option View: Microsoft 365 + PIN + Local toggle */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Option 1: Microsoft 365 Entra ID */}
              <button
                type="button"
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
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0, 120, 212, 0.25)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, transform 0.1s ease'
                }}
              >
                <MicrosoftOutlookLogo size={22} weight="bold" aria-hidden="true" />
                <span>Ingresar con Microsoft 365</span>
              </button>

              {/* Option 2: Shared device PIN switch */}
              {onOpenPinSwitch && (
                <button
                  type="button"
                  onClick={onOpenPinSwitch}
                  className="btn btn-secondary btn-full"
                  style={{
                    minHeight: '46px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.55rem',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1.5px solid var(--border-color)',
                    color: 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                >
                  <DeviceMobile size={20} color="#ea580c" weight="bold" aria-hidden="true" />
                  <span>Cambio rápido en tablet (PIN)</span>
                </button>
              )}

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                margin: '0.75rem 0',
                color: 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                <span>O acceso con cuenta local</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              </div>

              {/* Option 3: Button to toggle Local Login Form */}
              <button
                id="btn-use-local"
                type="button"
                onClick={() => setUseLocal(true)}
                className="btn btn-secondary btn-full"
                style={{ 
                  fontSize: '0.84rem', 
                  minHeight: '44px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)'
                }}
              >
                <Key size={18} color="var(--text-muted)" />
                <span>Ingresar con cuenta local y contraseña</span>
              </button>
            </div>
          ) : (
            /* Option 3: Local Account Form */
            <form onSubmit={handleLocalLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div>
                <label className="form-label" htmlFor="login-email" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem', display: 'block' }}>
                  Correo Electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoFocus
                    className="form-control"
                    style={{ 
                      paddingLeft: '2.4rem', 
                      height: '44px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1.5px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem'
                    }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@milicic.com.ar"
                  />
                  <Envelope size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="login-pass" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem', display: 'block' }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-pass"
                    type="password"
                    required
                    className="form-control"
                    style={{ 
                      paddingLeft: '2.4rem', 
                      height: '44px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1.5px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem'
                    }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingrese su contraseña"
                  />
                  <Lock size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-full"
                style={{ 
                  minHeight: '46px', 
                  fontWeight: 700, 
                  marginTop: '0.5rem',
                  borderRadius: '10px',
                  background: '#ea580c',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                    <ArrowsClockwise size={18} className="animate-spin" />
                    <span>Verificando credenciales...</span>
                  </span>
                ) : (
                  <span>Iniciar Sesión</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setUseLocal(false); setError(null); }}
                className="btn btn-secondary btn-full"
                style={{ 
                  fontSize: '0.82rem', 
                  minHeight: '38px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  marginTop: '0.25rem'
                }}
              >
                ← Volver a opciones de inicio
              </button>
            </form>
          )}

          <div style={{ 
            marginTop: '1.5rem', 
            paddingTop: '1rem', 
            borderTop: '1px solid var(--border-color)', 
            fontSize: '0.72rem', 
            color: 'var(--text-muted)' 
          }}>
            Milicic S.A. • Seguridad Informática e Higiene Laboral
          </div>
        </div>
      </div>
    </div>
  );
}
