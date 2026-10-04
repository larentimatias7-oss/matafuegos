const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(__dirname, '../docs/documento');

// CSS Base para Páginas A4 Exactas y Rígidas
const baseStyles = `
  @charset "UTF-8";
  @page {
    size: 210mm 297mm;
    margin: 0;
  }

  *, *:before, *:after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    font-size: 8.8pt;
    line-height: 1.45;
  }

  .pdf-page {
    width: 210mm;
    height: 297mm;
    max-height: 297mm;
    margin: 0 auto;
    padding: 14mm 16mm 12mm 16mm;
    background: #ffffff;
    position: relative;
    page-break-after: always;
    break-after: page;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  @media screen {
    .pdf-page {
      margin: 15px auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border-radius: 4px;
    }
  }

  .page-header {
    height: 7mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #cbd5e1;
    font-size: 7.2pt;
    color: #64748b;
    margin-bottom: 8px;
    flex-shrink: 0;
  }
  .page-header strong {
    color: #0f172a;
    font-weight: 700;
  }

  .page-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .page-footer {
    height: 6mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e2e8f0;
    font-size: 7.2pt;
    color: #64748b;
    margin-top: 8px;
    flex-shrink: 0;
  }

  /* Portada Especial */
  .cover-page {
    padding: 24mm 20mm;
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 65%, #0f172a 100%);
    color: #ffffff;
  }
  .cover-top-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 8mm;
    background: linear-gradient(90deg, #ea580c 0%, #f97316 100%);
  }

  /* Títulos */
  h1.sec-title {
    font-size: 16pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2px solid #ea580c;
    padding-bottom: 4px;
    margin: 0 0 10px 0;
    letter-spacing: -0.01em;
  }
  h2.sub-title {
    font-size: 11pt;
    font-weight: 700;
    color: #0f172a;
    margin: 8px 0 4px 0;
  }
  h3.item-title {
    font-size: 9.5pt;
    font-weight: 700;
    color: #c2410c;
    margin: 6px 0 2px 0;
  }

  p {
    margin: 0 0 8px 0;
    text-align: justify;
  }

  /* Callout En pocas palabras */
  .callout-summary {
    background: #fff7ed;
    border-left: 4px solid #ea580c;
    border-top: 1px solid #fed7aa;
    border-right: 1px solid #fed7aa;
    border-bottom: 1px solid #fed7aa;
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
    margin: 6px 0 10px 0;
  }
  .callout-summary strong.title {
    display: block;
    font-size: 8.5pt;
    color: #c2410c;
    font-weight: 800;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .callout-summary p {
    margin: 0;
    color: #334155;
    font-size: 8.4pt;
    line-height: 1.4;
  }

  /* Deslinde Legal */
  .callout-legal {
    background: #fef2f2;
    border: 1px solid #f87171;
    border-left: 4px solid #dc2626;
    padding: 8px 12px;
    border-radius: 6px;
    margin: 6px 0 10px 0;
  }
  .callout-legal strong {
    color: #991b1b;
    font-size: 8.5pt;
    text-transform: uppercase;
    display: block;
    margin-bottom: 2px;
  }
  .callout-legal p {
    color: #7f1d1d;
    font-size: 7.8pt;
    line-height: 1.35;
    margin: 0;
  }

  /* Recuadro Técnico para TI */
  .tech-box {
    background: #0f172a;
    color: #f1f5f9;
    border-radius: 6px;
    padding: 8px 12px;
    margin: 6px 0 8px 0;
    font-size: 7.8pt;
  }
  .tech-box-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #334155;
    padding-bottom: 3px;
    margin-bottom: 5px;
    font-weight: 700;
    color: #38bdf8;
    text-transform: uppercase;
    font-size: 7.2pt;
    letter-spacing: 0.05em;
  }
  .tech-box pre {
    margin: 0;
    font-family: Consolas, "Courier New", monospace;
    font-size: 7.4pt;
    line-height: 1.35;
    color: #e2e8f0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Para Profundizar / Archivos de Código */
  .code-ref {
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 5px;
    padding: 6px 10px;
    margin: 6px 0 4px 0;
    font-size: 7.8pt;
    color: #475569;
  }
  .code-ref strong {
    color: #0f172a;
  }
  .code-ref code {
    background: #e2e8f0;
    color: #0f172a;
    padding: 1px 4px;
    border-radius: 3px;
    font-family: Consolas, monospace;
    font-size: 7.4pt;
  }

  /* Tablas */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 8px 0;
    font-size: 7.8pt;
  }
  th {
    background: #0f172a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 5px 8px;
    border: 1px solid #334155;
    font-size: 7.5pt;
    text-transform: uppercase;
  }
  td {
    padding: 4px 8px;
    border: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: middle;
  }
  tr:nth-child(even) td {
    background: #f8fafc;
  }

  /* Badges de Estado */
  .badge-tag {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 3px;
    font-weight: 700;
    font-size: 7pt;
    text-transform: uppercase;
  }
  .tag-impl { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .tag-parc { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
  .tag-prop { background: #eff6ff; color: #1e40af; border: 1px solid #93c5fd; }

  /* Figuras */
  .figure-wrapper {
    margin: 6px 0 8px 0;
    text-align: center;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px;
  }
  .figure-wrapper img {
    max-width: 100%;
    height: auto;
    max-height: 180px;
    display: block;
    margin: 0 auto 4px auto;
  }
  .figure-caption {
    font-size: 7.8pt;
    font-weight: 700;
    color: #0f172a;
  }
  .figure-look {
    font-size: 7.2pt;
    color: #64748b;
    font-style: italic;
  }
`;

