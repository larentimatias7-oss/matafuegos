import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  QrCode, 
  ScanLine, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Flame,
  ShieldAlert,
  Building,
  Calendar,
  X,
  RotateCcw
} from 'lucide-react';

export default function ExtinguishersList({ 
  extinguishers = [], 
  onInspect, 
  onEdit, 
  onDelete, 
  onShowQr, 
  onNewExtinguisher 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const floors = useMemo(() => {
    const list = [...new Set(extinguishers.map(e => e.floor).filter(Boolean))];
    return list.sort();
  }, [extinguishers]);

  const types = useMemo(() => {
    const list = [...new Set(extinguishers.map(e => e.type).filter(Boolean))];
    return list.sort();
  }, [extinguishers]);

  const activeFiltersCount = (selectedFloor ? 1 : 0) + (selectedType ? 1 : 0) + (selectedStatus ? 1 : 0);

  const clearFilters = () => {
    setSelectedFloor('');
    setSelectedType('');
    setSelectedStatus('');
    setPage(1);
    setShowMobileFilters(false);
  };

  const filtered = useMemo(() => {
    return extinguishers.filter(ext => {
      const matchSearch = !searchTerm || 
        ext.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ext.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ext.area && ext.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ext.building && ext.building.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ext.manufacturer && ext.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ext.public_id && ext.public_id.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchFloor = !selectedFloor || ext.floor === selectedFloor;
      const matchType = !selectedType || ext.type === selectedType;

      let matchStatus = true;
      if (selectedStatus === 'OK') {
        matchStatus = ext.monthlyStatus?.statusKey === 'OK';
      } else if (selectedStatus === 'PENDING') {
        matchStatus = ext.monthlyStatus?.statusKey === 'PENDING';
      } else if (selectedStatus === 'FAULT' || selectedStatus === 'EXPIRED') {
        matchStatus = ext.monthlyStatus?.statusKey === 'FAULT' || ext.monthlyStatus?.statusKey === 'EXPIRED';
      }

      return matchSearch && matchFloor && matchType && matchStatus;
    });
  }, [extinguishers, searchTerm, selectedFloor, selectedType, selectedStatus]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Header and Controls */}
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
            <h2 className="card-title" style={{ fontSize: '1.2rem' }}>
              Inventario de Extintores ({extinguishers.length})
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Parque de extintores operativos auditados bajo norma IRAM 3517-2.
            </p>
          </div>

          <button onClick={onNewExtinguisher} className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>Nuevo Extintor</span>
          </button>
        </div>

        {/* Search Bar + Filter Trigger */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Buscar por código, ubicación o sector..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="input"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Botón Filtros Móvil */}
          <button 
            onClick={() => setShowMobileFilters(true)}
            className="btn btn-secondary mobile-only"
            style={{ 
              position: 'relative', 
              padding: '0.5rem 0.85rem',
              borderColor: activeFiltersCount > 0 ? 'var(--milicic-orange)' : undefined,
              color: activeFiltersCount > 0 ? 'var(--milicic-orange)' : undefined
            }}
            title="Abrir filtros"
          >
            <Filter size={18} />
            {activeFiltersCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--milicic-orange)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 900,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Filters Row (visible on tablet and desktop) */}
        <div className="desktop-only" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginTop: '0.75rem'
        }}>
          <div>
            <select 
              value={selectedFloor} 
              onChange={(e) => { setSelectedFloor(e.target.value); setPage(1); }}
              className="select"
            >
              <option value="">Todos los Pisos</option>
              {floors.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <select 
              value={selectedType} 
              onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
              className="select"
            >
              <option value="">Todos los Tipos</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <select 
              value={selectedStatus} 
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="select"
            >
              <option value="">Estado: Todos</option>
              <option value="OK">Controlados OK</option>
              <option value="PENDING">Pendientes Ronda</option>
              <option value="FAULT">Con Falla / Vencidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          1. VISTA MÓVIL: TARJETAS TOUCH-FRIENDLY (< 1025px)
          ========================================================================= */}
      <div className="mobile-cards-view">
        {paginated.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            No se encontraron extintores con los filtros seleccionados.
          </div>
        ) : (
          paginated.map((ext) => {
            const ms = ext.monthlyStatus;
            const isChargeExpired = ext.expiration_charge < new Date().toISOString().split('T')[0];

            return (
              <div key={ext.id} className="touch-card">
                {/* Cabecera Tarjeta: Código, Estado y QR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--milicic-orange)' }}>
                        {ext.code}
                      </span>
                      <button 
                        onClick={() => onShowQr(ext)}
                        className="btn btn-secondary btn-sm"
                        style={{ minHeight: '32px', padding: '0.2rem 0.45rem' }}
                        title="Ver QR"
                      >
                        <QrCode size={15} />
                      </button>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      id: {ext.public_id}
                    </div>
                  </div>

                  <div>
                    {ms?.badgeColor === 'ok' && (
                      <span className="status-badge ok">
                        <CheckCircle2 size={13} /> OK
                      </span>
                    )}
                    {ms?.badgeColor === 'pending' && (
                      <span className="status-badge pending">
                        <Clock size={13} /> Pendiente
                      </span>
                    )}
                    {(ms?.badgeColor === 'fault' || ms?.badgeColor === 'expired') && (
                      <span className="status-badge fault">
                        <AlertTriangle size={13} /> {ms.statusKey === 'EXPIRED' ? 'Vencido' : 'Falla'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Datos Principales */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    {ext.type} • {ext.capacity}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {ext.floor}
                  </div>
                </div>

                {/* Ubicación Detallada */}
                <div style={{ fontSize: '0.86rem', color: 'var(--text-body)', fontWeight: 600 }}>
                  {ext.location}
                </div>
                {ext.area && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.35rem' }}>
                    Sector: {ext.area} {ext.building ? `(${ext.building})` : ''}
                  </div>
                )}

                {/* Vencimientos Preventivos */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: isChargeExpired ? 'var(--status-expired-bg)' : 'var(--bg-app)',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  border: isChargeExpired ? '1px solid var(--status-expired-border)' : '1px solid var(--border-color)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Vto. Carga: </span>
                    <strong style={{ color: isChargeExpired ? 'var(--status-expired-text)' : 'inherit' }}>
                      {ext.expiration_charge} {isChargeExpired ? '(VENCIDO)' : ''}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>PH: </span>
                    <strong>{ext.expiration_ph}</strong>
                  </div>
                </div>

                {/* Barra de Acciones Móvil */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button 
                    onClick={() => onInspect(ext)}
                    className="btn btn-primary"
                    style={{ flex: 2, fontWeight: 800, fontSize: '0.92rem' }}
                  >
                    <ScanLine size={18} />
                    <span>{ms?.badgeColor === 'ok' ? 'Reinspeccionar' : 'Controlar'}</span>
                  </button>

                  <button 
                    onClick={() => onEdit(ext)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                    title="Editar Ficha"
                  >
                    <Edit2 size={16} />
                    <span>Ficha</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          2. VISTA ESCRITORIO: TABLA TABULAR (>= 1025px)
          ========================================================================= */}
      <div className="desktop-table-view table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Código / QR</th>
              <th>Tipo y Capacidad</th>
              <th>Ubicación / Sector</th>
              <th>Fabricante</th>
              <th>Vto. Carga</th>
              <th>Vto. PH</th>
              <th>Estado Ronda</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No se encontraron extintores con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              paginated.map((ext) => {
                const ms = ext.monthlyStatus;
                const isChargeExpired = ext.expiration_charge < new Date().toISOString().split('T')[0];

                return (
                  <tr key={ext.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span className="font-mono" style={{ fontWeight: 800, color: 'var(--milicic-orange)', fontSize: '0.95rem' }}>
                          {ext.code}
                        </span>
                        <button 
                          onClick={() => onShowQr(ext)}
                          className="btn btn-secondary btn-sm"
                          style={{ minHeight: '30px', padding: '0.2rem 0.4rem' }}
                          title="Ver QR individual"
                        >
                          <QrCode size={14} />
                        </button>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        id: {ext.public_id}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{ext.type}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ext.capacity}</div>
                    </td>

                    <td>
                      <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-main)' }} title={ext.location}>
                        {ext.location}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {ext.floor} • {ext.area}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>{ext.manufacturer || 'S/D'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fab: {ext.fab_year || 'S/D'}</div>
                    </td>

                    <td>
                      <div style={{ 
                        color: isChargeExpired ? 'var(--status-expired-text)' : 'var(--text-body)',
                        fontWeight: isChargeExpired ? 800 : 500
                      }}>
                        {ext.expiration_charge}
                      </div>
                      {isChargeExpired && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--status-expired-text)', fontWeight: 800 }}>
                          VENCIDO
                        </div>
                      )}
                    </td>

                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {ext.expiration_ph}
                      </span>
                    </td>

                    <td>
                      {ms?.badgeColor === 'ok' && (
                        <span className="status-badge ok" title={ms.label}>
                          <CheckCircle2 size={12} /> OK
                        </span>
                      )}
                      {ms?.badgeColor === 'pending' && (
                        <span className="status-badge pending" title={ms.label}>
                          <Clock size={12} /> Pendiente
                        </span>
                      )}
                      {(ms?.badgeColor === 'fault' || ms?.badgeColor === 'expired') && (
                        <span className="status-badge fault" title={ms.label}>
                          <AlertTriangle size={12} /> {ms.statusKey === 'EXPIRED' ? 'Vencido' : 'Falla'}
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => onInspect(ext)}
                          className="btn btn-primary btn-sm"
                          title="Registrar control mensual"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                        >
                          <ScanLine size={14} />
                          <span>Controlar</span>
                        </button>

                        <button 
                          onClick={() => onEdit(ext)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.6rem' }}
                          title="Editar ficha técnica"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button 
                          onClick={() => onDelete(ext.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.6rem', color: 'var(--status-fault-text)' }}
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.5rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Página {page} de {totalPages} ({filtered.length} extintores)
          </span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              disabled={page <= 1} 
              onClick={() => setPage(p => p - 1)}
              className="btn btn-secondary btn-sm"
            >
              Anterior
            </button>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="btn btn-secondary btn-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. BOTTOM SHEET DE FILTROS EN MÓVIL
          ========================================================================= */}
      {showMobileFilters && (
        <div className="modal-overlay" onClick={() => setShowMobileFilters(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drag-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={18} color="var(--milicic-orange)" />
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                  Filtrar Extintores
                </span>
              </div>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="btn btn-secondary btn-sm"
                style={{ minHeight: '34px', padding: '0.2rem 0.5rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Piso / Nivel</label>
                <select 
                  value={selectedFloor} 
                  onChange={(e) => { setSelectedFloor(e.target.value); setPage(1); }}
                  className="select"
                >
                  <option value="">Todos los Pisos</option>
                  {floors.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Tipo de Agente</label>
                <select 
                  value={selectedType} 
                  onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                  className="select"
                >
                  <option value="">Todos los Tipos</option>
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Estado en la Ronda</label>
                <select 
                  value={selectedStatus} 
                  onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                  className="select"
                >
                  <option value="">Todos los Estados</option>
                  <option value="OK">Controlados OK</option>
                  <option value="PENDING">Pendientes Ronda</option>
                  <option value="FAULT">Con Falla / Vencidos</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  onClick={clearFilters}
                  className="btn btn-secondary btn-full"
                  style={{ minHeight: '48px' }}
                >
                  <RotateCcw size={16} />
                  <span>Limpiar</span>
                </button>

                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="btn btn-primary btn-full"
                  style={{ minHeight: '48px', fontWeight: 800 }}
                >
                  <span>Ver {filtered.length} Resultados</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
