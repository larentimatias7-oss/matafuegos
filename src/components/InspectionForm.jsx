import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Flame, 
  MapPin, 
  Calendar, 
  Gauge, 
  AlertTriangle, 
  Send, 
  ArrowLeft,
  Zap,
  Check,
  Building
} from 'lucide-react';

export default function InspectionForm({ extinguisher, onBack, onSaved }) {
  const [inspectorName, setInspectorName] = useState(() => {
    return localStorage.getItem('firecontrol_inspector') || 'Santi (Inspector)';
  });

  const [checks, setChecks] = useState({
    check_location: 1,
    check_pressure: 1,
    check_seal: 1,
    check_physical: 1,
    check_signage: 1,
    check_card: 1
  });

  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Save inspector name to localStorage on change
  useEffect(() => {
    if (inspectorName) {
      localStorage.setItem('firecontrol_inspector', inspectorName);
    }
  }, [inspectorName]);

  const toggleCheck = (field) => {
    setChecks(prev => ({
      ...prev,
      [field]: prev[field] === 1 ? 0 : 1
    }));
  };

  const markAllOk = () => {
    setChecks({
      check_location: 1,
      check_pressure: 1,
      check_seal: 1,
      check_physical: 1,
      check_signage: 1,
      check_card: 1
    });
  };

  const isAllOk = Object.values(checks).every(val => val === 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inspectorName.trim()) {
      setError('Por favor ingresá tu nombre de inspector.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extinguisher_id: extinguisher.id,
          extinguisher_code: extinguisher.code,
          inspector_name: inspectorName.trim(),
          ...checks,
          observations: observations.trim()
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al guardar inspección');
      }

      setSuccess(true);
      if (onSaved) {
        setTimeout(() => {
          onSaved();
        }, 1200);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!extinguisher) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No se seleccionó ningún matafuego.</p>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Volver
        </button>
      </div>
    );
  }

  const isChargeExpired = extinguisher.expiration_charge < new Date().toISOString().split('T')[0];

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} />
          <span>Volver al Escáner / Lista</span>
        </button>
        <span className="badge badge-blue">Norma IRAM 3517-2</span>
      </div>

      {/* Extinguisher Details Header Card */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
        borderLeft: isAllOk ? '4px solid #10b981' : '4px solid #ef4444'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <span className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>
                {extinguisher.code}
              </span>
              <span className="badge badge-green" style={{ background: '#3b82f6', color: '#fff' }}>
                {extinguisher.type} {extinguisher.capacity}
              </span>
            </div>
            
            <p style={{ color: '#f1f5f9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
              <MapPin size={16} color="#f87171" />
              <span>{extinguisher.location}</span>
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '1.4rem' }}>
              Nivel: {extinguisher.floor} • Sector: {extinguisher.area || 'General'}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Vto. Carga Anual</div>
            <div style={{ fontWeight: 700, color: isChargeExpired ? '#f87171' : '#34d399', fontSize: '0.9rem' }}>
              {extinguisher.expiration_charge} {isChargeExpired && '(VENCIDO)'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
              Vto. PH: {extinguisher.expiration_ph}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {success && (
        <div style={{
          padding: '1.25rem',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#34d399',
          textAlign: 'center',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={24} />
          <span>¡Control mensual registrado con éxito! Sincronizando con Microsoft 365...</span>
        </div>
      )}

      {/* Main Inspection Form */}
      <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Quick 1-Tap All OK Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Puntos de Control Mensual
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Marcá los puntos verificados o usá el botón rápido si todo está en orden.
            </p>
          </div>

          <button
            type="button"
            onClick={markAllOk}
            className="btn btn-success btn-sm"
            style={{ fontWeight: 700 }}
          >
            <Zap size={16} />
            <span>⚡ Marcar Todo OK</span>
          </button>
        </div>

        {/* 6 Checklist items conforming to IRAM 3517-2 */}
        <div>
          {/* Check 1: Acceso y Ubicación */}
          <div 
            className={`check-item ${checks.check_location === 1 ? 'passed' : 'failed'}`}
            onClick={() => toggleCheck('check_location')}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                1. Ubicación y Acceso Despejado
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                En su puesto asignado, a altura reglamentaria y sin objetos ni muebles que bloqueen el acceso rápido.
              </div>
            </div>
            {checks.check_location === 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 700 }}>
                <CheckCircle2 size={22} />
                <span>OK</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444', fontWeight: 700 }}>
                <XCircle size={22} />
                <span>FALLA</span>
              </div>
            )}
          </div>

          {/* Check 2: Manómetro / Presión */}
          <div 
            className={`check-item ${checks.check_pressure === 1 ? 'passed' : 'failed'}`}
            onClick={() => toggleCheck('check_pressure')}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                2. Presión / Manómetro en Verde
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Aguja en zona verde de operatividad. (En extintores de CO2 sin manómetro: peso adecuado).
              </div>
            </div>
            {checks.check_pressure === 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 700 }}>
                <CheckCircle2 size={22} />
                <span>OK</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444', fontWeight: 700 }}>
                <XCircle size={22} />
                <span>FALLA</span>
              </div>
            )}
          </div>

          {/* Check 3: Precinto y Seguro */}
          <div 
            className={`check-item ${checks.check_seal === 1 ? 'passed' : 'failed'}`}
            onClick={() => toggleCheck('check_seal')}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                3. Precinto y Pasador de Seguridad
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Traba metálica colocada y precinto plástico inviolado (garantiza que no fue disparado ni manipulado).
              </div>
            </div>
            {checks.check_seal === 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 700 }}>
                <CheckCircle2 size={22} />
                <span>OK</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444', fontWeight: 700 }}>
                <XCircle size={22} />
                <span>FALLA</span>
              </div>
            )}
          </div>

          {/* Check 4: Estado Físico, Manguera y Tobera */}
          <div 
            className={`check-item ${checks.check_physical === 1 ? 'passed' : 'failed'}`}
            onClick={() => toggleCheck('check_physical')}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                4. Cilindro, Manguera y Boquilla
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Sin signos de corrosión profunda, abolladuras, y manguera flexible sin rajaduras ni tobera tapada.
              </div>
            </div>
            {checks.check_physical === 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 700 }}>
                <CheckCircle2 size={22} />
                <span>OK</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444', fontWeight: 700 }}>
                <XCircle size={22} />
                <span>FALLA</span>
              </div>
            )}
          </div>

          {/* Check 5: Chapa Baliza y Señalización */}
          <div 
            className={`check-item ${checks.check_signage === 1 ? 'passed' : 'failed'}`}
            onClick={() => toggleCheck('check_signage')}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                5. Señalización y Chapa Baliza
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Chapa baliza visible detrás del extintor y cartel reglamentario visible a distancia adecuada.
              </div>
            </div>
            {checks.check_signage === 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 700 }}>
                <CheckCircle2 size={22} />
                <span>OK</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444', fontWeight: 700 }}>
                <XCircle size={22} />
                <span>FALLA</span>
              </div>
            )}
          </div>

          {/* Check 6: Tarjeta y Marbete */}
          <div 
            className={`check-item ${checks.check_card === 1 ? 'passed' : 'failed'}`}
            onClick={() => toggleCheck('check_card')}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                6. Tarjeta de Control y Marbete Vigente
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Tarjeta plástica o cartón identificatorio legible y marbete del cuello con año correspondiente.
              </div>
            </div>
            {checks.check_card === 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 700 }}>
                <CheckCircle2 size={22} />
                <span>OK</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444', fontWeight: 700 }}>
                <XCircle size={22} />
                <span>FALLA</span>
              </div>
            )}
          </div>
        </div>

        {/* Inspector Name */}
        <div>
          <label className="label">Nombre del Inspector / Responsable</label>
          <input
            type="text"
            required
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
            className="input"
            placeholder="Ej: Santi (Inspector HyS)"
          />
        </div>

        {/* Observaciones */}
        <div>
          <label className="label">Observaciones / Anomalías detectadas (Opcional)</label>
          <textarea
            rows="2"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="textarea"
            placeholder="Ej: Manómetro con baja presión; o acceso parcialmente tapado por cajas."
          />
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="submit"
            disabled={saving}
            className={`btn ${isAllOk ? 'btn-success' : 'btn-primary'} btn-lg`}
            style={{ flex: 1 }}
          >
            <Send size={18} />
            <span>{saving ? 'Guardando...' : (isAllOk ? 'Guardar Control Mensual (OK)' : 'Guardar con Observaciones')}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
