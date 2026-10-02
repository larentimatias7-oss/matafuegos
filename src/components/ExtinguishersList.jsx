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
  Download,
  Calendar
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
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Extract unique floors and types
  const floors = useMemo(() => {
    const list = [...new Set(extinguishers.map(e => e.floor).filter(Boolean))];
    return list.sort();
  }, [extinguishers]);

  const types = useMemo(() => {
    const list = [...new Set(extinguishers.map(e => e.type).filter(Boolean))];
    return list.sort();
  }, [extinguishers]);

  // Filtered list
  const filtered = useMemo(() => {
    return extinguishers.filter(ext => {
      const matchSearch = !searchTerm || 
        ext.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ext.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ext.area && ext.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ext.notes && ext.notes.toLowerCase().includes(searchTerm.toLowerCase()));

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header and Controls */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              Inventario de Extintores ({extinguishers.length})
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Mostrando {filtered.length} extintores según filtros aplicados.
            </p>
          </div>

          <button onClick={onNewExtinguisher} className="btn btn-primary">
            <Plus size={18} />
            <span>Agregar Extintor</span>
          </button>
        </div>

        {/* Filters Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Buscar por código (ej: MF-001), ubicación o sector..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="input"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Filter Floor */}
          <div>
            <select 
              value={selectedFloor} 
              onChange={(e) => { setSelectedFloor(e.target.value); setPage(1); }}
              className="select"
            >
              <option value="">Todos los Pisos / Niveles</option>
              {floors.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Filter Type */}
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

          {/* Filter Monthly Status */}
          <div>
            <select 
              value={selectedStatus} 
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="select"
            >
              <option value="">Estado Mes: Todos</option>
              <option value="OK">🟢 Controlados OK</option>
              <option value="PENDING">🟡 Pendientes este mes</option>
              <option value="FAULT">🔴 Falla / Vencidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Extinguishers Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Tipo y Capacidad</th>
              <th>Ubicación</th>
              <th>Piso / Sector</th>
              <th>Vto. Carga Anual</th>
              <th>Vto. PH</th>
              <th>Estado Mes</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No se encontraron extintores con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              paginated.map((ext) => {
                const ms = ext.monthlyStatus;
                const isChargeExpired = ext.expiration_charge < new Date().toISOString().split('T')[0];

                return (
                  <tr key={ext.id}>
                    {/* Código */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span className="font-mono" style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.9rem' }}>
                          {ext.code}
                        </span>
                        <button 
                          onClick={() => onShowQr(ext)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.2rem 0.35rem', borderRadius: '4px' }}
                          title="Ver QR individual"
                        >
                          <QrCode size={14} />
                        </button>
                      </div>
                    </td>

                    {/* Tipo y Capacidad */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{ext.type}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ext.capacity}</div>
                    </td>

                    {/* Ubicación */}
                    <td>
                      <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ext.location}>
                        {ext.location}
                      </div>
                    </td>

                    {/* Piso / Sector */}
                    <td>
                      <div>{ext.floor || 'S/D'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{ext.area || ''}</div>
                    </td>

                    {/* Vencimiento Carga Anual */}
                    <td>
                      <span style={{ 
                        color: isChargeExpired ? '#f87171' : '#cbd5e1',
                        fontWeight: isChargeExpired ? 700 : 400
                      }}>
                        {ext.expiration_charge}
                      </span>
                      {isChargeExpired && (
                        <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>
                          VENCIDO
                        </div>
                      )}
                    </td>

                    {/* Vencimiento PH */}
                    <td>
                      <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        {ext.expiration_ph}
                      </span>
                    </td>

                    {/* Estado Mes */}
                    <td>
                      {ms?.badgeColor === 'green' && (
                        <span className="badge badge-green" title={ms.label}>
                          <CheckCircle2 size={12} /> OK
                        </span>
                      )}
                      {ms?.badgeColor === 'yellow' && (
                        <span className="badge badge-yellow" title={ms.label}>
                          <Clock size={12} /> Pendiente
                        </span>
                      )}
                      {ms?.badgeColor === 'red' && (
                        <span className="badge badge-red" title={ms.label}>
                          <AlertTriangle size={12} /> {ms.statusKey === 'EXPIRED' ? 'Vencido' : 'Falla'}
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => onInspect(ext)}
                          className="btn btn-primary btn-sm"
                          title="Registrar control mensual"
                        >
                          <ScanLine size={14} />
                          <span>Controlar</span>
                        </button>

                        <button 
                          onClick={() => onEdit(ext)}
                          className="btn btn-secondary btn-sm"
                          title="Editar datos"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button 
                          onClick={() => onDelete(ext.id)}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#f87171' }}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 1rem'
        }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
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

    </div>
  );
}
