import React, { useState, useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getPaginationRowModel, 
  flexRender 
} from '@tanstack/react-table';
import { 
  MagnifyingGlass, 
  Funnel, 
  Plus, 
  QrCode, 
  PencilSimple, 
  Trash, 
  CheckCircle, 
  WarningCircle, 
  Clock, 
  FireExtinguisher, 
  ShieldWarning, 
  Buildings, 
  CalendarCheck, 
  X, 
  ArrowsClockwise, 
  CaretUp, 
  CaretDown, 
  CaretUpDown,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';

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
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

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
    setSearchTerm('');
    setPagination(p => ({ ...p, pageIndex: 0 }));
    setShowMobileFilters(false);
  };

  const filteredData = useMemo(() => {
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

  // TanStack Table Columns Definition
  const columns = useMemo(() => [
    {
      accessorKey: 'code',
      header: 'Código / Chapa',
      cell: ({ row }) => {
        const ext = row.original;
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span className="milicic-id-plate" style={{ fontSize: '0.85rem' }}>
                <span className="plate-code">{ext.code}</span>
              </span>
              <button 
                onClick={() => onShowQr(ext)}
                className="btn btn-secondary btn-sm"
                style={{ minHeight: '30px', padding: '0.2rem 0.45rem' }}
                title="Ver e imprimir QR individual"
                aria-label={`Ver código QR de ${ext.code}`}
              >
                <QrCode size={14} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
              ID: {ext.public_id || ext.code}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'type',
      header: 'Tipo y Capacidad',
      cell: ({ row }) => {
        const ext = row.original;
        return (
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{ext.type}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ext.capacity || 'N/D'}</div>
          </div>
        );
      }
    },
    {
      accessorKey: 'location',
      header: 'Ubicación / Sector',
      cell: ({ row }) => {
        const ext = row.original;
        return (
          <div>
            <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-main)' }} title={ext.location}>
              {ext.location}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {ext.floor || 'Planta'} • {ext.area || 'General'}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'manufacturer',
      header: 'Fabricante',
      cell: ({ row }) => {
        const ext = row.original;
        return (
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>{ext.manufacturer || 'S/D'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fab: {ext.fab_year || 'S/D'}</div>
          </div>
        );
      }
    },
    {
      accessorKey: 'expiration_charge',
      header: 'Vto. Carga Anual',
      cell: ({ row }) => {
        const ext = row.original;
        const isChargeExpired = ext.expiration_charge && ext.expiration_charge < new Date().toISOString().split('T')[0];
        return (
          <div>
            <div style={{ 
              color: isChargeExpired ? 'var(--status-expired-text)' : 'var(--text-body)',
              fontWeight: isChargeExpired ? 800 : 500,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.88rem'
            }}>
              {ext.expiration_charge || 'S/D'}
            </div>
            {isChargeExpired && (
              <span className="status-badge expired" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                <ShieldWarning size={11} weight="bold" aria-hidden="true" /> VENCIDO
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'expiration_ph',
      header: 'Vto. PH (5 Años)',
      cell: ({ row }) => {
        const ext = row.original;
        return (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
            {ext.expiration_ph || 'S/D'}
          </span>
        );
      }
    },
    {
      id: 'monthlyStatus',
      header: 'Estado Ronda',
      cell: ({ row }) => {
        const ext = row.original;
        const ms = ext.monthlyStatus;
        if (ms?.badgeColor === 'ok') {
          return (
            <span className="status-badge ok" title={ms.label}>
              <CheckCircle size={13} weight="bold" aria-hidden="true" /> OK
            </span>
          );
        }
        if (ms?.badgeColor === 'pending') {
          return (
            <span className="status-badge pending" title={ms.label}>
              <Clock size={13} weight="bold" aria-hidden="true" /> Pendiente
            </span>
          );
        }
        return (
          <span className="status-badge fault" title={ms?.label || 'Falla'}>
            <WarningCircle size={13} weight="bold" aria-hidden="true" /> {ms?.statusKey === 'EXPIRED' ? 'Vencido' : 'Falla'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div style={{ textAlign: 'right' }}>Acciones</div>,
      cell: ({ row }) => {
        const ext = row.original;
        return (
          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => onInspect(ext)}
              className="btn btn-primary btn-sm"
              title="Registrar control mensual"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            >
              <QrCode size={14} weight="bold" aria-hidden="true" />
              <span>Controlar</span>
            </button>

            <button 
              onClick={() => onEdit(ext)}
              className="btn btn-secondary btn-sm"
              title="Editar ficha técnica"
              aria-label={`Editar ficha de ${ext.code}`}
              style={{ minHeight: '34px', padding: '0.2rem 0.5rem' }}
            >
              <PencilSimple size={14} weight="bold" aria-hidden="true" />
            </button>

            {onDelete && (
              <button 
                onClick={() => onDelete(ext.id)}
                className="btn btn-secondary btn-sm"
                style={{ minHeight: '34px', padding: '0.2rem 0.5rem', color: '#dc2626' }}
                title="Eliminar de inventario"
                aria-label={`Eliminar ${ext.code}`}
              >
                <Trash size={14} weight="bold" aria-hidden="true" />
              </button>
            )}
          </div>
        );
      }
    }
  ], [onInspect, onEdit, onDelete, onShowQr]);

  // TanStack Table Instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

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
            <h2 className="card-title" style={{ fontSize: '1.2rem', margin: 0 }}>
              Inventario de Extintores ({extinguishers.length})
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem', marginBottom: 0 }}>
              Parque de extintores operativos auditados bajo norma IRAM 3517-2.
            </p>
          </div>

          <button onClick={onNewExtinguisher} className="btn btn-primary btn-sm">
            <Plus size={16} weight="bold" aria-hidden="true" />
            <span>Nuevo Extintor</span>
          </button>
        </div>

        {/* Search Bar + Filter Trigger */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MagnifyingGlass size={18} weight="bold" color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} aria-hidden="true" />
            <input 
              type="text"
              placeholder="Buscar por código, ubicación o sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Botón Filtros Móvil */}
          <button 
            onClick={() => setShowMobileFilters(true)}
            className="btn btn-secondary mobile-only"
            style={{ minHeight: '48px', padding: '0 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            aria-label="Abrir filtros"
          >
            <Funnel size={18} weight="bold" aria-hidden="true" />
            {activeFiltersCount > 0 && (
              <span style={{
                background: 'var(--milicic-orange)',
                color: '#ffffff',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.7rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Filters Row */}
        <div className="desktop-only" style={{ display: 'flex', gap: '0.6rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <select 
            value={selectedFloor} 
            onChange={(e) => setSelectedFloor(e.target.value)} 
            className="input" 
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="">Todos los Pisos</option>
            {floors.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)} 
            className="input" 
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="">Todos los Tipos</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)} 
            className="input" 
            style={{ width: 'auto', minWidth: '170px' }}
          >
            <option value="">Todos los Estados</option>
            <option value="OK">Controlados OK</option>
            <option value="PENDING">Pendientes de Ronda</option>
            <option value="FAULT">Con Falla / Vencidos</option>
          </select>

          {activeFiltersCount > 0 && (
            <button 
              onClick={clearFilters} 
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ArrowsClockwise size={14} weight="bold" aria-hidden="true" />
              <span>Limpiar Filtros</span>
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            Mostrando <strong>{filteredData.length}</strong> de {extinguishers.length} equipos
          </div>
        </div>
      </div>

      {/* =========================================================================
          1. VISTA MÓVIL: TARJETAS TOUCH ERGONÓMICAS (< 1025px)
          ========================================================================= */}
      <div className="mobile-card-list">
        {filteredData.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <FireExtinguisher size={36} weight="duotone" color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} aria-hidden="true" />
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No se encontraron extintores con los filtros aplicados.</p>
          </div>
        ) : (
          filteredData.slice(
            pagination.pageIndex * pagination.pageSize, 
            (pagination.pageIndex + 1) * pagination.pageSize
          ).map((ext) => {
            const ms = ext.monthlyStatus;
            const isChargeExpired = ext.expiration_charge && ext.expiration_charge < new Date().toISOString().split('T')[0];

            return (
              <div 
                key={ext.id} 
                className={`card mobile-extinguisher-card ${isChargeExpired ? 'hazard-stripes' : ''}`}
                style={{ 
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                {/* Cabecera Tarjeta: Chapa Técnica + Estado */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="milicic-id-plate">
                      <span className="plate-code">{ext.code}</span>
                    </span>
                    <button 
                      onClick={() => onShowQr(ext)}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Ver QR"
                      aria-label={`Ver código QR de ${ext.code}`}
                    >
                      <QrCode size={16} weight="bold" aria-hidden="true" />
                    </button>
                  </div>

                  <div>
                    {ms?.badgeColor === 'ok' && (
                      <span className="status-badge ok">
                        <CheckCircle size={13} weight="bold" aria-hidden="true" /> OK
                      </span>
                    )}
                    {ms?.badgeColor === 'pending' && (
                      <span className="status-badge pending">
                        <Clock size={13} weight="bold" aria-hidden="true" /> Pendiente
                      </span>
                    )}
                    {(ms?.badgeColor === 'fault' || ms?.badgeColor === 'expired') && (
                      <span className="status-badge fault">
                        <WarningCircle size={13} weight="bold" aria-hidden="true" /> {ms.statusKey === 'EXPIRED' ? 'Vencido' : 'Falla'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Datos Principales */}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.15rem' }}>
                    {ext.type} {ext.capacity}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-body)', fontWeight: 600 }}>
                    {ext.location}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Piso: {ext.floor || 'N/D'} • Sector: {ext.area || 'General'}
                  </div>
                </div>

                {/* Vencimientos IRAM */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.65rem',
                  background: 'var(--bg-app)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Vto. Carga: </span>
                    <strong style={{ color: isChargeExpired ? 'var(--status-expired-text)' : 'inherit', fontFamily: 'var(--font-mono)' }}>
                      {ext.expiration_charge || 'S/D'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Vto. PH: </span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{ext.expiration_ph || 'S/D'}</strong>
                  </div>
                </div>

                {/* Barra de Acciones Móvil */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button 
                    onClick={() => onInspect(ext)}
                    className="btn btn-primary"
                    style={{ flex: 2, fontWeight: 800, fontSize: '0.92rem' }}
                  >
                    <QrCode size={18} weight="bold" aria-hidden="true" />
                    <span>{ms?.badgeColor === 'ok' ? 'Reinspeccionar' : 'Controlar'}</span>
                  </button>

                  <button 
                    onClick={() => onEdit(ext)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                    title="Editar Ficha"
                  >
                    <PencilSimple size={16} weight="bold" aria-hidden="true" />
                    <span>Ficha</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          2. VISTA ESCRITORIO: TANSTACK TABLE DE ALTO RENDIMIENTO (>= 1025px)
          ========================================================================= */}
      <div className="desktop-table-view table-container">
        <table className="table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <th 
                      key={header.id}
                      className={canSort ? 'th-sortable' : ''}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ cursor: canSort ? 'pointer' : 'default' }}
                    >
                      <div className="th-content">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span style={{ display: 'inline-flex', opacity: isSorted ? 1 : 0.4 }}>
                            {isSorted === 'asc' ? (
                              <CaretUp size={14} weight="bold" aria-label="Orden ascendente" />
                            ) : isSorted === 'desc' ? (
                              <CaretDown size={14} weight="bold" aria-label="Orden descendente" />
                            ) : (
                              <CaretUpDown size={14} weight="regular" aria-hidden="true" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No se encontraron extintores con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación TanStack Table */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.5rem 0.25rem'
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de{' '}
          <strong>{Math.max(1, table.getPageCount())}</strong> ({filteredData.length} equipos totales)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="input"
            style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.82rem', minHeight: '36px' }}
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>
                {size} por pág.
              </option>
            ))}
          </select>

          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="btn btn-secondary btn-sm"
            style={{ minHeight: '36px', padding: '0.3rem 0.6rem' }}
            aria-label="Página anterior"
          >
            <CaretLeft size={16} weight="bold" aria-hidden="true" />
            <span>Anterior</span>
          </button>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="btn btn-secondary btn-sm"
            style={{ minHeight: '36px', padding: '0.3rem 0.6rem' }}
            aria-label="Página siguiente"
          >
            <span>Siguiente</span>
            <CaretRight size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile Filters Drawer / Modal */}
      {showMobileFilters && (
        <div className="modal-overlay" onClick={() => setShowMobileFilters(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="drag-handle" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Funnel size={20} weight="bold" color="var(--milicic-orange)" aria-hidden="true" />
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>Filtros de Inventario</span>
              </div>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="btn btn-secondary btn-sm"
                style={{ minHeight: '34px', padding: '0.2rem 0.5rem' }}
                aria-label="Cerrar filtros"
              >
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Piso / Nivel</label>
                <select 
                  value={selectedFloor} 
                  onChange={(e) => setSelectedFloor(e.target.value)} 
                  className="input"
                >
                  <option value="">Todos los Pisos</option>
                  {floors.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Tipo de Extintor</label>
                <select 
                  value={selectedType} 
                  onChange={(e) => setSelectedType(e.target.value)} 
                  className="input"
                >
                  <option value="">Todos los Tipos</option>
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Estado de Ronda Mensual</label>
                <select 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)} 
                  className="input"
                >
                  <option value="">Todos los Estados</option>
                  <option value="OK">Controlados OK</option>
                  <option value="PENDING">Pendientes de Ronda</option>
                  <option value="FAULT">Con Falla / Vencidos</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  onClick={clearFilters}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Restablecer
                </button>
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="btn btn-primary"
                  style={{ flex: 1, fontWeight: 800 }}
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
