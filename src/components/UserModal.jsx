import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Envelope, 
  Lock, 
  ShieldCheck, 
  MapPin, 
  Trash, 
  Clock, 
  CheckCircle, 
  WarningCircle, 
  ArrowsClockwise,
  Desktop,
  DeviceMobile
} from '@phosphor-icons/react';

const ALL_ROLES = [
  { id: 'SUPERADMIN', label: 'Superadmin (Administrador TI)', desc: 'Gestión total, usuarios, roles, auditoría y configuración' },
  { id: 'ADMIN', label: 'Administrador (Seguridad e Higiene)', desc: 'Inventario, rondas, casos, reportes y gestión de usuarios' },
  { id: 'SUPERVISOR', label: 'Supervisor de Turno', desc: 'Rondas, control de inspectores y revisión antifraude' },
  { id: 'INSPECTOR', label: 'Inspector Operativo', desc: 'Escaneo y control de extintores en sus sectores' },
  { id: 'AUDITOR', label: 'Auditor / Solo Lectura', desc: 'Visualización de dashboard y descarga de reportes' }
];

const PRESET_SECTORES = [
  'Cochera Subsuelo',
  'Planta Baja - Recepción y Hall',
  'Planta Baja - Comedor y Cocina',
  'Piso 1 - Oficinas Administrativas',
  'Piso 1 - Sala Servidores IT',
  'Piso 2 - Operaciones y Proyectos',
  'Piso 2 - Tableros Eléctricos',
  'Piso 3 - Auditorio y Capacitaciones',
  'Piso 4 - Dirección y Gerencias',
  'Depósito Logística y Obra',
  'Sala de Máquinas y Bombas'
];