// ==============================================================================
// 1. GENERACIÓN DEL RESUMEN EJECUTIVO (4 PÁGINAS EXACTAS)
// ==============================================================================
function buildExecutiveSummary() {
  const p1 = `
  <div class="pdf-page">
    <div class="page-header">
      <span><strong>MILICIC S.A.</strong> • FireControl 365</span>
      <span>INFORME DE SÍNTESIS EJECUTIVA</span>
    </div>
    <div class="page-content">
      <div style="border-bottom: 2.5px solid #ea580c; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <span class="badge-tag tag-impl" style="margin-bottom: 4px;">RESUMEN PARA LA DIRECCIÓN</span>
          <h1 style="margin: 0; padding: 0; font-size: 18pt; line-height: 1.1; color: #0f172a;">
            Milicic <span style="color: #ea580c;">FireControl 365</span>
          </h1>
          <p style="margin: 2px 0 0 0; color: #64748b; font-size: 8.5pt;">Control Periódico de Extintores • Norma IRAM 3517-2 • Plataforma Digital de Seguridad</p>
        </div>
        <div style="text-align: right;">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 6px;">
            <img src="../../public/logo-milicic.svg" alt="Milicic S.A." style="height: 26px;" onerror="this.src='../../public/logo-milicic.png'" />
          </div>
          <div style="font-size: 7pt; color: #94a3b8; margin-top: 3px;">Octubre 2026 • v1.0.0 (Commit 951738c)</div>
        </div>
      </div>

      <div class="callout-legal">
        <strong>Aviso Mandatorio de Responsabilidad y Criterio Técnico</strong>
        <p>Este documento es un resumen de arquitectura y gestión. No constituye asesoramiento legal ni certificación de cumplimiento normativo. El checklist, los plazos y los períodos de retención deben ser validados formalmente por el responsable de Seguridad e Higiene y, si corresponde, asesoría legal.</p>
      </div>

      <h2 class="sub-title">1. Qué es Milicic FireControl 365 y qué Problema Resuelve</h2>
      <p><strong>Milicic FireControl 365</strong> es la plataforma institucional concebida para erradicar las planillas de papel y tarjetas manuales en la fiscalización del parque de <strong>130 extintores en Base Central Rosario</strong>. Provee un circuito digital ágil mediante códigos QR, funcionamiento garantizado en subsuelos sin señal y un tablero ejecutivo con 12 indicadores estratégicos.</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 8px 0;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 10px;">
          <strong style="color: #991b1b; font-size: 8.2pt; display: block; margin-bottom: 4px;">❌ Situación Previa (Papel)</strong>
          <ul style="margin: 0; padding-left: 14px; font-size: 7.8pt; color: #7f1d1d; line-height: 1.35;">
            <li>Tarjetas de cartón deterioradas por grasa, polvo o lluvia.</li>
            <li>Incertidumbre sobre cilindros despresurizados o vencidos.</li>
            <li>Semanas de demora en recopilar carpetas ante auditorías de ART.</li>
            <li>Riesgo de firmas simuladas sin presencia física en el puesto.</li>
          </ul>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 10px;">
          <strong style="color: #166534; font-size: 8.2pt; display: block; margin-bottom: 4px;">✔ Logro Actual (FireControl 365)</strong>
          <ul style="margin: 0; padding-left: 14px; font-size: 7.8pt; color: #14532d; line-height: 1.35;">
            <li>Inspección completa en menos de 15 segundos vía código QR.</li>
            <li>100% operativo en subsuelos y depósitos sin señal (Offline).</li>
            <li>Apertura automática de caso de alta prioridad ante fallas.</li>
            <li>Inmutabilidad pericial estricta (bloqueo HTTP 405 en edición).</li>
          </ul>
        </div>
      </div>

      <h2 class="sub-title" style="margin-top: 10px;">A Quién Sirve el Sistema</h2>
      <p>Diseñado bajo una visión de doble propósito: los <strong>inspectores y supervisores de HyS</strong> cuentan con una PWA ultrarrápida con cambio de turno por PIN; la <strong>Gerencia de Operaciones y Dirección</strong> dispone de un tablero en tiempo real para anticipar compras y campañas de recarga antes del vencimiento legal.</p>
    </div>
    <div class="page-footer">
      <span>Milicic S.A. • FireControl 365 — Resumen Ejecutivo</span>
      <span>Página 1 de 4</span>
    </div>
  </div>`;

  const p2 = `
  <div class="pdf-page">
    <div class="page-header">
      <span><strong>MILICIC S.A.</strong> • FireControl 365</span>
      <span>OPERACIÓN EN CAMPO Y GARANTÍAS TÉCNICAS</span>
    </div>
    <div class="page-content">
      <h1 class="sec-title">2. Un Día de Ronda Operativa</h1>
      <p>El circuito de inspección estandariza el control en 5 pasos fluidos que garantizan presencia real y calidad técnica en cada puesto:</p>

      <div class="figure-wrapper">
        <img src="figuras/figura-3-flujo-dia-ronda.svg" alt="Flujo de Ronda" style="max-height: 130px;" />
        <div class="figure-caption">Figura A: Circuito de Ronda Mensual: Del inicio por PIN a la consolidación gerencial</div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 6px 0;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
          <strong style="color: #0f172a; font-size: 8pt;">1. Identificación Ágil por PIN</strong>
          <p style="font-size: 7.5pt; margin: 2px 0 0 0; color: #475569;">Ingreso en tablet compartida en 2 segundos con PIN de 4 dígitos. Bloqueo automático por 15 min al 5° fallo consecutivo.</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
          <strong style="color: #0f172a; font-size: 8pt;">2. Escaneo QR en Puesto</strong>
          <p style="font-size: 7.5pt; margin: 2px 0 0 0; color: #475569;">Lectura del código en baliza mediante public_id criptográfico. Despliega ficha técnica instantánea en pantalla.</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
          <strong style="color: #0f172a; font-size: 8pt;">3. Checklist IRAM 3517-2</strong>
          <p style="font-size: 7.5pt; margin: 2px 0 0 0; color: #475569;">6 puntos obligatorios: acceso, manómetro, precinto, cilindro, baliza y tarjeta. Alerta antifraude si dura menos de 5s.</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
          <strong style="color: #0f172a; font-size: 8pt;">4. Foto y Apertura de Caso</strong>
          <p style="font-size: 7.5pt; margin: 2px 0 0 0; color: #475569;">Ante cualquier tilde en rojo, la app exige foto (comprimida a 300 KB) y abre automáticamente un Caso de Mantenimiento.</p>
        </div>
      </div>

      <h2 class="sub-title" style="margin-top: 10px;">3. Garantías Técnicas y Límites Claros</h2>
      <table style="margin-top: 4px;">
        <thead>
          <tr>
            <th style="width: 50%;">Qué Garantiza la Plataforma</th>
            <th style="width: 50%;">Qué NO Garantiza (Límites Concretos)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Inmutabilidad Estricta:</strong> El servidor bloquea edición o borrado de inspecciones pasadas (HTTP 405).</td>
            <td><strong>No reemplaza el ensayo de taller:</strong> La calidad interna del agente y la elasticidad del acero exigen prueba física IRAM.</td>
          </tr>
          <tr>
            <td><strong>Continuidad Offline:</strong> Almacena en IndexedDB y comprime imágenes mediante Canvas al 70%.</td>
            <td><strong>No reemplaza la firma profesional:</strong> La app aporta la evidencia de gestión; la responsabilidad civil exige perito de HyS.</td>
          </tr>
          <tr>
            <td><strong>Backups Consistentes:</strong> Copia en caliente VACUUM INTO con verificación automática (RTO &lt; 15 min).</td>
            <td><strong>Punto único de falla mitigado:</strong> SQLite mononodo requiere backups diarios para recuperarse ante daño físico del servidor.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="page-footer">
      <span>Milicic S.A. • FireControl 365 — Resumen Ejecutivo</span>
      <span>Página 2 de 4</span>
    </div>
  </div>`;

  const p3 = `
  <div class="pdf-page">
    <div class="page-header">
      <span><strong>MILICIC S.A.</strong> • FireControl 365</span>
      <span>TABLERO DE GERENCIA Y MÉTRICAS BI</span>
    </div>
    <div class="page-content">
      <h1 class="sec-title">4. El Tablero de Gerencia (Power BI Style)</h1>
      <p>El módulo ejecutivo <code>/gerencia</code> provee información estratégica de alto nivel para orientar decisiones de inversión y prevenir sanciones legales:</p>

      <div class="figure-wrapper">
        <img src="capturas/captura-4-tablero-gerencia.png" alt="Tablero Gerencial" style="max-height: 200px; object-fit: contain;" />
        <div class="figure-caption">Captura B: Tablero de Control Gerencial con KPIs, Tendencias Anuales y Mapa de Calor</div>
      </div>

      <h2 class="sub-title" style="margin-top: 8px;">Pilares del Modelo de Información Gerencial</h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 6px 0;">
        <div style="background: #fff7ed; border: 1px solid #fdba74; border-radius: 6px; padding: 6px 8px;">
          <strong style="color: #c2410c; font-size: 8pt; display: block;">Índice de Salud ISPCI</strong>
          <p style="font-size: 7.5pt; margin: 2px 0 0 0; color: #334155;">Puntaje unificado de 0 a 100 que pondera cobertura mensual (35%), vigencia técnica (35%), ausencia de fallas (20%) y SLA de taller (10%).</p>
        </div>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 6px 8px;">
          <strong style="color: #1d4ed8; font-size: 8pt; display: block;">Mapa de Calor Sectorial</strong>
          <p style="font-size: 7.5pt; margin: 2px 0 0 0; color: #334155;">Identifica al instante qué plantas, pisos o sectores de obra concentran el mayor índice de anomalías o retrasos en la inspección.</p>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 8px;">
          <strong style="color: #166534; font-size: 8pt; display: block;">Proyección a 12 Meses</strong>
          <p style="font-size: 7.5pt; margin: 2px 0 0 0; color: #334155;">Anticipa la cantidad de extintores que vencerán mes a mes (cargas y pruebas hidráulicas), permitiendo presupuestar compras.</p>
        </div>
      </div>

      <h2 class="sub-title" style="margin-top: 8px;">Privacidad y Gobernanza de Datos</h2>
      <p style="font-size: 8pt; color: #475569;">En estricto cumplimiento de la Ley 25.326 y la política corporativa de Milicic, <strong>el tablero prohíbe rankings de rendimiento individual</strong>. La analítica se enfoca exclusivamente en la seguridad de las instalaciones y el estado técnico de los activos.</p>
    </div>
    <div class="page-footer">
      <span>Milicic S.A. • FireControl 365 — Resumen Ejecutivo</span>
      <span>Página 3 de 4</span>
    </div>
  </div>`;

  const p4 = `
  <div class="pdf-page">
    <div class="page-header">
      <span><strong>MILICIC S.A.</strong> • FireControl 365</span>
      <span>ESTADO DE CAPACIDADES Y PLAN DE IMPLANTACIÓN</span>
    </div>
    <div class="page-content">
      <h1 class="sec-title">5. Estado Consolidado de Capacidades</h1>
      <table>
        <thead>
          <tr>
            <th>Capacidad Clave del Sistema</th>
            <th style="text-align: center;">Estado</th>
            <th>Situación Operativa Verificable</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Escaneo QR y Checklist 6 Puntos IRAM</td>
            <td style="text-align: center;"><span class="badge-tag tag-impl">[Implementado]</span></td>
            <td>Operativo en teléfonos y tablets; lectura instantánea de public_id.</td>
          </tr>
          <tr>
            <td>Modo Offline con IndexedDB y Compresión</td>
            <td style="text-align: center;"><span class="badge-tag tag-impl">[Implementado]</span></td>
            <td>Encolado local y fotos comprimidas a 300 KB vía Canvas.</td>
          </tr>
          <tr>
            <td>Apertura Automática de Caso por Anomalía</td>
            <td style="text-align: center;"><span class="badge-tag tag-impl">[Implementado]</span></td>
            <td>Crea caso ALTA en el servidor al registrar tilde rojo.</td>
          </tr>
          <tr>
            <td>Cambio por PIN en Tablets con Bloqueo</td>
            <td style="text-align: center;"><span class="badge-tag tag-impl">[Implementado]</span></td>
            <td>Endpoint público con bloqueo temporal de 15 min al 5° intento.</td>
          </tr>
          <tr>
            <td>Inmutabilidad de Inspecciones y Auditoría</td>
            <td style="text-align: center;"><span class="badge-tag tag-impl">[Implementado]</span></td>
            <td>Bloqueo HTTP 405 en edición/borrado; bitácora append-only.</td>
          </tr>
          <tr>
            <td>Tablero de Gerencia y Snapshots con Hash</td>
            <td style="text-align: center;"><span class="badge-tag tag-impl">[Implementado]</span></td>
            <td>12 KPIs calculados con huella digital SHA-256 inmutable.</td>
          </tr>
          <tr>
            <td>Alertas Inmediatas por Correo / Teams</td>
            <td style="text-align: center;"><span class="badge-tag tag-parc">[Parcial]</span></td>
            <td>Webhook activo; falta configurar transportador SMTP saliente.</td>
          </tr>
          <tr>
            <td>Plano Interactivo de Planta (CAD/SVG)</td>
            <td style="text-align: center;"><span class="badge-tag tag-prop">[Propuesta]</span></td>
            <td>Diseñado para el Horizonte 2 (Mes 3).</td>
          </tr>
          <tr>
            <td>Firma Digital Avanzada (Ley 25.506)</td>
            <td style="text-align: center;"><span class="badge-tag tag-prop">[Propuesta]</span></td>
            <td>Diseñado para el Horizonte 2 (Mes 3).</td>
          </tr>
        </tbody>
      </table>

      <h2 class="sub-title" style="margin-top: 8px;">6. Hoja de Ruta y Próximos Pasos (Plan Piloto 4 Semanas)</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 6px 0;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
          <strong style="color: #0f172a; font-size: 7.8pt;">Cronograma del Plan Piloto:</strong>
          <ul style="margin: 3px 0 0 0; padding-left: 14px; font-size: 7.3pt; color: #475569; line-height: 1.35;">
            <li><strong>Semana 1:</strong> Validación física de 130 equipos en Base Rosario.</li>
            <li><strong>Semana 2:</strong> Pegado de etiquetas QR laminadas UV en balizas.</li>
            <li><strong>Semana 3:</strong> Taller práctico de 20 min con inspectores de HyS.</li>
            <li><strong>Semana 4:</strong> Primera ronda oficial digital y reporte gerencial.</li>
          </ul>
        </div>
        <div style="background: #fff7ed; border: 1px solid #fdba74; border-radius: 6px; padding: 6px 8px;">
          <strong style="color: #c2410c; font-size: 7.8pt;">Las 5 Mejoras Estratégicas:</strong>
          <ol style="margin: 3px 0 0 0; padding-left: 14px; font-size: 7.3pt; color: #475569; line-height: 1.35;">
            <li>Alertas directas por correo ante manómetro en rojo (Mes 1).</li>
            <li>Plano digital interactivo de Base Rosario (Mes 3).</li>
            <li>Firma digital con validez pericial Ley 25.506 (Mes 3).</li>
            <li>Extensión a hidrantes y luces de emergencia (Mes 6).</li>
            <li>Replicación continua en nube con Litestream (Mes 6).</li>
          </ol>
        </div>
      </div>

      <div style="margin-top: 14px; padding-top: 8px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 7.2pt; color: #64748b;">
        <div><strong>Área Emisora:</strong> Higiene, Seguridad &amp; TI • Milicic S.A.</div>
        <div><strong>Aprobación Técnica:</strong> Arquitectura de Software FireControl 365</div>
      </div>
    </div>
    <div class="page-footer">
      <span>Milicic S.A. • FireControl 365 — Resumen Ejecutivo</span>
      <span>Página 4 de 4</span>
    </div>
  </div>`;

  const fullHtml = `<!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Milicic FireControl 365 — Resumen Ejecutivo</title>
    <style>${baseStyles}</style>
  </head>
  <body>
    ${p1}
    ${p2}
    ${p3}
    ${p4}
  </body>
  </html>`;

  fs.writeFileSync(path.join(outputDir, 'resumen-ejecutivo.html'), fullHtml, 'utf8');
  console.log('resumen-ejecutivo.html (4 páginas exactas) generado con éxito.');
}

buildExecutiveSummary();
