import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Flame, 
  Navigation, 
  Filter, 
  Search,
  Building,
  Layers,
  Sparkles
} from 'lucide-react';

export default function RouteView({ onInspectCode }) {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadRoute = () => {
    setLoading(true);
    fetch('/api/rounds/active')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRouteData(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoute();
  }, []);

  const items = routeData?.route || [];
  const metrics = routeData?.metrics || { total: 130, inspected: 0, pending: 130, progressPercent: 0 };
  const round = routeData?.round;

  const filteredItems = items.filter(item => {
    const matchFloor = !selectedFloor || item.floor === selectedFloor;
    const matchSearch = !searchTerm || 
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.area && item.area.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchFloor && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Active Round Progress Header */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--milicic-slate-dark) 0%, var(--milicic-slate-lead) 100%)',
        color: '#ffffff',
        borderLeft: '4px solid var(--milicic-orange)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Navigation size={20} color="var(--milicic-orange)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Mi Ruta de Inspección • {round?.name || 'Ronda Mensual'}
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '650px' }}>
              Extintores pendientes de control ordenados por edificio, nivel y sector para optimizar tu recorrido en planta.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Avance de la Ronda</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--milicic-orange)' }}>
              {metrics.inspected} / {metrics.total} ({metrics.progressPercent}%)
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '999px',
          overflow: 'hidden',
          marginTop: '1rem'
        }}>
          <div style={{
            width: `${metrics.progressPercent}%`,
            height: '100%',
            background: 'var(--milicic-orange)',
            borderRadius: '999px',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '0.85rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Buscar puesto o sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="select"
          >
            <option value="">Todos los Pisos ({items.length} pendientes)</option>
            {routeData?.pendingByFloor?.map(f => (
              <option key={f.floor} value={f.floor}>
                {f.floor} ({f.pending_count} pendientes)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Route List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="card skeleton" style={{ height: '90px' }} />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <CheckCircle2 size={48} color="var(--status-ok-text)" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            ¡Ruta al día!
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No quedan extintores pendientes en este sector para la ronda actual.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredItems.map((item, idx) => (
            <div 
              key={item.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                borderLeft: '4px solid var(--status-pending-text)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '220px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--status-pending-bg)',
                  color: 'var(--status-pending-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.95rem'
                }}>
                  {idx + 1}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="font-mono" style={{ fontWeight: 800, color: 'var(--milicic-orange)', fontSize: '1.05rem' }}>
                      {item.code}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      • {item.type} {item.capacity}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-body)', fontSize: '0.88rem', fontWeight: 600 }}>
                    <MapPin size={14} color="var(--milicic-orange)" />
                    <span>{item.location}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.floor} • Sector: {item.area || 'General'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="status-badge pending">
                  <Clock size={13} />
                  <span>Pendiente</span>
                </span>

                <button
                  onClick={() => onInspectCode(item.code)}
                  className="btn btn-primary"
                  style={{ minWidth: '130px' }}
                >
                  <span>Inspeccionar</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
