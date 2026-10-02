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

  const floors = useMemo(() => {
    const list = [...new Set(extinguishers.map(e => e.floor).filter(Boolean))];
    return list.sort();
  }, [extinguishers]);

  const types = useMemo(() => {
    const list = [...new Set(extinguishers.map(e => e.type).filter(Boolean))];
    return list.sort();
  }, [extinguishers]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header and Controls */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 className="card-title">
              Inventario de Extintores ({extinguishers.length} Equipos)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Base de datos auditada de extintores asignados a plantas y obras de Milicic S.A.
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
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Buscar por código (ej: MF-001), ubicación, fabricante o sector..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

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

      {/* Extinguishers Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Tipo y Capacidad</th>
              <th>Ubicación y Sector</th>
              <th>Fabricante / Año</th>
              <th>Vto. Carga Anual</th>
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
                    {/* Código */}
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

                    {/* Tipo y Capacidad */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{ext.type}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ext.capacity}</div>
                    </td>

                    {/* Ubicación */}
                    <td>
                      <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-main)' }} title={ext.location}>
                        {ext.location}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {ext.floor} • {ext.area}
                      </div>
                    </td>

                    {/* Fabricante / Año */}
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>{ext.manufacturer || 'S/D'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fab: {ext.fab_year || 'S/D'}</div>
                    </td>

                    {/* Vencimiento Carga Anual */}
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

                    {/* Vencimiento PH */}
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {ext.expiration_ph}
                      </span>
                    </td>

                    {/* Estado Ronda */}
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

                    {/* Acciones */}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 1rem'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
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
