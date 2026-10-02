import React, { useState, useEffect } from 'react';
import { 
  ClockCounterClockwise, 
  MagnifyingGlass, 
  CheckCircle, 
  WarningCircle, 
  CalendarCheck, 
  User, 
  FileXls, 
  Clock, 
  Funnel, 
  Eye, 
  X, 
  MapPin, 
  ShieldCheck, 
  ShieldWarning 
} from '@phosphor-icons/react';

export default function InspectionHistory({ onExportExcel }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [selectedInspection, setSelectedInspection] = useState(null);

  const loadInspections = () => {
    setLoading(true);
    fetch('/api/inspections?limit=250')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInspections(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInspections();
  }, []);

  const filtered = inspections.filter(item => {
    const matchSearch = !searchTerm || 
      item.extinguisher_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inspector_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.observations && item.observations.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchResult = true;
    if (filterResult === 'OK') matchResult = item.passed === 1;
    if (filterResult === 'FAIL') matchResult = item.passed === 0;

    return matchSearch && matchResult;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Top Header Card */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '0.85rem'
        }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
              <ClockCounterClockwise size={22} weight="bold" color="var(--milicic-orange)" aria-hidden="true" />
              <span>Historial de Inspecciones</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem', marginBottom: 0 }}>
              Registro cronológico inmutable de auditorías periódicas (IRAM 3517-2).
            </p>
          </div>

          <button onClick={onExportExcel} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
            <FileXls size={16} weight="bold" color="#16a34a" aria-hidden="true" />
            <span>Excel 365</span>
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <MagnifyingGlass size={16} weight="bold" color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} aria-hidden="true" />
            <input 
              type="text"
              placeholder="Buscar por código, inspector u observación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="select"
            style={{ maxWidth: '170px' }}
            aria-label="Filtrar por resultado"
          >
            <option value="">Resultado: Todos</option>
            <option value="OK">Conforme OK</option>
            <option value="FAIL">Con Anomalías</option>
          </select>
        </div>
      </div>

      {/* =========================================================================
          1. VISTA MÓVIL: TARJETAS TOUCH-FRIENDLY (< 1025px)
          ========================================================================= */}
      <div className="mobile-cards-view">
        {loading ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Cargando historial de inspecciones...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No se encontraron inspecciones registradas.
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="touch-card" onClick={() => setSelectedInspection(item)} style={{ cursor: 'pointer' }}>
              {/* Header: Código + Resultado */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span className="milicic-id-plate">
                    <span className="plate-code">{item.extinguisher_code}</span>
                  </span>
                  {item.is_reinspection === 1 && (
                    <span className="status-badge info" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
                      Reinspección
                    </span>
                  )}
                  {item.is_suspicious === 1 && (
                    <span className="status-badge fault" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
                      &lt;5s
                    </span>
                  )}
                </div>

                <div>
                  {item.passed === 1 ? (
                    <span className="status-badge ok">
                      <CheckCircle size={13} weight="bold" aria-hidden="true" /> Conforme OK
                    </span>
                  ) : (
                    <span className="status-badge fault">
                      <WarningCircle size={13} weight="bold" aria-hidden="true" /> Con Falla
                    </span>
                  )}
                </div>
              </div>

              {/* Ubicación */}
              <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 600, marginTop: '0.25rem' }}>
                {item.location || 'Ubicación no especificada'}
              </div>

              {/* Inspector y Fecha */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={13} weight="bold" aria-hidden="true" />
                  <span>{item.inspector_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={13} weight="bold" aria-hidden="true" />
                  <span>{item.inspection_date?.substring(0, 16)}</span>
                </div>
              </div>

              {/* Observación breve si existe */}
              {item.observations && (
                <div style={{
                  fontSize: '0.78rem',
                  color: item.passed === 1 ? 'var(--text-body)' : 'var(--status-fault-text)',
                  background: item.passed === 1 ? 'var(--bg-app)' : 'var(--status-fault-bg)',
                  padding: '0.35rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.observations}
                </div>
              )}

              {/* Botón ver detalle */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.15rem' }}>
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', minHeight: '38px', fontSize: '0.82rem' }}
                >
                  <Eye size={15} weight="bold" aria-hidden="true" />
                  <span>Ver Detalle del Control</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =========================================================================
          2. VISTA ESCRITORIO: TABLA COMPLETA (>= 1025px)
          ========================================================================= */}
      <div className="desktop-table-view table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Fecha y Hora</th>
              <th>Inspector</th>
              <th>Resultado</th>
              <th>Duración</th>
              <th>Observaciones</th>
              <th style={{ textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Cargando registros...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No hay registros coincidentes.</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    #{item.id}
                  </td>
                  <td>
                    <span className="milicic-id-plate">
                      <span className="plate-code">{item.extinguisher_code}</span>
                    </span>
                  </td>
                  <td>{item.inspection_date}</td>
                  <td>{item.inspector_name}</td>
                  <td>
                    {item.passed === 1 ? (
                      <span className="status-badge ok">
                        <CheckCircle size={13} weight="bold" aria-hidden="true" /> Aprobado
                      </span>
                    ) : (
                      <span className="status-badge fault">
                        <WarningCircle size={13} weight="bold" aria-hidden="true" /> Falla
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: item.is_suspicious === 1 ? 'var(--status-fault-text)' : 'inherit' }}>
                      {item.duration_seconds ? `${item.duration_seconds}s` : 'N/D'}
                      {item.is_suspicious === 1 && ' (Sospechoso)'}
                    </span>
                  </td>
                  <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.observations}>
                    {item.observations || <span style={{ color: 'var(--text-muted)' }}>Sin observaciones</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => setSelectedInspection(item)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.25rem 0.5rem' }}
                      title="Ver Detalle"
                      aria-label={`Ver detalle de inspección ${item.id}`}
                    >
                      <Eye size={15} weight="bold" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          3. BOTTOM SHEET / MODAL DE DETALLE DE INSPECCIÓN
          ========================================================================= */}
      {selectedInspection && (
        <div className="modal-overlay" onClick={() => setSelectedInspection(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drag-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Detalle de Inspección #{selectedInspection.id}
                </div>
                <div style={{ marginTop: '0.25rem' }}>
                  <span className="milicic-id-plate milicic-id-plate-lg">
                    <span className="plate-code">{selectedInspection.extinguisher_code}</span>
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedInspection(null)}
                className="btn btn-secondary btn-sm"
                style={{ minHeight: '34px', padding: '0.2rem 0.5rem' }}
                aria-label="Cerrar detalle"
              >
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Resultado Banner */}
              <div style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: selectedInspection.passed === 1 ? 'var(--status-ok-bg)' : 'var(--status-fault-bg)',
                border: `1px solid ${selectedInspection.passed === 1 ? 'var(--status-ok-border)' : 'var(--status-fault-border)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}>
                {selectedInspection.passed === 1 ? (
                  <CheckCircle size={24} weight="bold" color="var(--status-ok-text)" aria-hidden="true" />
                ) : (
                  <WarningCircle size={24} weight="bold" color="var(--status-fault-text)" aria-hidden="true" />
                )}
                <div>
                  <div style={{ fontWeight: 800, color: selectedInspection.passed === 1 ? 'var(--status-ok-text)' : 'var(--status-fault-text)', fontSize: '1rem' }}>
                    {selectedInspection.passed === 1 ? 'CONTROL MENSUAL CONFORME (OK)' : 'NO CONFORMIDAD REGISTRADA'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-body)' }}>
                    Ronda: {selectedInspection.year_month || 'Octubre 2026'} • Inspector: {selectedInspection.inspector_name}
                  </div>
                </div>
              </div>

              {/* Metadatos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', fontSize: '0.85rem' }}>
                <div style={{ background: 'var(--bg-app)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Fecha y Hora</div>
                  <strong>{selectedInspection.inspection_date}</strong>
                </div>
                <div style={{ background: 'var(--bg-app)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Duración Control</div>
                  <strong>{selectedInspection.duration_seconds ? `${selectedInspection.duration_seconds} segundos` : 'N/D'}</strong>
                </div>
              </div>

              {/* Checklist de 6 puntos evaluados */}
              <div>
                <label className="label">Checklist Reglamentario IRAM 3517-2</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {[
                    { label: 'Ubicación y acceso despejado', val: selectedInspection.check_location },
                    { label: 'Presión en verde o peso conforme', val: selectedInspection.check_pressure },
                    { label: 'Precinto y traba de seguridad intactos', val: selectedInspection.check_seal },
                    { label: 'Estado físico del cilindro y manguera', val: selectedInspection.check_physical },
                    { label: 'Señalización y chapa baliza reglamentaria', val: selectedInspection.check_signage },
                    { label: 'Marbete/collarín y tarjeta vigente', val: selectedInspection.check_card }
                  ].map((chk, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--bg-app)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem'
                    }}>
                      <span>{chk.label}</span>
                      <span className={`status-badge ${chk.val === 1 ? 'ok' : 'fault'}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                        {chk.val === 1 ? 'OK' : 'FALLA'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              {selectedInspection.observations && (
                <div>
                  <label className="label">Observaciones del Inspector</label>
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.88rem'
                  }}>
                    {selectedInspection.observations}
                  </div>
                </div>
              )}

              {/* Fotografía de Evidencia si existe */}
              {selectedInspection.photo_url && (
                <div>
                  <label className="label">Fotografía de Evidencia Adjunta</label>
                  <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '220px' }}>
                    <img src={selectedInspection.photo_url} alt="Evidencia" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
                  </div>
                </div>
              )}

              <button 
                onClick={() => setSelectedInspection(null)}
                className="btn btn-secondary btn-full"
                style={{ marginTop: '0.5rem', minHeight: '48px' }}
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
