import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  User, 
  FileSpreadsheet,
  CloudCheck,
  Filter
} from 'lucide-react';

export default function InspectionHistory({ onExportExcel }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState('');

  const loadInspections = () => {
    setLoading(true);
    fetch('/api/inspections?limit=250')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInspections(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInspections();
  }, []);

  const filtered = inspections.filter(item => {
    const matchSearch = !searchTerm || 
      item.extinguisher_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inspector_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.observations && item.observations.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchResult = true;
    if (filterResult === 'OK') matchResult = item.passed === 1;
    if (filterResult === 'FAIL') matchResult = item.passed === 0;

    return matchSearch && matchResult;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Header Card */}
      <div className="glass-card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={22} color="#38bdf8" />
              <span>Historial y Auditoría de Inspecciones</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Registro cronológico inmutable de todos los controles mensuales realizados, listo para auditorías de ART y bomberos.
            </p>
          </div>

          <button onClick={onExportExcel} className="btn btn-m365">
            <FileSpreadsheet size={16} />
            <span>Exportar Registro a Excel 365</span>
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Buscar por código, inspector, observación o puesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="select"
            style={{ maxWidth: '200px' }}
          >
            <option value="">Resultado: Todos</option>
            <option value="OK">🟢 Solo Aprobados</option>
            <option value="FAIL">🔴 Con Anomalías</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Fecha y Hora</th>
              <th>Inspector</th>
              <th>Ubicación</th>
              <th>Resultado</th>
              <th>Detalle de Chequeos</th>
              <th>Observaciones</th>
              <th style={{ textAlign: 'center' }}>M365</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  Cargando historial...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No se encontraron inspecciones con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono" style={{ color: '#64748b', fontSize: '0.75rem' }}>
                    #{item.id}
                  </td>
                  <td>
                    <span className="font-mono" style={{ fontWeight: 800, color: '#38bdf8' }}>
                      {item.extinguisher_code}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>
                      {item.inspection_date.substring(0, 10)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {item.inspection_date.substring(11, 16)} hs
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#cbd5e1' }}>
                      {item.inspector_name}
                    </span>
                  </td>
                  <td>
                    <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.location}>
                      {item.location}
                    </div>
                  </td>
                  <td>
                    {item.passed === 1 ? (
                      <span className="badge badge-green">
                        <CheckCircle2 size={12} /> Aprobado
                      </span>
                    ) : (
                      <span className="badge badge-red">
                        <AlertTriangle size={12} /> Falla
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', fontSize: '0.7rem' }}>
                      <span title="Acceso despejado" style={{ color: item.check_location ? '#10b981' : '#ef4444' }}>● Acc</span>
                      <span title="Presión en verde" style={{ color: item.check_pressure ? '#10b981' : '#ef4444' }}>● Pres</span>
                      <span title="Precinto inviolado" style={{ color: item.check_seal ? '#10b981' : '#ef4444' }}>● Prec</span>
                      <span title="Manguera y cilindro" style={{ color: item.check_physical ? '#10b981' : '#ef4444' }}>● Fís</span>
                      <span title="Señalización" style={{ color: item.check_signage ? '#10b981' : '#ef4444' }}>● Bal</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: item.observations ? '#f87171' : '#64748b' }}>
                      {item.observations || 'Sin observaciones'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span title={item.synced_m365 ? 'Sincronizado con Excel 365' : 'Guardado localmente'}>
                      {item.synced_m365 ? (
                        <CloudCheck size={16} color="#38bdf8" />
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Local</span>
                      )}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
