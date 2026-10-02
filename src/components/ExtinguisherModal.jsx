import React, { useState, useEffect } from 'react';
import { X, QrCode, Save, Trash2, Printer, ExternalLink } from 'lucide-react';

export default function ExtinguisherModal({ extinguisher, mode, onClose, onSave }) {
  const isQrMode = mode === 'qr';
  const isEditing = Boolean(extinguisher && extinguisher.id);

  const [form, setForm] = useState({
    code: '',
    type: 'Polvo ABC',
    capacity: '5 kg',
    location: '',
    floor: 'Planta Baja',
    area: 'Oficinas',
    expiration_charge: '',
    expiration_ph: '',
    status: 'OPERATIVO',
    notes: ''
  });

  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (extinguisher) {
      setForm({
        code: extinguisher.code || '',
        type: extinguisher.type || 'Polvo ABC',
        capacity: extinguisher.capacity || '5 kg',
        location: extinguisher.location || '',
        floor: extinguisher.floor || 'Planta Baja',
        area: extinguisher.area || '',
        expiration_charge: extinguisher.expiration_charge || '',
        expiration_ph: extinguisher.expiration_ph || '',
        status: extinguisher.status || 'OPERATIVO',
        notes: extinguisher.notes || ''
      });

      if (isQrMode) {
        setLoadingQr(true);
        fetch(`/api/qrs/single/${extinguisher.code}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setQrDataUrl(data.qrDataUrl);
            }
          })
          .catch(console.error)
          .finally(() => setLoadingQr(false));
      }
    } else {
      // Default dates for new extinguisher
      const now = new Date();
      const nextYear = new Date(now.getTime() + 365 * 86400000).toISOString().split('T')[0];
      const next5Years = new Date(now.getTime() + 5 * 365 * 86400000).toISOString().split('T')[0];
      setForm(prev => ({
        ...prev,
        expiration_charge: nextYear,
        expiration_ph: next5Years
      }));
    }
  }, [extinguisher, isQrMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = isEditing ? `/api/extinguishers/${extinguisher.id}` : '/api/extinguishers';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al guardar');
      }

      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
            {isQrMode 
              ? `Código QR: ${extinguisher?.code}` 
              : (isEditing ? `Editar Extintor ${extinguisher?.code}` : 'Nuevo Extintor')}
          </h3>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '0.2rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* QR Mode View */}
        {isQrMode ? (
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {loadingQr ? (
              <p style={{ color: '#94a3b8' }}>Generando QR...</p>
            ) : qrDataUrl ? (
              <>
                <div style={{
                  background: '#ffffff',
                  padding: '1rem',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  marginBottom: '1rem'
                }}>
                  <img src={qrDataUrl} alt={extinguisher.code} style={{ width: '220px', height: '220px', display: 'block' }} />
                </div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
                  {extinguisher.code}
                </div>
                <p style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {extinguisher.type} {extinguisher.capacity}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', maxWidth: '350px' }}>
                  {extinguisher.location}
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <a 
                    href={qrDataUrl} 
                    download={`QR_${extinguisher.code}.png`} 
                    className="btn btn-primary"
                  >
                    Descargar Imagen PNG
                  </a>
                  <button onClick={() => window.print()} className="btn btn-secondary">
                    <Printer size={16} />
                    <span>Imprimir</span>
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: '#f87171' }}>No se pudo generar el código QR.</p>
            )}
          </div>
        ) : (
          /* Edit / Create Form */
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Código Identificador</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: MF-001"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="input font-mono"
                />
              </div>

              <div>
                <label className="label">Estado Operativo</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="select"
                >
                  <option value="OPERATIVO">OPERATIVO</option>
                  <option value="EN_TALLER">EN TALLER</option>
                  <option value="BAJA">DE BAJA</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Tipo de Extintor</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="select"
                >
                  <option value="Polvo ABC">Polvo ABC (Triclase)</option>
                  <option value="CO2">CO2 (Dióxido de Carbono)</option>
                  <option value="Agua">Agua Bajo Presión (A)</option>
                  <option value="Acetato K">Acetato de Potasio (Clase K)</option>
                  <option value="Haloclean">Halón / HCFC</option>
                </select>
              </div>

              <div>
                <label className="label">Capacidad</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 5 kg, 10 kg, 6 L"
                  value={form.capacity}
                  onChange={e => setForm({ ...form, capacity: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Ubicación Detallada (Puesto)</label>
              <input
                type="text"
                required
                placeholder="Ej: Piso 2 - Pasillo Norte frente a sala de reuniones"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Piso / Nivel</label>
                <input
                  type="text"
                  placeholder="Ej: PB, Piso 1, Subsuelo"
                  value={form.floor}
                  onChange={e => setForm({ ...form, floor: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Sector / Área</label>
                <input
                  type="text"
                  placeholder="Ej: Oficinas, Cocheras, IT"
                  value={form.area}
                  onChange={e => setForm({ ...form, area: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Vto. Carga Anual (Mantenimiento)</label>
                <input
                  type="date"
                  required
                  value={form.expiration_charge}
                  onChange={e => setForm({ ...form, expiration_charge: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Vto. Prueba Hidráulica (5 años)</label>
                <input
                  type="date"
                  required
                  value={form.expiration_ph}
                  onChange={e => setForm({ ...form, expiration_ph: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Notas / Observaciones</label>
              <textarea
                rows="2"
                placeholder="Observaciones de instalación o soporte..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="textarea"
              />
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                <Save size={16} />
                <span>{saving ? 'Guardando...' : 'Guardar Extintor'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
