import React, { useState, useEffect } from 'react';
import { 
  WarningCircle, 
  CheckCircle, 
  Clock, 
  Wrench, 
  ArrowsClockwise, 
  ShieldWarning, 
  Funnel, 
  FloppyDisk, 
  Check, 
  ArrowRight,
  UserCheck
} from '@phosphor-icons/react';

export default function CasesList() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [editingCase, setEditingCase] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadCases = () => {
    setLoading(true);
    let url = '/api/cases';
    if (filterStatus) url += `?status=${filterStatus}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCases(data.cases);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCases();
  }, [filterStatus]);

  const handleUpdateCase = async (e) => {
    e.preventDefault();
    if (!editingCase) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/cases/${editingCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editingCase.status,
          resolution_notes: editingCase.resolution_notes,
          assigned_to: editingCase.assigned_to,
          temp_replacement_code: editingCase.temp_replacement_code,
          priority: editingCase.priority
        })
      });

      const data = await res.json();
      if (data.success) {
        setEditingCase(null);
        loadCases();
      }
    } catch (err) {
      console.error('Error al actualizar caso:', err);
    } finally {
      setSaving(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENTE':
      case 'ALTA':
        return <span className="status-badge fault" style={{ fontSize: '0.72rem' }}>Prioridad Alta</span>;
      case 'MEDIA':
        return <span className="status-badge pending" style={{ fontSize: '0.72rem' }}>Prioridad Media</span>;
      default:
        return <span className="status-badge info" style={{ fontSize: '0.72rem' }}>Prioridad Normal</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header and Filter */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <WarningCircle size={24} weight="bold" color="var(--status-fault-text)" aria-hidden="true" />
              <h2 className="card-title" style={{ margin: 0, fontSize: '1.25rem' }}>
                Casos y Anomalías Detectadas
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: 0 }}>
              Seguimiento de extintores con manómetro despresurizado, precinto vulnerado o faltantes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Funnel size={16} weight="bold" color="var(--text-muted)" aria-hidden="true" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="select"
                style={{ width: 'auto', minWidth: '160px', padding: '0.35rem 0.65rem' }}
                aria-label="Filtrar por estado del caso"
              >
                <option value="">Todos los Estados</option>
                <option value="ABIERTO">Abiertos / Pendientes</option>
                <option value="EN_TALLER">En Taller</option>
                <option value="REEMPLAZADO_TEMPORAL">Reemplazo Temporal</option>
                <option value="RESUELTO">Resueltos</option>
              </select>
            </div>

            <button 
              onClick={loadCases} 
              className="btn btn-secondary btn-sm"
              title="Refrescar lista"
              aria-label="Refrescar lista de casos"
            >
              <ArrowsClockwise size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Cargando casos...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <CheckCircle size={44} weight="bold" color="var(--status-ok-text)" style={{ margin: '0 auto 0.75rem auto' }} aria-hidden="true" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            No hay casos abiertos
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Todos los extintores se encuentran operativos y conformes a norma IRAM 3517-2.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {cases.map((c) => {
            const isResolved = c.status === 'RESUELTO';
            const daysOpen = Math.round((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div 
                key={c.id} 
                className="card"
                style={{
                  borderLeft: `4px solid ${isResolved ? 'var(--status-ok-border)' : 'var(--status-fault-border)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span className="milicic-id-plate">
                        <span className="plate-code">{c.extinguisher_code}</span>
                      </span>
                      {getPriorityBadge(c.priority)}
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} weight="bold" aria-hidden="true" />
                        <span>Abierto hace {daysOpen} día(s)</span>
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.45rem', marginBottom: '0.2rem' }}>
                      {c.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', margin: 0 }}>
                      {c.description}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem', marginBottom: 0 }}>
                      Puesto: {c.location} ({c.type} {c.capacity}) • Nivel: {c.floor}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`status-badge ${isResolved ? 'ok' : 'fault'}`}>
                      {isResolved ? <CheckCircle size={14} weight="bold" aria-hidden="true" /> : <WarningCircle size={14} weight="bold" aria-hidden="true" />}
                      <span>{c.status}</span>
                    </span>

                    <button
                      onClick={() => setEditingCase(c)}
                      className="btn btn-secondary btn-sm"
                    >
                      Gestionar
                    </button>
                  </div>
                </div>

                {c.temp_replacement_code && (
                  <div style={{
                    padding: '0.45rem 0.75rem',
                    background: 'var(--status-info-bg)',
                    color: 'var(--status-info-text)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}>
                    Equipo de reemplazo temporal instalado: <strong>{c.temp_replacement_code}</strong>
                  </div>
                )}

                {c.resolution_notes && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                    <strong>Resolución:</strong> {c.resolution_notes} {c.closed_at && `(${c.closed_at})`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Case Modal */}
      {editingCase && (
        <div className="modal-overlay" onClick={() => setEditingCase(null)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="drag-handle" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                Gestionar Caso:
              </h3>
              <span className="milicic-id-plate">
                <span className="plate-code">{editingCase.extinguisher_code}</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {editingCase.title}
            </p>

            <form onSubmit={handleUpdateCase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Estado del Caso</label>
                <select
                  value={editingCase.status}
                  onChange={e => setEditingCase({ ...editingCase, status: e.target.value })}
                  className="select"
                >
                  <option value="ABIERTO">Abierto (Pendiente de acción)</option>
                  <option value="EN_TALLER">Enviado a Taller Habilitado</option>
                  <option value="REEMPLAZADO_TEMPORAL">Reemplazo Temporal Instalado</option>
                  <option value="RESUELTO">Resuelto (Extintor operativo en puesto)</option>
                </select>
              </div>

              <div>
                <label className="label">Equipo de Reemplazo Temporal (Código)</label>
                <input
                  type="text"
                  placeholder="Ej: MF-REP-01"
                  value={editingCase.temp_replacement_code || ''}
                  onChange={e => setEditingCase({ ...editingCase, temp_replacement_code: e.target.value })}
                  className="input font-mono"
                />
              </div>

              <div>
                <label className="label">Responsable Asignado</label>
                <input
                  type="text"
                  placeholder="Ej: Taller Central / Seguridad e Higiene"
                  value={editingCase.assigned_to || ''}
                  onChange={e => setEditingCase({ ...editingCase, assigned_to: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Notas de Resolución / Observaciones</label>
                <textarea
                  rows="3"
                  placeholder="Detallar trabajo realizado, número de remito o motivo de cierre..."
                  value={editingCase.resolution_notes || ''}
                  onChange={e => setEditingCase({ ...editingCase, resolution_notes: e.target.value })}
                  className="textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditingCase(null)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  <FloppyDisk size={16} weight="bold" aria-hidden="true" />
                  <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
