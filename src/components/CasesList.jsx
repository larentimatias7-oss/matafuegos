import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  RefreshCw, 
  ShieldAlert, 
  Filter, 
  Save, 
  Check, 
  ArrowRight,
  UserCheck
} from 'lucide-react';

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
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="card" style={{ borderLeft: '4px solid var(--status-fault-text)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <AlertTriangle size={22} color="var(--status-fault-text)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Gestión de Anomalías y Casos ({cases.length})
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Seguimiento de extintores con fallas detectadas en la inspección mensual (IRAM 3517-2).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select"
              style={{ minHeight: '38px', minWidth: '180px' }}
            >
              <option value="">Todos los Estados</option>
              <option value="ABIERTO">Abiertos</option>
              <option value="EN_TALLER">En Taller</option>
              <option value="REEMPLAZADO_TEMPORAL">Reemplazo Temporal</option>
              <option value="RESUELTO">Resueltos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map(n => <div key={n} className="card skeleton" style={{ height: '110px' }} />)}
        </div>
      ) : cases.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <CheckCircle2 size={48} color="var(--status-ok-text)" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            No hay casos pendientes
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Todos los extintores inspeccionados se encuentran 100% operativos.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {cases.map((c) => {
            const isResolved = c.status === 'RESUELTO';
            const daysOpen = c.days_open || 0;

            return (
              <div 
                key={c.id} 
                className="card"
                style={{
                  borderLeft: isResolved ? '4px solid var(--status-ok-text)' : '4px solid var(--status-fault-text)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="font-mono" style={{ fontWeight: 800, color: 'var(--milicic-orange)', fontSize: '1.1rem' }}>
                        {c.extinguisher_code}
                      </span>
                      <span className="status-badge fault" style={{ fontSize: '0.72rem' }}>
                        {c.priority}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={13} />
                        <span>Abierto hace {daysOpen} día(s)</span>
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                      {c.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>
                      {c.description}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Puesto: {c.location} ({c.type} {c.capacity}) • Nivel: {c.floor}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`status-badge ${isResolved ? 'ok' : 'fault'}`}>
                      {isResolved ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
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
          <div className="card" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', width: '100%' }}>
            <h3 className="card-title">
              Gestionar Caso: {editingCase.extinguisher_code}
            </h3>
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
                  <Save size={16} />
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
