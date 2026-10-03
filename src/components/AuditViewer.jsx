import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileXls, 
  MagnifyingGlass, 
  Calendar, 
  ArrowsClockwise, 
  CaretDown, 
  CaretRight,
  User,
  Clock,
  CheckCircle
} from '@phosphor-icons/react';

export default function AuditViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // Filters
  const [accion, setAccion] = useState('');
  const [entidad, setEntidad] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (accion) params.append('accion', accion);
      if (entidad) params.append('entidad', entidad);
      if (desde) params.append('desde', desde);
      if (hasta) params.append('hasta', hasta);
      params.append('limit', '100');

      const res = await fetch(`/api/audit?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      } else {
        setError(data.error || 'Error al obtener auditoría');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [accion, entidad, desde, hasta]);

  const handleExportExcel = () => {
    window.location.href = '/api/audit/export';
  };

  const getActionBadge = (act) => {
    if (act.includes('LOGIN') || act.includes('PIN')) {
      return <span className="status-badge" style={{ background: '#0284c7', color: '#fff' }}>{act}</span>;
    }
    if (act.includes('CREAR')) {
      return <span className="status-badge ok">{act}</span>;
    }
    if (act.includes('DESACTIVAR') || act.includes('REVOCAR') || act.includes('ELIMINAR')) {
      return <span className="status-badge fault">{act}</span>;
    }
    return <span className="status-badge pending">{act}</span>;
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Header */}
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
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <ShieldCheck size={28} weight="bold" color="var(--milicic-orange)" />
            <span>Registro de Auditoría de Seguridad y Trazabilidad (Append-Only)</span>
          </h1>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Registro legal e inmutable de eventos, autenticaciones, mutaciones y descargas de Milicic S.A.
          </div>
        </div>

        <button
          onClick={handleExportExcel}
          className="btn btn-primary"
          style={{ fontWeight: 700 }}
        >
          <FileXls size={18} weight="bold" />
          <span>Exportar a Excel (.xlsx)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          {/* Entidad */}
          <select 
            className="form-control"
            value={entidad}
            onChange={(e) => setEntidad(e.target.value)}
          >
            <option value="">Todas las Entidades</option>
            <option value="usuario">Usuarios y Accesos</option>
            <option value="sesion">Sesiones y Logins</option>
            <option value="inspeccion">Inspecciones de Extintor</option>
            <option value="extintor">Inventario de Extintores</option>
            <option value="auditoria">Auditoría y Exportaciones</option>
          </select>

          {/* Fecha Desde */}
          <div style={{ position: 'relative' }}>
            <input 
              type="date"
              className="form-control"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              title="Fecha Desde"
            />
          </div>

          {/* Fecha Hasta */}
          <div style={{ position: 'relative' }}>
            <input 
              type="date"
              className="form-control"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              title="Fecha Hasta"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button" 
              onClick={() => { setAccion(''); setEntidad(''); setDesde(''); setHasta(''); }}
              className="btn btn-secondary btn-full"
            >
              <ArrowsClockwise size={16} />
              <span>Limpiar Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <ArrowsClockwise size={28} className="animate-spin" />
            <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>Cargando registros de auditoría...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No se encontraron eventos de auditoría con los filtros seleccionados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-header)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.65rem 0.85rem' }}>ID</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Fecha y Hora</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Usuario Responsable</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Acción</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Entidad Afectada</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>IP / Terminal</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const isExpanded = expandedRow === log.id;
                  const hasDetails = log.datos_antes || log.datos_despues;
                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        style={{ 
                          borderBottom: '1px solid var(--border-color)', 
                          cursor: hasDetails ? 'pointer' : 'default',
                          background: isExpanded ? 'var(--milicic-orange-soft)' : undefined
                        }}
                        onClick={() => hasDetails && setExpandedRow(isExpanded ? null : log.id)}
                      >
                        <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          #{log.id}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>
                          {log.fecha}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {log.usuario_nombre_snapshot || 'Sistema'}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          {getActionBadge(log.accion)}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>{log.entidad}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                            ({log.entidad_id})
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {log.ip}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                          {hasDetails ? (
                            isExpanded ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded JSON Inspector */}
                      {isExpanded && (
                        <tr style={{ background: 'var(--bg-card-header)', borderBottom: '2px solid var(--milicic-orange)' }}>
                          <td colSpan="7" style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: log.datos_antes ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
                              {log.datos_antes && (
                                <div>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.25rem' }}>
                                    VALORES ANTERIORES (ANTES)
                                  </div>
                                  <pre style={{
                                    background: 'var(--bg-card)',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontFamily: 'var(--font-mono)',
                                    overflowX: 'auto',
                                    border: '1px solid var(--border-color)',
                                    margin: 0
                                  }}>
                                    {JSON.stringify(log.datos_antes, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.datos_despues && (
                                <div>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--status-ok-text)', marginBottom: '0.25rem' }}>
                                    VALORES NUEVOS / RESULTADO (DESPUÉS)
                                  </div>
                                  <pre style={{
                                    background: 'var(--bg-card)',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontFamily: 'var(--font-mono)',
                                    overflowX: 'auto',
                                    border: '1px solid var(--border-color)',
                                    margin: 0
                                  }}>
                                    {JSON.stringify(log.datos_despues, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
