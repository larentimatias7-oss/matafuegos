import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  MapPin, 
  CalendarCheck, 
  WarningCircle, 
  PaperPlaneTilt, 
  ArrowLeft,
  Lightning,
  Camera,
  Info,
  Clock,
  ArrowsClockwise,
  ShieldCheck,
  Buildings,
  WifiSlash,
  Check,
  X
} from '@phosphor-icons/react';
import { enqueueOfflineInspection, compressImageFile } from '../utils/offlineQueue';

export default function InspectionForm({ extinguisher, onBack, onSaved, onInspectNext }) {
  const [inspectorName, setInspectorName] = useState(() => {
    const saved = localStorage.getItem('firecontrol_inspector');
    if (saved && (saved.includes('Santi ') || saved === 'Santi' || saved.includes('Santi ('))) {
      localStorage.setItem('firecontrol_inspector', 'Santiago Amaya (Inspector HyS)');
      return 'Santiago Amaya (Inspector HyS)';
    }
    return saved || 'Santiago Amaya (Inspector HyS)';
  });

  const [checklistItems, setChecklistItems] = useState([]);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const [checks, setChecks] = useState({});
  const [observations, setObservations] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedResult, setSavedResult] = useState(null);

  // Re-inspection handling
  const isAlreadyInspected = extinguisher?.monthlyStatus?.inspectedThisMonth;
  const [isReinspection, setIsReinspection] = useState(Boolean(isAlreadyInspected));
  const [reinspectionReason, setReinspectionReason] = useState('');

  // Antifraud duration timer
  const startTimeRef = useRef(null);
  const [geoCoords, setGeoCoords] = useState(null);

  useEffect(() => {
    startTimeRef.current = Date.now();

    // Request geolocation if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          console.warn('Geolocalización omitida o rechazada:', err.message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [extinguisher]);

  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const res = await fetch('/api/checklist');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        setChecklistItems(items);

        // Pre-fill all with OK (1) by default for fast thumb inspection
        const initial = {};
        items.forEach(item => {
          initial[item.code] = 1;
        });
        setChecks(initial);
      } catch (err) {
        console.error('Error al cargar checklist:', err);
        // Fallback standard checklist items if offline
        const fallback = [
          { code: 'check_location', label: 'Ubicación y Acceso', description: 'Extintor visible, en su puesto reglamentario y con acceso despejado' },
          { code: 'check_pressure', label: 'Manómetro / Presión', description: 'Aguja indicadora en zona verde operativa' },
          { code: 'check_seal', label: 'Precinto y Traba', description: 'Precinto plástico de seguridad intacto con pasador colocado' },
          { code: 'check_physical', label: 'Estado Físico y Manguera', description: 'Sin golpes, corrosión ni manguera cuarteada u obstruida' },
          { code: 'check_signage', label: 'Chapa Baliza y Cartel', description: 'Cartel señalizador normalizado y chapa baliza limpia' },
          { code: 'check_card', label: 'Tarjeta de Control', description: 'Tarjeta IRAM presente y legible' },
        ];
        setChecklistItems(fallback);
        const initial = {};
        fallback.forEach(item => { initial[item.code] = 1; });
        setChecks(initial);
      } finally {
        setLoadingChecklist(false);
      }
    };

    fetchChecklist();
  }, []);

  const toggleCheck = (code, val) => {
    // Provide short haptic feedback on toggle if available
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
    setChecks(prev => ({
      ...prev,
      [code]: val
    }));
  };

  const markAllOk = () => {
    if (navigator.vibrate) {
      navigator.vibrate([20, 50, 20]);
    }
    const allOk = {};
    checklistItems.forEach(item => {
      allOk[item.code] = 1;
    });
    setChecks(allOk);
    setObservations('');
  };

  const hasAnyFailure = Object.values(checks).some(val => val === 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    const inspectionPayload = {
      extinguisher_id: extinguisher.id,
      extinguisher_code: extinguisher.code,
      inspector_name: inspectorName.trim(),
      check_location: checks.check_location !== undefined ? checks.check_location : 1,
      check_pressure: checks.check_pressure !== undefined ? checks.check_pressure : 1,
      check_seal: checks.check_seal !== undefined ? checks.check_seal : 1,
      check_physical: checks.check_physical !== undefined ? checks.check_physical : 1,
      check_signage: checks.check_signage !== undefined ? checks.check_signage : 1,
      check_card: checks.check_card !== undefined ? checks.check_card : 1,
      checklist_results: checks,
      observations: observations.trim(),
      photo_url: photoUrl,
      duration_seconds: durationSeconds,
      latitude: geoCoords?.latitude,
      longitude: geoCoords?.longitude,
      geo_accuracy: geoCoords?.accuracy,
      is_reinspection: isAlreadyInspected ? 1 : 0,
      reinspection_reason: reinspectionReason.trim()
    };

    if (!navigator.onLine) {
      try {
        await enqueueOfflineInspection(inspectionPayload);
        setSavedResult({
          success: true,
          passed: !hasAnyFailure,
          isOffline: true,
          message: 'Sin conexión a Internet. El control se guardó en tu dispositivo y se sincronizará automáticamente al recuperar señal.',
          nextPendingCode: null
        });
        setSaving(false);
        return;
      } catch (errOffline) {
        setError('Error al guardar localmente: ' + errOffline.message);
        setSaving(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspectionPayload)
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al guardar el control mensual');
      }

      setSavedResult(data);
    } catch (err) {
      console.warn('Fallo de red en envío, respaldando offline:', err);
      try {
        await enqueueOfflineInspection(inspectionPayload);
        setSavedResult({
          success: true,
          passed: !hasAnyFailure,
          isOffline: true,
          message: 'Conexión inestable. El control se guardó localmente y se enviará en segundo plano cuando vuelva la red.',
          nextPendingCode: null
        });
      } catch (errOffline) {
        setError('Error de conexión y no se pudo almacenar offline: ' + errOffline.message);
      }
      setSaving(false);
    }
  };

  if (!extinguisher) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No se seleccionó ningún matafuego.</p>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Volver
        </button>
      </div>
    );
  }

  // Saved confirmation view with "Siguiente Pendiente"
  if (savedResult) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem 1.25rem', maxWidth: '580px', margin: '0 auto' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: savedResult.passed ? 'var(--status-ok-bg)' : 'var(--status-fault-bg)',
          color: savedResult.passed ? 'var(--status-ok-text)' : 'var(--status-fault-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}>
          {savedResult.passed ? <CheckCircle size={36} weight="bold" aria-hidden="true" /> : <WarningCircle size={36} weight="bold" aria-hidden="true" />}
        </div>

        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          {savedResult.passed ? '¡Control Mensual Guardado!' : 'Control Registrado con Anomalía'}
        </h3>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {savedResult.message}
        </p>

        {savedResult.nextPendingCode ? (
          <div style={{
            background: 'var(--status-pending-bg)',
            border: '1.5px solid var(--status-pending-border)',
            borderRadius: '10px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--status-pending-text)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Siguiente equipo en tu ruta:
            </div>
            <div style={{ marginBottom: '0.4rem' }}>
              <span className="milicic-id-plate milicic-id-plate-lg">
                <span className="plate-code">{savedResult.nextPendingCode}</span>
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-body)', fontWeight: 600 }}>
              {savedResult.nextPendingLocation}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--status-ok-bg)',
            color: 'var(--status-ok-text)',
            padding: '1rem',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            marginBottom: '1.5rem'
          }}>
            ¡Completaste todos los extintores pendientes en este sector!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {savedResult.nextPendingCode && (
            <button
              onClick={() => onInspectNext(savedResult.nextPendingCode)}
              className="btn btn-primary btn-full"
              style={{ fontWeight: 800, fontSize: '1rem', minHeight: '48px' }}
            >
              <span>Ir a {savedResult.nextPendingCode}</span>
            </button>
          )}

          <button
            onClick={onSaved}
            className="btn btn-secondary btn-full"
            style={{ minHeight: '44px' }}
          >
            Finalizar y volver
          </button>
        </div>
      </div>
    );
  }

  const isChargeExpired = extinguisher.expiration_charge && extinguisher.expiration_charge < new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '5rem' }}>
      
      {/* Top Bar with Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} weight="bold" aria-hidden="true" />
          <span>Volver</span>
        </button>

        <span className="status-badge info">
          <ShieldCheck size={14} weight="bold" aria-hidden="true" />
          <span>IRAM 3517-2</span>
        </span>
      </div>

      {/* Extinguisher Header Card */}
      <div className={`card ${isChargeExpired ? 'hazard-stripes' : ''}`} style={{ borderLeft: '4px solid var(--milicic-orange)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="milicic-id-plate milicic-id-plate-lg">
                <span className="plate-code">{extinguisher.code}</span>
              </div>
              <span className="status-badge info" style={{ fontWeight: 800 }}>
                {extinguisher.type} {extinguisher.capacity}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.35rem' }}>
              <MapPin size={16} weight="bold" color="var(--milicic-orange)" aria-hidden="true" />
              <span>{extinguisher.location}</span>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {extinguisher.floor} • Sector: {extinguisher.area || 'General'} • {extinguisher.building || 'Edificio Central'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vto. Carga Anual</div>
            <div style={{ fontWeight: 800, color: isChargeExpired ? 'var(--status-fault-text)' : 'var(--status-ok-text)', fontSize: '0.92rem', fontFamily: 'var(--font-mono)' }}>
              {extinguisher.expiration_charge} {isChargeExpired && '(VENCIDO)'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
              PH: {extinguisher.expiration_ph}
            </div>
          </div>
        </div>
      </div>

      {/* Re-inspection Warning Alert */}
      {isAlreadyInspected && (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: '8px',
          background: 'var(--status-pending-bg)',
          border: '1.5px solid var(--status-pending-border)',
          color: 'var(--status-pending-text)',
          fontSize: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <ArrowsClockwise size={16} weight="bold" aria-hidden="true" />
            <span>Re-inspección en la misma ronda:</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-body)', margin: 0 }}>
            Este extintor ya fue controlado este mes. Al guardar, se conservará la inspección previa en el historial inmutable de auditoría.
          </p>
          <div>
            <label className="label" style={{ color: 'var(--status-pending-text)' }}>Motivo de la Re-inspección *</label>
            <input
              type="text"
              required
              placeholder="Ej: Se reemplazó manómetro o se despejó mercadería del puesto"
              value={reinspectionReason}
              onChange={(e) => setReinspectionReason(e.target.value)}
              className="input"
              style={{ background: '#ffffff', minHeight: '42px' }}
            />
          </div>
        </div>
      )}

      {/* Official Normative Disclaimer */}
      <div style={{
        padding: '0.65rem 0.85rem',
        borderRadius: '6px',
        background: 'var(--milicic-orange-soft)',
        border: '1px solid var(--milicic-orange-border)',
        color: 'var(--milicic-slate-body)',
        fontSize: '0.78rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Info size={16} weight="bold" color="var(--milicic-orange)" style={{ flexShrink: 0 }} aria-hidden="true" />
        <span>Validar checklist y plazos con el responsable de Seguridad e Higiene y la normativa aplicable (IRAM 3517-2).</span>
      </div>

      {/* Quick 1-Tap Shortcut Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Checklist Mensual
        </span>

        <button
          type="button"
          onClick={markAllOk}
          className="btn btn-success btn-sm"
          style={{ fontWeight: 800, padding: '0.4rem 1rem' }}
        >
          <Lightning size={16} weight="fill" aria-hidden="true" />
          <span>Todo OK</span>
        </button>
      </div>

      {/* Dynamic Checklist Toggles */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {checklistItems.map((item) => {
          const isOk = checks[item.code] === 1;

          return (
            <div key={item.code} className="inspector-toggle-card">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  {item.description}
                </div>
              </div>

              {/* Big Binary Toggles */}
              <div className="toggle-group">
                <button
                  type="button"
                  onClick={() => toggleCheck(item.code, 1)}
                  className={`toggle-btn ${isOk ? 'active-ok' : ''}`}
                  aria-label={`${item.label} OK`}
                >
                  <Check size={16} weight="bold" aria-hidden="true" />
                  <span>OK</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleCheck(item.code, 0)}
                  className={`toggle-btn ${!isOk ? 'active-fail' : ''}`}
                  aria-label={`${item.label} Falla`}
                >
                  <X size={16} weight="bold" aria-hidden="true" />
                  <span>Falla</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Observation & Photo (EXPANDS CONDITIONALLY ONLY IF THERE IS A FAILURE) */}
        {hasAnyFailure && (
          <div className="card" style={{
            background: 'var(--status-fault-bg)',
            border: '1.5px solid var(--status-fault-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--status-fault-text)', fontWeight: 800, fontSize: '0.92rem' }}>
              <WarningCircle size={20} weight="bold" aria-hidden="true" />
              <span>Se abrirá un caso de anomalía automáticamente</span>
            </div>

            <div>
              <label className="label" style={{ color: 'var(--status-fault-text)' }}>
                Detalle de la Falla / Observación *
              </label>
              <textarea
                rows="2"
                required
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="textarea"
                placeholder="Describí la falla: manómetro en rojo, precinto roto, etc."
                style={{ background: '#ffffff' }}
              />
            </div>

            <div>
              <label className="label" style={{ color: 'var(--status-fault-text)' }}>
                Foto de la Anomalía (Cámara o archivo)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <label className="btn btn-secondary" style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <Camera size={18} weight="bold" aria-hidden="true" />
                    <span>Tomar / Subir Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImageFile(file, 1024, 0.7);
                            setPhotoUrl(compressed);
                          } catch (err) {
                            console.error('Error al comprimir foto:', err);
                          }
                        }
                      }}
                    />
                  </label>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="btn"
                      style={{ background: '#ffffff', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                    >
                      Quitar
                    </button>
                  )}
                </div>

                {photoUrl && (
                  <div style={{ position: 'relative', marginTop: '0.25rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--status-fault-border)', maxHeight: '160px' }}>
                    <img src={photoUrl} alt="Foto anomalía" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', bottom: '4px', right: '6px', background: 'rgba(0,0,0,0.6)', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem' }}>
                      Comprimida para celular
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Inspector Name */}
        <div>
          <label className="label">Inspector / Operario Responsable</label>
          <input
            type="text"
            required
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
            className="input"
            placeholder="Ej: Santiago Amaya (Inspector HyS)"
          />
        </div>

        {error && (
          <div style={{ color: 'var(--status-fault-text)', fontSize: '0.85rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* STICKY BOTTOM THUMB BAR (ACCESIBLE CON EL PULGAR) */}
        <div className="thumb-bar">
          <button
            type="submit"
            disabled={saving}
            className={`btn ${hasAnyFailure ? 'btn-danger' : 'btn-primary'} btn-full`}
            style={{ fontWeight: 800, fontSize: '1.05rem', minHeight: '52px' }}
          >
            <PaperPlaneTilt size={18} weight="bold" aria-hidden="true" />
            <span>
              {saving ? 'Guardando...' : (hasAnyFailure ? 'Guardar y Abrir Caso' : 'Guardar y Siguiente')}
            </span>
          </button>
        </div>

      </form>

    </div>
  );
}
