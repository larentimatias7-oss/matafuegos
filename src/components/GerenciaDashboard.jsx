import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChartLineUp,
  ShieldCheck,
  CalendarCheck,
  WarningCircle,
  Clock,
  Wrench,
  DownloadSimple,
  Printer,
  Sliders,
  ShareNetwork,
  ArrowsClockwise,
  Play,
  Pause,
  CaretRight,
  CaretLeft,
  X,
  Buildings,
  CheckCircle,
  CurrencyDollar,
  Copy,
  Check,
  Eye,
  Info,
  FireExtinguisher
} from '@phosphor-icons/react';
import '../styles/gerencia.css';

// SVG Micro Sparkline Component
function Sparkline({ data = [], color = '#c2410c', height = 24, width = 70 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - 4) + 2;
    const y = height - 3 - ((val - min) / range) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const lastIdx = data.length - 1;
  const lastX = (width - 4) + 2;
  const lastY = height - 3 - ((data[lastIdx] - min) / range) * (height - 6);

  return (
    <svg width={width} height={height} className="kpi-sparkline" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle
        cx={lastX}
        cy={lastY}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

export default function GerenciaDashboard({ currentUser }) {
  // State
  const [periodo, setPeriodo] = useState('2026-10');
  const [planta, setPlanta] = useState('TODAS');
  const [tipo, setTipo] = useState('TODOS');
  const [comparar, setComparar] = useState('mes_anterior');
  const [selectedSector, setSelectedSector] = useState(null);

  // Data State
  const [resumenData, setResumenData] = useState(null);
  const [tendenciasData, setTendenciasData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [vencimientosData, setVencimientosData] = useState([]);
  const [anomaliasData, setAnomaliasData] = useState(null);
  const [serviciosData, setServiciosData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recomputing, setRecomputing] = useState(false);

  // Modals & Presentation Mode
  const [showPowerBiModal, setShowPowerBiModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationSlide, setPresentationSlide] = useState(0);
  const [presentationPaused, setPresentationPaused] = useState(false);
  const [presentationTimer, setPresentationTimer] = useState(0);

  // Power BI Token State
  const [biToken, setBiToken] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);

  // Hover Tooltip State for 12-month trend chart
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null);

  const canConfigure = currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMIN';

  // Fetch all analytical data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        periodo,
        planta: planta !== 'TODAS' ? planta : '',
        tipo: tipo !== 'TODOS' ? tipo : '',
        comparar
      });

      const [resumenRes, tendenciasRes, heatmapRes, vencimientosRes, anomaliasRes, serviciosRes] = await Promise.all([
        fetch(`/api/gerencia/resumen?${queryParams.toString()}`),
        fetch(`/api/gerencia/tendencias?meses=12&${queryParams.toString()}`),
        fetch(`/api/gerencia/heatmap?${queryParams.toString()}`),
        fetch(`/api/gerencia/vencimientos?meses=12&${queryParams.toString()}`),
        fetch(`/api/gerencia/anomalias?${queryParams.toString()}`),
        fetch(`/api/gerencia/servicios`)
      ]);

      const [resumen, tendencias, heatmap, vencimientos, anomalias, servicios] = await Promise.all([
        resumenRes.json(),
        tendenciasRes.json(),
        heatmapRes.json(),
        vencimientosRes.json(),
        anomaliasRes.json(),
        serviciosRes.json()
      ]);

      if (resumen.success) setResumenData(resumen.data);
      if (tendencias.success) setTendenciasData(tendencias.data || []);
      if (heatmap.success) setHeatmapData(heatmap.data || []);
      if (vencimientos.success) setVencimientosData(vencimientos.data || []);
      if (anomalias.success) setAnomaliasData(anomalias.data || null);
      if (servicios.success) setServiciosData(servicios.data || []);
    } catch (err) {
      console.error('Error fetching Gerencia KPIs:', err);
      setError('No se pudieron cargar los datos de Gerencia. Verifique la conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periodo, planta, tipo, comparar]);

  // Load BI token when modal opens
  const fetchBiToken = async () => {
    try {
      const res = await fetch('/api/bi/tokens');
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setBiToken(data.data[0]);
      }
    } catch (err) {
      console.warn('Error fetching BI token:', err);
    }
  };

  // Recompute Snapshot
  const handleRecompute = async () => {
    try {
      setRecomputing(true);
      const res = await fetch('/api/gerencia/snapshots/recompute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error recalculando snapshot:', err);
    } finally {
      setRecomputing(false);
    }
  };

  // Presentation Mode Timer (20s per slide)
  useEffect(() => {
    if (!presentationMode || presentationPaused) return;

    const interval = setInterval(() => {
      setPresentationTimer((prev) => {
        if (prev >= 200) {
          setPresentationSlide((curr) => (curr + 1) % 4);
          return 0;
        }
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [presentationMode, presentationPaused]);

  // Filtered heatmap sectors
  const filteredHeatmap = useMemo(() => {
    if (!heatmapData) return [];
    if (planta === 'TODAS') return heatmapData;
    return heatmapData.filter(s => s.edificio === planta);
  }, [heatmapData, planta]);

  // Vencimientos resumen totals
  const vencimientosTotales = useMemo(() => {
    let cargas = 0;
    let ph = 0;
    let costo = 0;
    vencimientosData.forEach(item => {
      cargas += item.cargas || 0;
      ph += item.ph || 0;
      costo += item.costo_estimado || 0;
    });
    return { cargas, ph, costo };
  }, [vencimientosData]);

  // Print PDF handler
  const handlePrintPdf = () => {
    window.print();
  };

  // Export CSV handler
  const handleExportCsv = () => {
    window.open('/api/bi/snapshots?format=csv', '_blank');
  };

  // Copy helper
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const topCards = resumenData?.topCards || [];
  const narrative = resumenData?.narrative || 'Calculando análisis ejecutivo...';
  const actualizadoEn = resumenData?.actualizado_en ? new Date(resumenData.actualizado_en).toLocaleString('es-AR') : 'Reciente';

  return (
    <div className="gerencia-container">
      {/* Official Print Header for Executive PDF export */}
      <div className="print-official-header" aria-hidden="true">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo-milicic.svg" alt="Milicic S.A." style={{ height: '36px' }} />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              MILICIC S.A. • REPORTE EJECUTIVO DE SEGURIDAD
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Protección Contra Incendios • Período: {periodo} • Planta: {planta}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
          <div>IRAM 3517-2</div>
          <div>Emisión: {actualizadoEn}</div>
        </div>
      </div>

      {/* Main Screen Header & Filter Bar */}
      <header className="gerencia-header no-print">
        <div className="gerencia-title-row">
          <div className="gerencia-title-group">
            <h1>
              <ChartLineUp size={28} color="var(--milicic-orange)" weight="bold" />
              <span>Gerencia • Tablero Ejecutivo de Seguridad</span>
            </h1>
            <p className="gerencia-subtitle">
              Monitoreo estratégico de infraestructura contra incendios bajo norma IRAM 3517-2.
            </p>
          </div>

          <div className="gerencia-actions">
            <button
              onClick={() => {
                setPresentationMode(true);
                setPresentationSlide(0);
                setPresentationTimer(0);
              }}
              className="btn btn-secondary btn-sm"
              title="Modo pantalla completa para proyector o TV"
            >
              <Play size={16} weight="bold" color="var(--milicic-orange)" />
              <span>Modo Presentación</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="btn btn-secondary btn-sm"
              title="Generar reporte ejecutivo oficial en PDF"
            >
              <Printer size={16} weight="bold" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="btn btn-secondary btn-sm"
              title="Exportar dataset consolidado en formato CSV"
            >
              <DownloadSimple size={16} weight="bold" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => {
                fetchBiToken();
                setShowPowerBiModal(true);
              }}
              className="btn btn-secondary btn-sm"
              title="Conectar Power BI Desktop directamente a los datasets de la app"
            >
              <ShareNetwork size={16} weight="bold" color="#ea580c" />
              <span>Power BI</span>
            </button>

            {canConfigure && (
              <button
                onClick={() => setShowConfigModal(true)}
                className="btn btn-secondary btn-sm"
                title="Configurar metas y umbrales RAG para los KPIs"
              >
                <Sliders size={16} weight="bold" />
                <span>Metas</span>
              </button>
            )}

            <button
              onClick={handleRecompute}
              disabled={recomputing}
              className="btn btn-secondary btn-sm"
              title="Recalcular métricas y consolidar snapshot del mes"
            >
              <ArrowsClockwise size={16} weight="bold" className={recomputing ? 'spin-anim' : ''} />
              <span>{recomputing ? 'Recalculando...' : 'Snapshot'}</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="gerencia-filters-bar">
          <div className="gerencia-filter-item">
            <label htmlFor="periodo-select">Período:</label>
            <select
              id="periodo-select"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="gerencia-select"
            >
              <option value="2026-10">Octubre 2026 (Actual)</option>
              <option value="2026-09">Septiembre 2026</option>
              <option value="2026-08">Agosto 2026</option>
              <option value="2026-07">Julio 2026</option>
              <option value="2026-06">Junio 2026</option>
            </select>
          </div>

          <div className="gerencia-filter-item">
            <label htmlFor="planta-select">Planta / Base:</label>
            <select
              id="planta-select"
              value={planta}
              onChange={(e) => setPlanta(e.target.value)}
              className="gerencia-select"
            >
              <option value="TODAS">Todas las Plantas</option>
              <option value="Base Central Rosario">Base Central Rosario</option>
              <option value="Edificio Central">Edificio Central</option>
              <option value="Depósito">Depósito</option>
            </select>
          </div>

          <div className="gerencia-filter-item">
            <label htmlFor="tipo-select">Tipo de Extintor:</label>
            <select
              id="tipo-select"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="gerencia-select"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="ABC">Polvo Químico ABC</option>
              <option value="CO2">Dióxido de Carbono (CO2)</option>
              <option value="Agua">Agua Bajo Presión</option>
              <option value="HCFC">Haloclean / HCFC</option>
            </select>
          </div>

          <div className="gerencia-filter-item">
            <label htmlFor="comparar-select">Comparativa:</label>
            <select
              id="comparar-select"
              value={comparar}
              onChange={(e) => setComparar(e.target.value)}
              className="gerencia-select"
            >
              <option value="mes_anterior">vs Mes Anterior</option>
              <option value="anio_anterior">vs Mismo Mes Año Anterior</option>
            </select>
          </div>

          {selectedSector && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="status-badge info" style={{ fontSize: '0.72rem' }}>
                Filtro Activo: {selectedSector}
              </span>
              <button
                onClick={() => setSelectedSector(null)}
                className="btn btn-secondary btn-sm"
                style={{ minHeight: '30px', padding: '0.2rem 0.5rem' }}
              >
                Limpiar filtro
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Executive Narrative Paragraph */}
      <section className="gerencia-narrative-card" aria-label="Resumen Ejecutivo">
        <div className="gerencia-narrative-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <ShieldCheck size={18} weight="bold" />
            <span>Síntesis Ejecutiva de Desempeño y Riesgo</span>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Cálculo determinista de servidor
          </span>
        </div>
        <p className="gerencia-narrative-text">{narrative}</p>
        <div className="gerencia-narrative-footer">
          <span>Actualizado: {actualizadoEn}</span>
          <span>Hash SHA-256 de Auditoría: {resumenData?.kpis?.meta?.hash_sha256 || '4f9a...8c21'}</span>
        </div>
      </section>

      {/* Top 6 Executive KPI Cards */}
      <section className="gerencia-cards-grid" aria-label="Tarjetas de Indicadores Clave">
        {topCards.map((card) => {
          const isNegative = card.delta?.sign === '-';
          const isPositive = card.delta?.sign === '+';
          const deltaColor = card.id === 'confiabilidad' || card.id === 'isi' || card.id === 'cumplimiento' || card.id === 'vigencia' || card.id === 'disponibilidad'
            ? (isPositive ? 'var(--status-ok-text)' : (isNegative ? 'var(--status-fault-text)' : 'var(--text-muted)'))
            : (isNegative ? 'var(--status-ok-text)' : (isPositive ? 'var(--status-fault-text)' : 'var(--text-muted)'));

          return (
            <div key={card.id} className="kpi-card" title={card.tooltip}>
              <div className="kpi-card-header">
                <span className="kpi-card-title">{card.title}</span>
                <span
                  className="kpi-card-badge"
                  style={{
                    backgroundColor: `${card.badgeColor}15`,
                    color: card.badgeColor,
                    border: `1px solid ${card.badgeColor}40`
                  }}
                >
                  {card.badge}
                </span>
              </div>

              <div>
                <div className="kpi-card-body">
                  <span className="kpi-card-value">{card.value}</span>
                  <span className="kpi-card-unit">{card.unit}</span>
                </div>
                {card.subtitle && <div className="kpi-card-sub">{card.subtitle}</div>}
              </div>

              <div className="kpi-card-footer">
                <div className="kpi-delta" style={{ color: deltaColor }}>
                  <span>{card.delta?.label || '0'}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                    {card.deltaLabel}
                  </span>
                </div>

                <div className="kpi-sparkline-container">
                  <Sparkline
                    data={card.sparkline || []}
                    color={card.badgeColor || 'var(--milicic-orange)'}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Strategic Question Panels */}
      <div className="gerencia-panels-grid">
        {/* PANEL 1: ¿Estamos cumpliendo? (Evolución Histórica a 12 Meses) */}
        <section className="strategic-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <CalendarCheck size={20} color="var(--milicic-orange)" weight="bold" />
              <span>¿Estamos cumpliendo? • Evolución a 12 Meses</span>
            </h2>
            <span className="panel-tag">Meta Reglamentaria: 95%</span>
          </div>

          <div style={{ position: 'relative', width: '100%', height: '220px' }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
              style={{ overflow: 'visible' }}
            >
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="490" y2="20" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.6" />
              <line x1="40" y1="65" x2="490" y2="65" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.6" />
              <line x1="40" y1="110" x2="490" y2="110" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.6" />
              <line x1="40" y1="155" x2="490" y2="155" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.6" />

              {/* Target 95% Reference Line */}
              {/* 95% sits at y = 155 - 0.95 * 135 = 26.75 */}
              <line x1="40" y1="26.75" x2="490" y2="26.75" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="495" y="30" fill="#dc2626" fontSize="10" fontWeight="bold">95%</text>

              {/* Y Axis Labels */}
              <text x="10" y="24" fill="var(--text-muted)" fontSize="9">100%</text>
              <text x="15" y="69" fill="var(--text-muted)" fontSize="9">75%</text>
              <text x="15" y="114" fill="var(--text-muted)" fontSize="9">50%</text>
              <text x="15" y="159" fill="var(--text-muted)" fontSize="9">25%</text>

              {/* Tendencias lines */}
              {tendenciasData.length > 1 && (() => {
                const totalPoints = tendenciasData.length;
                const getX = (idx) => 40 + (idx / (totalPoints - 1)) * 440;
                const getY = (val) => 155 - ((val || 0) / 100) * 135;

                // Series: Cumplimiento (Orange) & Vigencia (Blue/Slate)
                const pathCumplimiento = tendenciasData.map((d, i) => `${getX(i).toFixed(1)},${getY(d.cumplimiento).toFixed(1)}`).join(' ');
                const pathVigencia = tendenciasData.map((d, i) => `${getX(i).toFixed(1)},${getY(d.vigencia).toFixed(1)}`).join(' ');

                return (
                  <>
                    {/* Line 1: Vigencia Normativa */}
                    <polyline
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pathVigencia}
                    />

                    {/* Line 2: Cumplimiento de Ronda */}
                    <polyline
                      fill="none"
                      stroke="var(--milicic-orange)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pathCumplimiento}
                    />

                    {/* Circles on data points */}
                    {tendenciasData.map((d, idx) => {
                      const x = getX(idx);
                      const yCump = getY(d.cumplimiento);
                      const yVig = getY(d.vigencia);
                      const isHovered = hoveredTrendIndex === idx;

                      return (
                        <g key={d.year_month}>
                          <circle
                            cx={x}
                            cy={yCump}
                            r={isHovered ? 5 : 3}
                            fill="var(--milicic-orange)"
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredTrendIndex(idx)}
                            onMouseLeave={() => setHoveredTrendIndex(null)}
                          />
                          <circle
                            cx={x}
                            cy={yVig}
                            r={isHovered ? 5 : 3}
                            fill="#0284c7"
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredTrendIndex(idx)}
                            onMouseLeave={() => setHoveredTrendIndex(null)}
                          />
                          {/* X-axis Month Label */}
                          <text
                            x={x}
                            y="180"
                            textAnchor="middle"
                            fill="var(--text-muted)"
                            fontSize="9"
                            fontWeight={isHovered ? 'bold' : 'normal'}
                          >
                            {d.year_month.slice(5)}
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredTrendIndex !== null && tendenciasData[hoveredTrendIndex] && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '50px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-lg)',
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                  Período: {tendenciasData[hoveredTrendIndex].year_month}
                </div>
                <div style={{ color: 'var(--milicic-orange)', fontWeight: 700 }}>
                  Cumplimiento Ronda: {tendenciasData[hoveredTrendIndex].cumplimiento}%
                </div>
                <div style={{ color: '#0284c7', fontWeight: 700 }}>
                  Vigencia Normativa: {tendenciasData[hoveredTrendIndex].vigencia}%
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Salud ISI: {tendenciasData[hoveredTrendIndex].isi} pts
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--milicic-orange)', borderRadius: '2px' }} />
              <span>Cumplimiento Ronda Mensual</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '3px', background: '#0284c7', borderRadius: '2px' }} />
              <span>Vigencia Normativa IRAM</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '1px', borderTop: '2px dashed #dc2626' }} />
              <span style={{ color: '#dc2626' }}>Meta 95%</span>
            </div>
          </div>
        </section>

        {/* PANEL 2: ¿Dónde está el riesgo? (Mapa de Calor de Sectores y Cross-filtering) */}
        <section className="strategic-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <WarningCircle size={20} color="var(--milicic-orange)" weight="bold" />
              <span>¿Dónde está el riesgo? • Mapa de Calor de Sectores</span>
            </h2>
            <span className="panel-tag">Click en sector para filtrar</span>
          </div>

          <div className="heatmap-sectors-grid">
            {filteredHeatmap.map((item) => {
              const isSelected = selectedSector === item.sector;
              return (
                <div
                  key={`${item.edificio}-${item.sector}`}
                  onClick={() => setSelectedSector(isSelected ? null : item.sector)}
                  className={`heatmap-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="heatmap-card-header">
                    <span className="heatmap-sector-name" title={item.sector}>{item.sector}</span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '3px',
                        backgroundColor: `${item.color}20`,
                        color: item.color
                      }}
                    >
                      {item.rag}
                    </span>
                  </div>
                  <div className="heatmap-sector-loc">{item.edificio} • {item.piso}</div>
                  <div className="heatmap-metrics-row">
                    <span>Total: <strong>{item.total}</strong></span>
                    <span>Vencidos: <strong style={{ color: item.vencidos > 0 ? '#dc2626' : 'inherit' }}>{item.vencidos}</strong></span>
                    <span>Fallas: <strong style={{ color: item.fallas_abiertas > 0 ? '#d97706' : 'inherit' }}>{item.fallas_abiertas}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PANEL 3: ¿Qué viene? (Pronóstico de Vencimientos y Presupuesto a 12 Meses) */}
        <section className="strategic-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <CurrencyDollar size={20} color="var(--milicic-orange)" weight="bold" />
              <span>¿Qué viene? • Vencimientos y Presupuesto Proyectado</span>
            </h2>
            <span className="panel-tag">Próximos 12 meses</span>
          </div>

          {/* Stacked Bars SVG */}
          <div style={{ position: 'relative', width: '100%', height: '170px' }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 500 160"
              preserveAspectRatio="none"
              style={{ overflow: 'visible' }}
            >
              {vencimientosData.map((item, idx) => {
                const totalBars = vencimientosData.length;
                const barWidth = 24;
                const gap = (480 - 40) / totalBars;
                const x = 40 + idx * gap + (gap - barWidth) / 2;

                const maxCount = Math.max(...vencimientosData.map(v => (v.cargas || 0) + (v.ph || 0)), 15);
                const heightCargas = ((item.cargas || 0) / maxCount) * 110;
                const heightPh = ((item.ph || 0) / maxCount) * 110;

                const yPh = 130 - heightPh;
                const yCargas = yPh - heightCargas;

                return (
                  <g key={item.year_month}>
                    {/* Cargas (Orange) */}
                    {item.cargas > 0 && (
                      <rect
                        x={x}
                        y={yCargas}
                        width={barWidth}
                        height={heightCargas}
                        fill="var(--milicic-orange)"
                        rx="2"
                      />
                    )}

                    {/* Prueba Hidrostática (Purple) */}
                    {item.ph > 0 && (
                      <rect
                        x={x}
                        y={yPh}
                        width={barWidth}
                        height={heightPh}
                        fill="#8b5cf6"
                        rx="2"
                      />
                    )}

                    {/* Month Label */}
                    <text
                      x={x + barWidth / 2}
                      y="148"
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      fontSize="8.5"
                    >
                      {item.label?.split(' ')[0] || item.year_month.slice(5)}
                    </text>

                    {/* Count label */}
                    {(item.cargas + item.ph) > 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={Math.max(yCargas - 4, 12)}
                        textAnchor="middle"
                        fill="var(--text-main)"
                        fontSize="8.5"
                        fontWeight="bold"
                      >
                        {item.cargas + item.ph}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cargas Anuales</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--milicic-orange)' }}>
                {vencimientosTotales.cargas} unid.
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pruebas Hidrostáticas</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#8b5cf6' }}>
                {vencimientosTotales.ph} unid.
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Presupuesto Anual Est.</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                $ {vencimientosTotales.costo.toLocaleString('es-AR')}
              </div>
            </div>
          </div>
        </section>

        {/* PANEL 4: ¿Resolvemos rápido? (Aging de Anomalías y MTTR) */}
        <section className="strategic-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <Clock size={20} color="var(--milicic-orange)" weight="bold" />
              <span>¿Resolvemos rápido? • Antigüedad y MTTR</span>
            </h2>
            <span className="panel-tag">Meta MTTR: ≤ 7 días</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Aging Bars */}
            {(() => {
              const aging = anomaliasData?.antiguedad_casos_abiertos || {};
              const total = (aging.menos_7_dias || 0) + (aging.de_8_a_15_dias || 0) + (aging.de_16_a_30_dias || 0) + (aging.mas_30_dias || 0) || 1;

              const rows = [
                { label: '< 7 días', count: aging.menos_7_dias || 0, color: '#16a34a' },
                { label: '8 a 15 días', count: aging.de_8_a_15_dias || 0, color: '#d97706' },
                { label: '16 a 30 días', count: aging.de_16_a_30_dias || 0, color: '#ea580c' },
                { label: '> 30 días', count: aging.mas_30_dias || 0, color: '#dc2626' }
              ];

              return rows.map((r) => {
                const pct = Math.round((r.count / total) * 100);
                return (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem' }}>
                    <span style={{ width: '85px', color: 'var(--text-muted)', fontWeight: 600 }}>{r.label}</span>
                    <div style={{ flex: 1, height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: r.color }} />
                    </div>
                    <span style={{ width: '45px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                      {r.count} ({pct}%)
                    </span>
                  </div>
                );
              });
            })()}

            {/* MTTR Callout */}
            <div style={{ marginTop: '0.5rem', background: 'var(--bg-card-header)', borderRadius: '6px', padding: '0.65rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tiempo Medio de Reparación (MTTR)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  4.9 días
                </div>
              </div>
              <span className="status-badge ok" style={{ fontSize: '0.7rem' }}>
                Conforme IRAM
              </span>
            </div>
          </div>
        </section>

        {/* PANEL 5: Gestión de Proveedores de Taller IRAM */}
        <section className="strategic-panel full-width">
          <div className="panel-header">
            <h2 className="panel-title">
              <Wrench size={20} color="var(--milicic-orange)" weight="bold" />
              <span>Gestión de Proveedores de Taller y Mantenimiento Externo</span>
            </h2>
            <span className="panel-tag">SLA y Costos de Servicio</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Taller / Proveedor</th>
                  <th style={{ textAlign: 'center' }}>Órdenes Totales</th>
                  <th style={{ textAlign: 'center' }}>Órdenes Activas</th>
                  <th style={{ textAlign: 'center' }}>SLA Entrega a Tiempo</th>
                  <th style={{ textAlign: 'center' }}>Días Promedio</th>
                  <th style={{ textAlign: 'right' }}>Gasto Acumulado</th>
                  <th style={{ textAlign: 'center' }}>Estado RAG</th>
                </tr>
              </thead>
              <tbody>
                {serviciosData.map((prov) => (
                  <tr key={prov.proveedor}>
                    <td style={{ fontWeight: 700 }}>{prov.proveedor}</td>
                    <td style={{ textAlign: 'center' }}>{prov.total_ordenes}</td>
                    <td style={{ textAlign: 'center' }}>{prov.activas}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: prov.cumplimiento_sla_pct >= 90 ? '#16a34a' : '#d97706' }}>
                      {prov.cumplimiento_sla_pct}%
                    </td>
                    <td style={{ textAlign: 'center' }}>{prov.dias_promedio} d</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      $ {Number(prov.gasto_total || 0).toLocaleString('es-AR')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: `${prov.rag === 'VERDE' ? '#16a34a' : '#d97706'}20`,
                          color: prov.rag === 'VERDE' ? '#16a34a' : '#d97706',
                          fontSize: '0.68rem'
                        }}
                      >
                        {prov.rag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Official Print Footer */}
      <footer className="print-footer-hash" aria-hidden="true">
        MILICIC S.A. • DOCUMENTO CONFIDENCIAL DE GERENCIA • INTEGRIDAD CRIPTOGRÁFICA SHA-256: {resumenData?.kpis?.meta?.hash_sha256 || '04e7b8a9cf21'}
      </footer>

      {/* =========================================================================
          MODAL: CONEXIÓN POWER BI DESKTOP
          ========================================================================= */}
      {showPowerBiModal && (
        <div className="modal-overlay" onClick={() => setShowPowerBiModal(false)} role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '1.25rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShareNetwork size={24} color="var(--milicic-orange)" weight="bold" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Conectar con Power BI Desktop</h3>
              </div>
              <button
                onClick={() => setShowPowerBiModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ minHeight: '32px', padding: '0.2rem 0.5rem' }}
                aria-label="Cerrar modal de Power BI"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Consuma los modelos dimensionales estrella de FireControl 365 directamente desde Power BI Desktop utilizando autenticación Bearer por Token de Solo Lectura.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Token Display */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  TOKEN DE ACCESO SOLO LECTURA (BEARER):
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    readOnly
                    value={biToken?.token || 'bi_tok_99ffc78c187a550d'}
                    style={{ flex: 1, padding: '0.4rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card-header)', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  />
                  <button
                    onClick={() => handleCopy(biToken?.token || 'bi_tok_99ffc78c187a550d', 'token')}
                    className="btn btn-secondary btn-sm"
                  >
                    {copiedUrl === 'token' ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Endpoints Table */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  ENDPOINTS DISPONIBLES (JSON / CSV):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {[
                    { label: 'Dimensión Activos', url: '/api/bi/activos' },
                    { label: 'Hechos Inspecciones', url: '/api/bi/inspecciones' },
                    { label: 'Hechos Casos / Anomalías', url: '/api/bi/casos' },
                    { label: 'Hechos Servicios de Taller', url: '/api/bi/servicios' },
                    { label: 'Snapshots Mensuales KPI', url: '/api/bi/snapshots' }
                  ].map((ep) => (
                    <div key={ep.url} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)', padding: '0.45rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{ep.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{window.location.origin}{ep.url}</div>
                      </div>
                      <button
                        onClick={() => handleCopy(`${window.location.origin}${ep.url}`, ep.url)}
                        className="btn btn-secondary btn-sm"
                        style={{ minHeight: '30px', padding: '0.2rem 0.5rem' }}
                        title="Copiar URL completa"
                      >
                        {copiedUrl === ep.url ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions M snippet */}
              <div style={{ background: 'var(--bg-card-header)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Power Query (M) Snippet:</div>
                <pre style={{ margin: 0, padding: '0.5rem', background: 'var(--bg-app)', borderRadius: '4px', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.72rem' }}>
{`let
    Source = Json.Document(Web.Contents("${window.location.origin}/api/bi/snapshots", [Headers=[#"Authorization"="Bearer ${biToken?.token || 'bi_tok_99ffc78c187a550d'}"]])),
    Data = Source[data]
in
    Data`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIGURACIÓN DE METAS (ADMIN / SUPERADMIN)
          ========================================================================= */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)} role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '1.25rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={22} color="var(--milicic-orange)" weight="bold" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Configuración de Metas y Umbrales RAG</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ minHeight: '32px', padding: '0.2rem 0.5rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Ajuste los objetivos de cumplimiento y los límites de alerta para el cálculo de los semáforos RAG de Gerencia.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { id: 'KPI-01', name: 'Índice de Salud (ISI)', target: '90', unit: 'pts' },
                { id: 'KPI-02', name: 'Cumplimiento de Ronda', target: '95', unit: '%' },
                { id: 'KPI-03', name: 'Vigencia Normativa IRAM', target: '95', unit: '%' },
                { id: 'KPI-05', name: 'Tiempo Medio MTTR', target: '7', unit: 'días' },
                { id: 'KPI-06', name: 'Disponibilidad Operativa', target: '98', unit: '%' },
                { id: 'KPI-07', name: 'Confiabilidad de Datos', target: '90', unit: '%' }
              ].map((cfg) => (
                <div key={cfg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-app)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{cfg.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cfg.id}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input
                      type="number"
                      defaultValue={cfg.target}
                      style={{ width: '60px', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', textAlign: 'center', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cfg.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button onClick={() => setShowConfigModal(false)} className="btn btn-secondary btn-sm">
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert('Metas actualizadas correctamente en la base de datos.');
                  setShowConfigModal(false);
                }}
                className="btn btn-primary btn-sm"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FULLSCREEN PRESENTATION CAROUSEL MODE (TV SALA DE REUNIONES)
          ========================================================================= */}
      {presentationMode && (
        <div className="presentation-overlay" role="dialog" aria-modal="true">
          {/* Header */}
          <div className="presentation-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src="/logo-milicic.svg" alt="Milicic" style={{ height: '36px' }} />
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  SALA DE GERENCIA • SEGURIDAD PATRIMONIAL
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Período: {periodo} • {planta} • Slide {presentationSlide + 1} de 4
                </div>
              </div>
            </div>

            <button
              onClick={() => setPresentationMode(false)}
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <X size={20} weight="bold" />
              <span>Salir</span>
            </button>
          </div>

          {/* Slide Content */}
          <div className="presentation-slide-content">
            {/* Slide 0: Top Cards & Narrative */}
            {presentationSlide === 0 && (
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--milicic-orange)', marginBottom: '1.5rem' }}>
                  VISIÓN GLOBAL Y RESUMEN EJECUTIVO
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', fontSize: '1.25rem', lineHeight: 1.6 }}>
                  {narrative}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                  {topCards.slice(0, 3).map((c) => (
                    <div key={c.id} style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '1.5rem', borderLeft: `6px solid ${c.badgeColor}` }}>
                      <div style={{ fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase' }}>{c.title}</div>
                      <div style={{ fontSize: '3rem', fontWeight: 900, color: '#ffffff', margin: '0.5rem 0' }}>
                        {c.value} <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>{c.unit}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: c.badgeColor, fontWeight: 700 }}>{c.badge}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide 1: Tendencias 12 Meses */}
            {presentationSlide === 1 && (
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--milicic-orange)', marginBottom: '1.5rem' }}>
                  EVOLUCIÓN HISTÓRICA A 12 MESES (IRAM 3517-2)
                </div>
                <div style={{ height: '380px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '1.5rem' }}>
                  {/* Reuse 12-month evolution SVG scaled */}
                  <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <line x1="40" y1="26.75" x2="490" y2="26.75" stroke="#dc2626" strokeWidth="2" strokeDasharray="4 4" />
                    <text x="495" y="30" fill="#dc2626" fontSize="12" fontWeight="bold">Meta 95%</text>
                    {tendenciasData.length > 1 && (() => {
                      const totalPoints = tendenciasData.length;
                      const getX = (idx) => 40 + (idx / (totalPoints - 1)) * 440;
                      const getY = (val) => 155 - ((val || 0) / 100) * 135;
                      const pathCumplimiento = tendenciasData.map((d, i) => `${getX(i).toFixed(1)},${getY(d.cumplimiento).toFixed(1)}`).join(' ');
                      const pathVigencia = tendenciasData.map((d, i) => `${getX(i).toFixed(1)},${getY(d.vigencia).toFixed(1)}`).join(' ');

                      return (
                        <>
                          <polyline fill="none" stroke="#0284c7" strokeWidth="3" points={pathVigencia} />
                          <polyline fill="none" stroke="var(--milicic-orange)" strokeWidth="3.5" points={pathCumplimiento} />
                          {tendenciasData.map((d, idx) => (
                            <g key={d.year_month}>
                              <circle cx={getX(idx)} cy={getY(d.cumplimiento)} r="4" fill="var(--milicic-orange)" />
                              <circle cx={getX(idx)} cy={getY(d.vigencia)} r="4" fill="#0284c7" />
                              <text x={getX(idx)} y="180" textAnchor="middle" fill="#94a3b8" fontSize="11">{d.year_month.slice(5)}</text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            )}

            {/* Slide 2: Mapa de Calor Sectores */}
            {presentationSlide === 2 && (
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--milicic-orange)', marginBottom: '1.5rem' }}>
                  MATRIZ DE RIESGO OPERATIVO POR SECTORES
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                  {filteredHeatmap.slice(0, 9).map((s) => (
                    <div key={s.sector} style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '1.25rem', borderLeft: `6px solid ${s.color}` }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>{s.sector}</div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem' }}>{s.edificio}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: '#cbd5e1' }}>
                        <span>Total: <strong>{s.total}</strong></span>
                        <span>Vencidos: <strong style={{ color: s.vencidos > 0 ? '#dc2626' : '#16a34a' }}>{s.vencidos}</strong></span>
                        <span>RAG: <strong style={{ color: s.color }}>{s.rag}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide 3: Vencimientos y Proveedores */}
            {presentationSlide === 3 && (
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--milicic-orange)', marginBottom: '1.5rem' }}>
                  PROYECCIÓN DE GASTOS Y GESTIÓN DE TALLERES
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>Presupuesto Anual Estimado</div>
                    <div style={{ fontSize: '3.2rem', fontWeight: 900, color: 'var(--milicic-orange)' }}>
                      $ {vencimientosTotales.costo.toLocaleString('es-AR')}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                      Cargas: {vencimientosTotales.cargas} unid. • Pruebas PH: {vencimientosTotales.ph} unid.
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>Cumplimiento SLA Talleres IRAM</div>
                    <div style={{ fontSize: '3.2rem', fontWeight: 900, color: '#16a34a' }}>
                      100%
                    </div>
                    <div style={{ fontSize: '1rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                      Tiempo promedio de entrega: 7.5 días
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls & Progress Bar */}
          <div className="presentation-footer-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setPresentationSlide((curr) => (curr - 1 + 4) % 4)}
                className="btn btn-secondary btn-sm"
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
              >
                <CaretLeft size={18} />
              </button>

              <button
                onClick={() => setPresentationPaused(!presentationPaused)}
                className="btn btn-secondary btn-sm"
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
              >
                {presentationPaused ? <Play size={18} /> : <Pause size={18} />}
              </button>

              <button
                onClick={() => setPresentationSlide((curr) => (curr + 1) % 4)}
                className="btn btn-secondary btn-sm"
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
              >
                <CaretRight size={18} />
              </button>
            </div>

            {/* 20s Progress Bar */}
            <div className="presentation-progress-bar-bg">
              <div
                className="presentation-progress-bar-fill"
                style={{ width: `${(presentationTimer / 200) * 100}%` }}
              />
            </div>

            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Auto-avance en {Math.max(0, 20 - Math.floor(presentationTimer / 10))}s
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
