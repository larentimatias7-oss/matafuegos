import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  MagnifyingGlass, 
  Funnel, 
  PencilSimple, 
  Eye, 
  ShieldCheck, 
  MicrosoftOutlookLogo, 
  Key, 
  CheckCircle, 
  XCircle, 
  DeviceMobile,
  ArrowsClockwise
} from '@phosphor-icons/react';
import UserModal from './UserModal';

export default function UsersList({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');

  // Modal State
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create', // 'create' | 'edit' | 'detail'
    user: null
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('rol', roleFilter);
      if (statusFilter) params.append('activo', statusFilter);
      if (originFilter) params.append('origen', originFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.error || 'Error al cargar usuarios');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, originFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const getRoleBadge = (rol) => {
    switch (rol) {
      case 'SUPERADMIN':
        return <span className="status-badge" style={{ background: '#7c3aed', color: '#ffffff' }}>SUPERADMIN</span>;
      case 'ADMIN':
        return <span className="status-badge" style={{ background: 'var(--milicic-orange)', color: '#ffffff' }}>ADMIN HyS</span>;
      case 'SUPERVISOR':
        return <span className="status-badge" style={{ background: '#0284c7', color: '#ffffff' }}>SUPERVISOR</span>;
      case 'INSPECTOR':
        return <span className="status-badge ok">INSPECTOR</span>;
      case 'AUDITOR':
        return <span className="status-badge" style={{ background: '#475569', color: '#ffffff' }}>AUDITOR</span>;
      default:
        return <span className="status-badge">{rol}</span>;
    }
  };

  const canCreate = currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMIN';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '-0.01em',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <Users size={28} weight="bold" color="var(--milicic-orange)" />
            <span>Gestión de Usuarios y Accesos</span>
          </h1>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Control de Identidad, Asignación de Roles (RBAC) y Alcance Sectorial en Milicic S.A.
          </div>
        </div>

        {canCreate && (
          <button
            onClick={() => setModalState({ open: true, mode: 'create', user: null })}
            className="btn btn-primary"
            style={{ fontWeight: 700 }}
          >
            <UserPlus size={18} weight="bold" />
            <span>Nuevo Usuario</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          {/* Búsqueda por texto */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
            <MagnifyingGlass size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* Filtro por Rol */}
          <select 
            className="form-control"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Todos los Roles</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="ADMIN">Administrador HyS</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="INSPECTOR">Inspector</option>
            <option value="AUDITOR">Auditor</option>
          </select>

          {/* Filtro por Estado */}
          <select 
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los Estados</option>
            <option value="1">Solo Activos</option>
            <option value="0">Solo Desactivados</option>
          </select>

          {/* Filtro por Origen */}
          <select 
            className="form-control"
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
          >
            <option value="">Todos los Orígenes</option>
            <option value="entra">Microsoft Entra ID</option>
            <option value="local">Usuario Local</option>
          </select>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-secondary btn-full">
              <MagnifyingGlass size={16} weight="bold" />
              <span>Buscar</span>
            </button>
            <button 
              type="button" 
              onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); setOriginFilter(''); }} 
              className="btn btn-secondary"
              title="Limpiar filtros"
            >
              <ArrowsClockwise size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* User Table / Cards */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <ArrowsClockwise size={28} className="animate-spin" />
            <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>Cargando usuarios de la organización...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
            {error}
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No se encontraron usuarios con los filtros especificados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-header)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Colaborador / Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Rol Operativo</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Origen</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Alcance Sectorial</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Último Acceso</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: u.activo ? 1 : 0.65 }}>
                    {/* Nombre y Email */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {u.nombre} {u.apellido}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {u.email}
                      </div>
                    </td>

                    {/* Rol */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {getRoleBadge(u.rol)}
                    </td>

                    {/* Origen */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
                        {u.origen === 'entra' ? (
                          <>
                            <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                              Microsoft Entra
                            </span>
                          </>
                        ) : (
                          <>
                            <Key size={14} color="#f59e0b" weight="bold" />
                            <span>Local</span>
                          </>
                        )}
                        {u.has_pin && (
                          <span title="Dispone de PIN configurado para cambio rápido">
                            <DeviceMobile size={14} color="var(--milicic-orange)" weight="bold" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Alcance Sectorial */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {u.sectores && u.sectores.length > 0 ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--milicic-orange)', fontWeight: 600 }}>
                          {u.sectores.length} sector(es)
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--status-ok-text)', fontWeight: 600 }}>
                          Planta Global
                        </span>
                      )}
                    </td>

                    {/* Estado */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {u.activo ? (
                        <span style={{ color: 'var(--status-ok-text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                          <CheckCircle size={14} weight="bold" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                          <XCircle size={14} weight="bold" />
                          <span>Desactivado</span>
                        </span>
                      )}
                      {u.active_sessions > 0 && (
                        <div style={{ fontSize: '0.68rem', color: '#0284c7', marginTop: '2px' }}>
                          {u.active_sessions} sesión(es) activa(s)
                        </div>
                      )}
                    </td>

                    {/* Último Acceso */}
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {u.ultimo_acceso || 'Sin accesos registrados'}
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          onClick={() => setModalState({ open: true, mode: 'detail', user: u })}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.6rem' }}
                          title="Ver detalle, historial y sesiones"
                        >
                          <Eye size={15} />
                        </button>

                        {canCreate && (
                          <button
                            onClick={() => setModalState({ open: true, mode: 'edit', user: u })}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.6rem' }}
                            title="Editar usuario y alcance"
                          >
                            <PencilSimple size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Usuario (Create / Edit / Detail) */}
      {modalState.open && (
        <UserModal
          mode={modalState.mode}
          user={modalState.user}
          currentUser={currentUser}
          onClose={() => setModalState({ open: false, mode: 'create', user: null })}
          onSave={() => {
            setModalState({ open: false, mode: 'create', user: null });
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
