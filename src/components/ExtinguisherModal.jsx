import React, { useState, useEffect } from 'react';
import { X, QrCode, FloppyDisk, Trash, Printer, ArrowSquareOut, ClockCounterClockwise, Info } from '@phosphor-icons/react';

export default function ExtinguisherModal({ extinguisher, mode, onClose, onSave }) {
  const isQrMode = mode === 'qr';
  const isEditing = Boolean(extinguisher && extinguisher.id);

  const [form, setForm] = useState(() => {
    if (extinguisher) {
      return {
        code: extinguisher.code || '',
        type: extinguisher.type || 'Polvo ABC',
        capacity: extinguisher.capacity || '5 kg',
        location: extinguisher.location || '',
        floor: extinguisher.floor || 'Planta Baja',
        area: extinguisher.area || '',
        building: extinguisher.building || 'Base Central Rosario',
        location_ref: extinguisher.location_ref || '',
        manufacturer: extinguisher.manufacturer || 'Georgia / Melisam S.A.',
        fab_year: extinguisher.fab_year || '2021',
        lifespan_limit: extinguisher.lifespan_limit || '',
        collar_year_color: extinguisher.collar_year_color || '2026 - Marbete Naranja Oficial',
        expiration_charge: extinguisher.expiration_charge || '',
        expiration_ph: extinguisher.expiration_ph || '',
        supplier: extinguisher.supplier || 'Taller Certificado IRAM #1042',
        certificate_number: extinguisher.certificate_number || '',
        status: extinguisher.status || 'OPERATIVO',
        notes: extinguisher.notes || ''
      };
    }
    const now = new Date();
    const nextYear = new Date(now.getTime() + 365 * 86400000).toISOString().split('T')[0];
    const next5Years = new Date(now.getTime() + 5 * 365 * 86400000).toISOString().split('T')[0];
    return {
      code: '',
      type: 'Polvo ABC',
      capacity: '5 kg',
      location: '',
      floor: 'Planta Baja',
      area: 'Oficinas',
      building: 'Base Central Rosario',
      location_ref: '',
      manufacturer: 'Georgia / Melisam S.A.',
      fab_year: '2021',
      lifespan_limit: `${now.getFullYear() + 20}-12-31`,
      collar_year_color: '2026 - Marbete Naranja Oficial',
      expiration_charge: nextYear,
      expiration_ph: next5Years,
      supplier: 'Taller Certificado IRAM #1042',
      certificate_number: '',
      status: 'OPERATIVO',
      notes: ''
    };
  });

  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('data'); // 'data' | 'audit'

  useEffect(() => {
    if (extinguisher) {
      setForm({
        code: extinguisher.code || '',
        type: extinguisher.type || 'Polvo ABC',
        capacity: extinguisher.capacity || '5 kg',
        location: extinguisher.location || '',
        floor: extinguisher.floor || 'Planta Baja',
        area: extinguisher.area || '',
        building: extinguisher.building || 'Base Central Rosario',
        location_ref: extinguisher.location_ref || '',
        manufacturer: extinguisher.manufacturer || 'Georgia / Melisam S.A.',
        fab_year: extinguisher.fab_year || '2021',
        lifespan_limit: extinguisher.lifespan_limit || '',
        collar_year_color: extinguisher.collar_year_color || '2026 - Marbete Naranja Oficial',
        expiration_charge: extinguisher.expiration_charge || '',
        expiration_ph: extinguisher.expiration_ph || '',
        supplier: extinguisher.supplier || 'Taller Certificado IRAM #1042',
        certificate_number: extinguisher.certificate_number || '',
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
      const now = new Date();
      const nextYear = new Date(now.getTime() + 365 * 86400000).toISOString().split('T')[0];
      const next5Years = new Date(now.getTime() + 5 * 365 * 86400000).toISOString().split('T')[0];
      setForm(prev => ({
        ...prev,
        expiration_charge: nextYear,
        expiration_ph: next5Years,
        lifespan_limit: `${now.getFullYear() + 20}-12-31`
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
        throw new Error(data.error || 'Error al guardar extintor');
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
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '0.85rem',
          borderBottom: '1.5px solid var(--border-color)',
          marginBottom: '1rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {isQrMode 
                ? `Etiqueta QR: ${extinguisher?.code}` 
                : (isEditing ? `Ficha Técnica Extintor ${extinguisher?.code}` : 'Nuevo Extintor')}
            </h3>
            {extinguisher?.public_id && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ID Público QR: {extinguisher.public_id}
              </span>
            )}
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* QR Mode View */}
        {isQrMode ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {loadingQr ? (
              <p style={{ color: 'var(--text-muted)' }}>Generando código QR Nivel H...</p>
            ) : qrDataUrl ? (
              <>
                <div style={{
                  background: '#ffffff',
                  padding: '1rem',
                  borderRadius: '12px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                  marginBottom: '1rem',
                  border: '2px solid var(--milicic-orange)'
                }}>
                  <img src={qrDataUrl} alt={extinguisher.code} style={{ width: '220px', height: '220px', display: 'block' }} />
                </div>

                <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--milicic-orange)' }}>
                  {extinguisher.code}
                </div>
                <p style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  {extinguisher.type} {extinguisher.capacity}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '350px' }}>
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
                    <span>Imprimir Etiqueta</span>
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--status-fault-text)' }}>No se pudo generar el código QR.</p>
            )}
          </div>
        ) : (
          /* Technical Specs Edit Form */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Código Interno</label>
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
                <label className="label">Estado del Equipo</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="select"
                >
                  <option value="OPERATIVO">OPERATIVO</option>
                  <option value="EN_TALLER">EN TALLER</option>
                  <option value="FUERA_DE_SERVICIO">FUERA DE SERVICIO</option>
                  <option value="REEMPLAZADO">REEMPLAZADO</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Tipo de Extintor</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="select"
                >
                  <option value="Polvo ABC">Polvo ABC (Triclase)</option>
                  <option value="CO2">CO2 (Dióxido de Carbono)</option>
                  <option value="Agua">Agua Bajo Presión</option>
                  <option value="Acetato K">Acetato de Potasio (Clase K)</option>
                  <option value="Haloclean">Haloclean / HCFC</option>
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
                placeholder="Ej: Piso 2 - Pasillo Norte frente a tableros"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Piso / Nivel</label>
                <input
                  type="text"
                  value={form.floor}
                  onChange={e => setForm({ ...form, floor: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Sector / Área</label>
                <input
                  type="text"
                  value={form.area}
                  onChange={e => setForm({ ...form, area: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Edificio / Planta</label>
                <input
                  type="text"
                  value={form.building}
                  onChange={e => setForm({ ...form, building: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Fabricante del Cilindro</label>
                <input
                  type="text"
                  value={form.manufacturer}
                  onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Año de Fabricación</label>
                <input
                  type="number"
                  value={form.fab_year}
                  onChange={e => setForm({ ...form, fab_year: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
                <label className="label">Vto. Prueba Hidráulica (PH 5 Años)</label>
                <input
                  type="date"
                  required
                  value={form.expiration_ph}
                  onChange={e => setForm({ ...form, expiration_ph: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Marbete Anual (Año y Color)</label>
                <input
                  type="text"
                  value={form.collar_year_color}
                  onChange={e => setForm({ ...form, collar_year_color: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Taller / Proveedor Habilitado</label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={e => setForm({ ...form, supplier: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Notas / Observaciones</label>
              <textarea
                rows="2"
                placeholder="Observaciones de instalación, soporte o certificados..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="textarea"
              />
            </div>

            {error && (
              <div style={{ color: 'var(--status-fault-text)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                <FloppyDisk size={16} weight="bold" aria-hidden="true" />
                <span>{saving ? 'Guardando...' : 'Guardar Ficha Técnica'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
