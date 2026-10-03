import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Lock, 
  DeviceMobile, 
  Desktop, 
  SignOut, 
  CheckCircle, 
  WarningCircle, 
  Key, 
  ShieldCheck,
  ArrowsClockwise
} from '@phosphor-icons/react';

export default function UserProfileModal({ user, onClose, onLogout, onRefreshUser }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password' | 'pin' | 'sessions'
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState(null);
  const [passSuccess, setPassSuccess] = useState(null);
  const [savingPass, setSavingPass] = useState(false);

  // PIN state
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState(null);
  const [pinSuccess, setPinSuccess] = useState(null);
  const [savingPin, setSavingPin] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await fetch('/api/auth/sessions');
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (e) {
      console.error('Error fetching sessions:', e);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

  const handleRevokeSession = async (sessionId) => {
    if (!window.confirm('¿Desea cerrar esta sesión?')) return;
    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchSessions();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('¿Está seguro de cerrar todas las sesiones activas en todos los dispositivos? Deberá iniciar sesión nuevamente.')) return;
    try {
      const res = await fetch('/api/auth/logout-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onLogout();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 10) {
      setPassError('La nueva contraseña debe tener al menos 10 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    try {
      setSavingPass(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setPassSuccess('¡Contraseña actualizada con éxito!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (onRefreshUser) onRefreshUser();
      } else {
        setPassError(data.error || 'Error al actualizar contraseña');
      }
    } catch (err) {
      setPassError(err.message);
    } finally {
      setSavingPass(false);
    }
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (!/^\d{4,6}$/.test(pin)) {
      setPinError('El PIN debe tener entre 4 y 6 números.');
      return;
    }
    if (pin !== confirmPin) {
      setPinError('Los PINs ingresados no coinciden.');
      return;
    }

    try {
      setSavingPin(true);
      const res = await fetch('/api/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (data.success) {
        setPinSuccess('¡PIN de acceso rápido configurado exitosamente!');
        setPin('');
        setConfirmPin('');
        if (onRefreshUser) onRefreshUser();
      } else {
        setPinError(data.error || 'Error al guardar PIN');
      }
    } catch (err) {
      setPinError(err.message);
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Mi Perfil y Seguridad
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {user?.name} ({user?.role}) • Milicic S.A.
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-secondary btn-sm"
            style={{ width: '34px', height: '34px', padding: 0 }}
            aria-label="Cerrar modal"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card-header)',
          padding: '0 1rem',
          overflowX: 'auto'
        }}>
          {[
            { id: 'profile', label: 'Datos Generales' },
            { id: 'password', label: 'Contraseña' },
            { id: 'pin', label: 'PIN Rápido' },
            { id: 'sessions', label: 'Sesiones Activas' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '0.65rem 0.85rem',
                border: 'none',
                background: 'transparent',
                fontWeight: activeTab === t.id ? 800 : 500,
                color: activeTab === t.id ? 'var(--milicic-orange)' : 'var(--text-muted)',
                borderBottom: activeTab === t.id ? '2px solid var(--milicic-orange)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          
          {/* TAB 1: DATOS GENERALES */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'var(--bg-card-header)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'var(--milicic-orange)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 800
                }}>
                  {user?.nombre?.charAt(0) || user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {user?.email}
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    <span className="status-badge" style={{ background: 'var(--milicic-slate-dark)', color: '#fff' }}>
                      {user?.role}
                    </span>
                    <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>
                      Origen: {user?.origen === 'entra' ? 'Microsoft Entra ID' : 'Local'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Alcance Operativo de Inspección</label>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem'
                }}>
                  {user?.isGlobalScope ? (
                    <div style={{ color: 'var(--status-ok-text)', fontWeight: 700 }}>
                      ✓ Acceso Global: Habilitado para inspeccionar todos los puestos de la organización.
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--milicic-orange)', marginBottom: '0.35rem' }}>
                        Limitado a los siguientes sectores asignados:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-body)' }}>
                        {(user?.sectores || []).map((s, idx) => (
                          <li key={idx}>{s.sector || s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={onLogout}
                  className="btn btn-secondary"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  <SignOut size={16} weight="bold" />
                  <span>Cerrar Sesión</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary"
                >
                  Aceptar
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CONTRASEÑA */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {passError && (
                <div style={{ padding: '0.65rem', background: 'var(--status-fault-bg)', color: 'var(--status-fault-text)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                  {passError}
                </div>
              )}
              {passSuccess && (
                <div style={{ padding: '0.65rem', background: 'var(--status-ok-bg)', color: 'var(--status-ok-text)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                  {passSuccess}
                </div>
              )}

              <div>
                <label className="form-label" htmlFor="curr-pass">Contraseña Actual *</label>
                <input
                  id="curr-pass"
                  type="password"
                  required
                  className="form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingrese contraseña actual"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="new-pass">Nueva Contraseña (Mínimo 10 caracteres) *</label>
                <input
                  id="new-pass"
                  type="password"
                  required
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingrese nueva contraseña segura"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="conf-pass">Confirmar Nueva Contraseña *</label>
                <input
                  id="conf-pass"
                  type="password"
                  required
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita la nueva contraseña"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPass}
                >
                  {savingPass ? 'Actualizando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PIN RÁPIDO */}
          {activeTab === 'pin' && (
            <form onSubmit={handleSetPin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                El PIN de 4 a 6 dígitos numéricos permite cambiar rápidamente de operador en tablets y celulares compartidos en campo, sin tener que escribir su correo y contraseña completa cada vez.
              </div>

              {pinError && (
                <div style={{ padding: '0.65rem', background: 'var(--status-fault-bg)', color: 'var(--status-fault-text)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                  {pinError}
                </div>
              )}
              {pinSuccess && (
                <div style={{ padding: '0.65rem', background: 'var(--status-ok-bg)', color: 'var(--status-ok-text)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                  {pinSuccess}
                </div>
              )}

              <div>
                <label className="form-label" htmlFor="pin-input">Nuevo PIN (4 a 6 dígitos) *</label>
                <input
                  id="pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  className="form-control"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 1234"
                  style={{ letterSpacing: '0.25rem', fontSize: '1.2rem', textAlign: 'center' }}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="pin-confirm">Confirmar PIN *</label>
                <input
                  id="pin-confirm"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  className="form-control"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Repita el PIN"
                  style={{ letterSpacing: '0.25rem', fontSize: '1.2rem', textAlign: 'center' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPin}
                >
                  {savingPin ? 'Guardando...' : 'Guardar PIN de Acceso Rápido'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: SESIONES ACTIVAS */}
          {activeTab === 'sessions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Dispositivos con Sesión Iniciada ({sessions.length})
                </span>
                <button
                  onClick={handleLogoutAll}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  Cerrar todas las sesiones
                </button>
              </div>

              {loadingSessions ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <ArrowsClockwise size={20} className="animate-spin" />
                  <div>Cargando sesiones...</div>
                </div>
              ) : sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No hay otras sesiones activas registradas.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {sessions.map(s => (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-card-header)',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {s.dispositivo?.includes('Móvil') ? <DeviceMobile size={22} color="var(--milicic-orange)" /> : <Desktop size={22} color="var(--milicic-slate-muted)" />}
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {s.dispositivo} (IP {s.ip})
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Iniciada: {s.creada_en} • Actividad: {s.ultimo_uso}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeSession(s.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#dc2626' }}
                      >
                        Cerrar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