export default function UserModal({ 
  mode = 'create', 
  user = null, 
  currentUser = null,
  onClose, 
  onSave 
}) {
  const [activeTab, setActiveTab] = useState(mode === 'detail' ? 'detail' : 'form');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    rol: 'INSPECTOR',
    password: '',
    activo: true,
    sectores: []
  });

  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, onConfirm }

  const fetchUserDetail = async (userId) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();
      if (data.success) {
        setDetailData(data.data);
      }
    } catch (e) {
      console.error('Error fetching user detail:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        rol: user.rol || 'INSPECTOR',
        password: '',
        activo: user.activo !== false,
        sectores: (user.sectores || []).map(s => s.sector || s)
      });

      if (mode === 'detail') {
        fetchUserDetail(user.id);
      }
    }
  }, [user, mode]);

  const handleRevokeSession = async (sessionId) => {
    if (!window.confirm('¿Desea revocar esta sesión activa del usuario?')) return;
    try {
      const res = await fetch(`/api/users/${user.id}/sessions/${sessionId}/revoke`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchUserDetail(user.id);
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSectorToggle = (sectorName) => {
    setFormData(prev => {
      const exists = prev.sectores.includes(sectorName);
      return {
        ...prev,
        sectores: exists ? prev.sectores.filter(s => s !== sectorName) : [...prev.sectores, sectorName]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Si es edición y cambia el rol o desactiva, pedir confirmación
    if (mode === 'edit' && user) {
      const isDemotingOrPromoting = formData.rol !== user.rol;
      const isDeactivating = !formData.activo && user.activo;

      if (isDemotingOrPromoting || isDeactivating) {
        setConfirmModal({
          title: isDeactivating ? '⚠️ Confirmar Desactivación de Usuario' : '⚠️ Confirmar Modificación de Rol',
          message: isDeactivating 
            ? `¿Está seguro de desactivar al usuario ${formData.nombre} ${formData.apellido}? El usuario perderá el acceso inmediatamente y todas sus sesiones activas serán revocadas.`
            : `¿Confirma el cambio de rol de "${user.rol}" a "${formData.rol}" para ${formData.nombre} ${formData.apellido}?`,
          onConfirm: () => executeSave()
        });
        return;
      }
    }

    executeSave();
  };

  const executeSave = async () => {
    setConfirmModal(null);
    setSaving(true);
    try {
      const formattedSectores = formData.sectores.map(s => ({ sector: s }));
      const payload = {
        ...formData,
        sectores: formattedSectores
      };

      const url = mode === 'create' ? '/api/users' : `/api/users/${user.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al guardar usuario');
      }

      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filtrar roles que el usuario actual puede asignar según jerarquía
  const allowedRoles = ALL_ROLES.filter(r => {
    if (!currentUser) return true;
    if (currentUser.role === 'SUPERADMIN') return true;
    if (currentUser.role === 'ADMIN') return r.id !== 'SUPERADMIN' && r.id !== 'ADMIN';
    return false;
  });

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {mode === 'create' ? 'Alta de Nuevo Usuario' :
               mode === 'detail' ? `Ficha de Usuario: ${formData.nombre} ${formData.apellido}` :
               `Editar Usuario: ${formData.nombre} ${formData.apellido}`}
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Milicic S.A. • Gestión de Identidad y Control de Alcance
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

        {/* Tab Selector if in Edit or Detail */}
        {mode !== 'create' && (
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-card-header)',
            padding: '0 1rem'
          }}>
            <button
              onClick={() => setActiveTab('form')}
              style={{
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                fontWeight: activeTab === 'form' ? 800 : 500,
                color: activeTab === 'form' ? 'var(--milicic-orange)' : 'var(--text-muted)',
                borderBottom: activeTab === 'form' ? '2px solid var(--milicic-orange)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Datos y Alcance
            </button>
            <button
              onClick={() => {
                setActiveTab('detail');
                if (!detailData && user) fetchUserDetail(user.id);
              }}
              style={{
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                fontWeight: activeTab === 'detail' ? 800 : 500,
                color: activeTab === 'detail' ? 'var(--milicic-orange)' : 'var(--text-muted)',
                borderBottom: activeTab === 'detail' ? '2px solid var(--milicic-orange)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Sesiones & Historial
            </button>
          </div>
        )}

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {error && (
            <div style={{
              background: 'var(--status-fault-bg)',
              color: 'var(--status-fault-text)',
              border: '1px solid var(--status-fault-border)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <WarningCircle size={18} weight="bold" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Row 1: Nombre y Apellido */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label" htmlFor="user-nombre">Nombre *</label>
                  <input
                    id="user-nombre"
                    type="text"
                    required
                    className="form-control"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Carlos"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="user-apellido">Apellido *</label>
                  <input
                    id="user-apellido"
                    type="text"
                    required
                    className="form-control"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    placeholder="Ej: Pérez"
                  />
                </div>
              </div>

              {/* Row 2: Email Corporativo */}
              <div>
                <label className="form-label" htmlFor="user-email">Correo Electrónico Corporativo *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="user-email"
                    type="email"
                    required
                    disabled={mode === 'edit'}
                    className="form-control"
                    style={{ paddingLeft: '2.25rem' }}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@milicic.com.ar"
                  />
                  <Envelope size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                {mode === 'edit' && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    El correo electrónico no puede modificarse una vez registrado (identificador único).
                  </div>
                )}
              </div>

              {/* Row 3: Rol del Usuario */}
              <div>
                <label className="form-label" htmlFor="user-rol">Rol y Permisos Operativos *</label>
                <select
                  id="user-rol"
                  className="form-control"
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                >
                  {allowedRoles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {ALL_ROLES.find(r => r.id === formData.rol)?.desc}
                </div>
              </div>

              {/* Row 4: Contraseña (Solo en alta o si desea resetear) */}
              {mode === 'create' && (
                <div>
                  <label className="form-label" htmlFor="user-pass">Contraseña Inicial (Opcional)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="user-pass"
                      type="password"
                      className="form-control"
                      style={{ paddingLeft: '2.25rem' }}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Dejar vacío para generar contraseña temporal automática"
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Si se deja vacío, el usuario deberá definir su contraseña en su primer inicio de sesión.
                  </div>
                </div>
              )}

              {/* Row 5: Estado Activo / Desactivado (en modo edición) */}
              {mode === 'edit' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-card-header)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      Estado de la Cuenta
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formData.activo ? 'El usuario tiene acceso activo al sistema' : 'El usuario se encuentra desactivado'}
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--milicic-orange)' }}
                    />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {formData.activo ? 'ACTIVO' : 'DESACTIVADO'}
                    </span>
                  </label>
                </div>
              )}

              {/* Row 6: Alcance Sectorial (usuarios_sectores) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Alcance Operativo por Sectores
                  </label>
                  <span style={{ fontSize: '0.72rem', color: formData.sectores.length === 0 ? 'var(--status-ok-text)' : 'var(--milicic-orange)', fontWeight: 700 }}>
                    {formData.sectores.length === 0 ? 'Acceso Global (Toda la Planta)' : `${formData.sectores.length} sector(es) limitado(s)`}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                  Si no selecciona ningún sector, el usuario tendrá acceso a inspeccionar y consultar todos los equipos de la organización.
                </div>

                <div style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '0.35rem',
                  background: 'var(--bg-input)'
                }}>
                  {PRESET_SECTORES.map(sec => {
                    const isChecked = formData.sectores.includes(sec);
                    return (
                      <label 
                        key={sec} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0.35rem 0.5rem',
                          borderRadius: '4px',
                          background: isChecked ? 'var(--milicic-orange-soft)' : 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.78rem'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSectorToggle(sec)}
                          style={{ accentColor: 'var(--milicic-orange)' }}
                        />
                        <span style={{ color: isChecked ? 'var(--milicic-orange-dark)' : 'var(--text-body)', fontWeight: isChecked ? 700 : 400 }}>
                          {sec}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ minWidth: '120px' }}
                >
                  {saving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ArrowsClockwise size={16} className="animate-spin" />
                      <span>Guardando...</span>
                    </span>
                  ) : (
                    mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* DETALLE Y SESIONES ACTIVAS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <ArrowsClockwise size={24} className="animate-spin" />
                  <div style={{ marginTop: '0.5rem' }}>Cargando ficha del usuario...</div>
                </div>
              ) : detailData ? (
                <>
                  {/* Sesiones Activas */}
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      Sesiones Activas ({detailData.sesiones?.length || 0})
                    </h3>
                    {detailData.sesiones?.length === 0 ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No hay sesiones activas en este momento.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {detailData.sesiones.map(s => (
                          <div 
                            key={s.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.6rem 0.85rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-card-header)',
                              fontSize: '0.8rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              {s.dispositivo?.includes('Móvil') ? <DeviceMobile size={20} color="var(--milicic-orange)" /> : <Desktop size={20} color="var(--milicic-slate-muted)" />}
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                  {s.dispositivo} • IP {s.ip}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  Última actividad: {s.ultimo_uso}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRevokeSession(s.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                              title="Revocar sesión remotamente"
                            >
                              Revocar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Últimas Inspecciones */}
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      Últimas Inspecciones Realizadas
                    </h3>
                    {detailData.ultimasInspecciones?.length === 0 ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No ha registrado inspecciones aún.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                              <th style={{ padding: '0.4rem' }}>Extintor</th>
                              <th style={{ padding: '0.4rem' }}>Fecha</th>
                              <th style={{ padding: '0.4rem' }}>Resultado</th>
                              <th style={{ padding: '0.4rem' }}>Antifraude</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailData.ultimasInspecciones.map(ins => (
                              <tr key={ins.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '0.4rem', fontWeight: 700 }}>{ins.extinguisher_code}</td>
                                <td style={{ padding: '0.4rem' }}>{ins.inspection_date}</td>
                                <td style={{ padding: '0.4rem' }}>
                                  <span className={`status-badge ${ins.passed ? 'ok' : 'fault'}`}>
                                    {ins.passed ? 'CONFORME' : 'CON FALLA'}
                                  </span>
                                </td>
                                <td style={{ padding: '0.4rem' }}>
                                  {ins.is_suspicious ? (
                                    <span className="status-badge pending">⚠️ Sospechosa</span>
                                  ) : (
                                    <span style={{ color: 'var(--status-ok-text)' }}>Normal</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Historial de Auditoría */}
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      Historial de Modificaciones
                    </h3>
                    {detailData.historialCambios?.length === 0 ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Sin eventos registrados.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {detailData.historialCambios.map(h => (
                          <div 
                            key={h.id}
                            style={{
                              padding: '0.45rem 0.65rem',
                              background: 'var(--bg-card-header)',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span><strong>{h.accion}</strong> por {h.usuario_nombre_snapshot || 'Sistema'}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{h.fecha}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal Overlay */}
      {confirmModal && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1100, background: 'rgba(0, 0, 0, 0.6)' }}
          onClick={() => setConfirmModal(null)}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', padding: '1.5rem', textAlign: 'center' }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="btn btn-primary"
                style={{ background: '#dc2626', borderColor: '#b91c1c', fontWeight: 700 }}
              >
                Confirmar Acción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
