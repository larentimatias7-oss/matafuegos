const fs = require('fs');
const path = require('path');

const manualMdPath = path.resolve(__dirname, '../docs/documento/MANUAL-TECNICO-ARQUITECTURA.md');
const resumenMdPath = path.resolve(__dirname, '../docs/documento/RESUMEN-EJECUTIVO.md');
const outputDir = path.resolve(__dirname, '../docs/documento');

// Hoja de estilos de impresión corporativa Milicic
const printStyles = `
  @charset "UTF-8";
  @page {
    size: A4 portrait;
    margin: 18mm 15mm 18mm 15mm;
  }
  @page :first {
    margin: 0;
  }

  *, *:before, *:after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    font-size: 9.8pt;
    line-height: 1.55;
    margin: 0;
    padding: 0;
  }

  /* Portada Corporativa */
  .cover-page {
    width: 210mm;
    height: 297mm;
    padding: 24mm 20mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
    color: #ffffff;
    page-break-after: always;
    break-after: page;
    position: relative;
    overflow: hidden;
  }

  .cover-page::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 8mm;
    background: linear-gradient(90deg, #ea580c 0%, #f97316 100%);
  }

  .cover-logo-box {
    background: #ffffff;
    padding: 10px 24px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    width: fit-content;
    box-shadow: 0 4px 15px rgba(0,0,0,0.25);
  }
  .cover-logo-box img {
    height: 44px;
    width: auto;
  }

  .cover-badge {
    display: inline-block;
    background: rgba(234, 88, 12, 0.2);
    border: 1px solid #ea580c;
    color: #fdba74;
    padding: 4px 14px;
    border-radius: 999px;
    font-size: 8.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 12px;
  }

  .cover-title {
    font-size: 26pt;
    font-weight: 900;
    line-height: 1.15;
    color: #ffffff;
    margin: 0 0 12px 0;
    letter-spacing: -0.02em;
  }
  .cover-title span {
    color: #f97316;
  }

  .cover-subtitle {
    font-size: 13pt;
    font-weight: 400;
    color: #cbd5e1;
    margin: 0 0 25px 0;
    line-height: 1.4;
    max-width: 90%;
  }

  .cover-meta-grid {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(226, 232, 240, 0.15);
    border-radius: 12px;
    padding: 16px 20px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 24px;
    font-size: 8.8pt;
  }
  .cover-meta-item strong {
    color: #94a3b8;
    display: block;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
  }
  .cover-meta-item span {
    color: #f8fafc;
    font-weight: 600;
  }

  /* Encabezados y Jerarquía */
  h1 {
    font-size: 19pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2.5px solid #ea580c;
    padding-bottom: 6px;
    margin-top: 0;
    margin-bottom: 16px;
    page-break-before: always;
    break-before: page;
  }

  h2 {
    font-size: 14pt;
    font-weight: 800;
    color: #0f172a;
    margin-top: 22px;
    margin-bottom: 10px;
    break-after: avoid;
    page-break-after: avoid;
  }

  h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #c2410c;
    margin-top: 16px;
    margin-bottom: 8px;
    break-after: avoid;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 10px 0;
    text-align: justify;
  }

  /* Callout En Pocas Palabras */
  .callout-summary {
    background: #fff7ed;
    border-left: 4.5px solid #ea580c;
    border-top: 1px solid #fed7aa;
    border-right: 1px solid #fed7aa;
    border-bottom: 1px solid #fed7aa;
    padding: 10px 14px;
    border-radius: 0 8px 8px 0;
    margin: 12px 0 16px 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .callout-summary strong.title {
    display: block;
    font-size: 9.5pt;
    color: #c2410c;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  .callout-summary p {
    margin: 0;
    color: #334155;
    font-size: 9.3pt;
    line-height: 1.45;
  }

  /* Deslinde Legal */
  .callout-legal {
    background: #fef2f2;
    border: 1.5px solid #f87171;
    border-left: 5px solid #dc2626;
    padding: 12px 16px;
    border-radius: 8px;
    margin: 14px 0 20px 0;
    break-inside: avoid;
  }
  .callout-legal h3 {
    color: #991b1b;
    margin: 0 0 6px 0;
    font-size: 10.5pt;
    text-transform: uppercase;
  }
  .callout-legal p {
    color: #7f1d1d;
    font-size: 8.8pt;
    line-height: 1.4;
    margin: 0;
  }

  /* Recuadro Técnico para TI */
  .tech-box {
    background: #0f172a;
    color: #f1f5f9;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 14px 0 18px 0;
    font-size: 8.5pt;
    break-inside: avoid;
    page-break-inside: avoid;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }
  .tech-box-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #334155;
    padding-bottom: 6px;
    margin-bottom: 8px;
    font-weight: 700;
    color: #38bdf8;
    text-transform: uppercase;
    font-size: 7.8pt;
    letter-spacing: 0.06em;
  }
  .tech-box pre {
    margin: 0;
    font-family: Consolas, "Courier New", monospace;
    font-size: 8pt;
    line-height: 1.4;
    color: #e2e8f0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Para Profundizar / Archivos de Código */
  .code-ref {
    background: #f8fafc;
    border: 1px dashed #94a3b8;
    border-radius: 6px;
    padding: 8px 12px;
    margin: 14px 0 22px 0;
    font-size: 8.5pt;
    color: #475569;
    break-inside: avoid;
  }
  .code-ref strong {
    color: #0f172a;
  }
  .code-ref code {
    background: #e2e8f0;
    color: #0f172a;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: Consolas, monospace;
    font-size: 8pt;
  }

  /* Tablas Corporativas */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 18px 0;
    font-size: 8.5pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  th {
    background: #0f172a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 7px 10px;
    border: 1px solid #334155;
    font-size: 8.2pt;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  td {
    padding: 6px 10px;
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
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .tag-impl {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }
  .tag-parc {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }
  .tag-prop {
    background: #eff6ff;
    color: #1e40af;
    border: 1px solid #93c5fd;
  }

  /* Figuras y Gráficos */
  .figure-wrapper {
    margin: 16px 0 20px 0;
    text-align: center;
    break-inside: avoid;
    page-break-inside: avoid;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  }
  .figure-wrapper img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto 10px auto;
  }
  .figure-caption {
    font-size: 8.3pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 3px;
  }
  .figure-look {
    font-size: 7.8pt;
    color: #64748b;
    font-style: italic;
  }

  /* Control de Saltos */
  .page-break {
    page-break-after: always;
    break-after: page;
  }
  .no-break {
    break-inside: avoid;
    page-break-inside: avoid;
  }
`;

// Helper para transformar Markdown estructurado en HTML semántico limpio
function markdownToHtml(md) {
  let html = md;

  // Normalizar saltos de línea Windows
  html = html.replace(/\r\n/g, '\n');

  // Convertir Callout de Deslinde Legal
  html = html.replace(
    /> \[!CAUTION\]\s*\n> ### (.*?)\n([\s\S]*?)(?=\n\n---|\n#|\n##|$)/g,
    '<div class="callout-legal"><h3>$1</h3><p>$2</p></div>'
  );

  // Convertir Callout En pocas palabras
  html = html.replace(
    /> \[!NOTE\]\s*\n> \*\*En pocas palabras:\*\*\s*(.*?)\n/g,
    '<div class="callout-summary"><strong class="title">💡 En pocas palabras</strong><p>$1</p></div>\n'
  );
  html = html.replace(
    /> \[!CAUTION\]\s*\n> \*\*En pocas palabras:\*\*\s*(.*?)\n/g,
    '<div class="callout-summary" style="border-left-color: #dc2626; background: #fef2f2;"><strong class="title" style="color: #991b1b;">⚠️ En pocas palabras: Límites y Responsabilidad</strong><p>$1</p></div>\n'
  );

  // Convertir Bloques Técnicos (```text Detalle Técnico... ```)
  html = html.replace(
    /```text\s*\nDetalle Técnico para TI y Auditores:\n([\s\S]*?)```/g,
    '<div class="tech-box"><div class="tech-box-header"><span>Detalle Verificable para TI y Auditoría</span><span>Código / SQL / Configuración</span></div><pre>$1</pre></div>'
  );

  // Convertir Para profundizar / Archivos del código
  html = html.replace(
    /> \*\*Para profundizar \/ Archivos del código:\*\*\s*\n> (.*?)\n/g,
    '<div class="code-ref"><strong>Para profundizar / Archivos del código:</strong><br/>$1</div>\n'
  );

  // Convertir Etiquetas de Estado [Implementado], [Parcial], [Propuesta]
  html = html.replace(/\[Implementado\]/g, '<span class="badge-tag tag-impl">[Implementado]</span>');
  html = html.replace(/\[Parcial\]/g, '<span class="badge-tag tag-parc">[Parcial]</span>');
  html = html.replace(/\[Propuesta\]/g, '<span class="badge-tag tag-prop">[Propuesta]</span>');

  // Tablas Markdown a HTML
  html = html.replace(/\n(\|.*\|\n\|[-:\s|]+\|\n(?:\|.*\|\n)+)/g, (match, tableContent) => {
    const lines = tableContent.trim().split('\n');
    let tableHtml = '<table><thead><tr>';
    
    // Header
    const headers = lines[0].split('|').slice(1, -1);
    headers.forEach(h => {
      tableHtml += `<th>${h.trim()}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    // Rows (ignorar línea 1 que es separador)
    for (let i = 2; i < lines.length; i++) {
      tableHtml += '<tr>';
      const cells = lines[i].split('|').slice(1, -1);
      cells.forEach(c => {
        tableHtml += `<td>${c.trim()}</td>`;
      });
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';
    return '\n' + tableHtml + '\n';
  });

  // Títulos H1, H2, H3
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');

  // Negritas y Cursivas
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bloques de código genéricos
  html = html.replace(/```(?:javascript|sql|bash|ini)?\n([\s\S]*?)```/g, '<div class="tech-box"><pre>$1</pre></div>');

  // Separadores
  html = html.replace(/\n---\n/g, '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>');

  // Párrafos
  const paragraphs = html.split('\n\n');
  const cleanParagraphs = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<h1') || p.startsWith('<h2') || p.startsWith('<h3') || 
        p.startsWith('<div') || p.startsWith('<table') || p.startsWith('<hr') ||
        p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('```')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
  });

  return cleanParagraphs.join('\n\n');
}

// Inyección de Figuras y Capturas en lugares estratégicos del texto del Manual
function injectVisualAssets(html) {
  let res = html;

  // Figura 1 en Sección 3 (Visión General)
  res = res.replace(
    '<h3>Esquema Conceptual Simple (Nivel Dirección)</h3>',
    `<h3>Esquema Conceptual Simple (Nivel Dirección)</h3>
    <div class="figure-wrapper">
      <img src="figuras/figura-1-mapa-sistema-ejecutivo.svg" alt="Mapa del Sistema Ejecutivo" />
      <div class="figure-caption">Figura 1: Mapa General del Sistema Milicic FireControl 365 (Nivel Dirección)</div>
      <div class="figure-look">Qué mirar: La simpleza del flujo de información desde el punto de riesgo en campo hasta el tablero gerencial sin planillas intermedias.</div>
    </div>`
  );

  // Figura 2 en Sección 3 (Técnica)
  res = res.replace(
    '<h3>Arquitectura Técnica Detallada (Nivel TI / Auditoría)</h3>',
    `<h3>Arquitectura Técnica Detallada (Nivel TI / Auditoría)</h3>
    <div class="figure-wrapper">
      <img src="figuras/figura-2-arquitectura-tecnica-red.svg" alt="Arquitectura Técnica y Contenedores" />
      <div class="figure-caption">Figura 2: Diagrama de Arquitectura de Red, Contenedores Docker y Base de Datos (Nivel TI)</div>
      <div class="figure-look">Qué mirar: El aislamiento del volumen persistente SQLite (/app/data), la terminación TLS en el proxy inverso y la comunicación segura con M365.</div>
    </div>`
  );

  // Figura 3 en Sección 4 (Un Día de Ronda)
  res = res.replace(
    '<h3>El Recorrido Paso a Paso en Campo</h3>',
    `<h3>El Recorrido Paso a Paso en Campo</h3>
    <div class="figure-wrapper">
      <img src="figuras/figura-3-flujo-dia-ronda.svg" alt="Flujo de un Día de Ronda" />
      <div class="figure-caption">Figura 3: Flujo Operativo de un Día de Ronda (De la Asignación al Tablero)</div>
      <div class="figure-look">Qué mirar: La secuencia de 5 fases operativas que reduce a 15 segundos el control por extintor y dispara casos automáticos ante fallas.</div>
    </div>`
  );

  // Capturas 1 y 2 en Sección 4 (Escaneo y Checklist)
  res = res.replace(
    '<h3>Detección de Falla y Apertura Automática de Caso</h3>',
    `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 16px 0;" class="no-break">
      <div class="figure-wrapper" style="margin: 0;">
        <img src="capturas/captura-1-escaner-qr.png" alt="Escáner QR en Móvil" style="max-height: 260px; object-fit: contain;" />
        <div class="figure-caption">Captura 1: Escaneo de Código QR e Identificación del Puesto (Móvil)</div>
      </div>
      <div class="figure-wrapper" style="margin: 0;">
        <img src="capturas/captura-2-checklist-inspeccion.png" alt="Checklist IRAM en Móvil" style="max-height: 260px; object-fit: contain;" />
        <div class="figure-caption">Captura 2: Formulario de Inspección de 6 Puntos IRAM 3517-2</div>
      </div>
    </div>
    <h3>Detección de Falla y Apertura Automática de Caso</h3>`
  );

  // Figura 4 en Sección 5 (Auth & PIN)
  res = res.replace(
    '<h3>Matriz de Roles y Rango Jerárquico</h3>',
    `<div class="figure-wrapper">
      <img src="figuras/figura-4-flujo-auth-pin.svg" alt="Flujo de Autenticación y PIN" />
      <div class="figure-caption">Figura 4: Flujo de Autenticación Híbrida: Microsoft Entra ID y Cambio Rápido por PIN</div>
      <div class="figure-look">Qué mirar: La vía corporativa federada y el mecanismo de PIN rápido para tablets compartidas con bloqueo temporal al 5° fallo.</div>
    </div>
    <h3>Matriz de Roles y Rango Jerárquico</h3>`
  );

  // Captura 5 en Sección 5 (Modal PIN)
  res = res.replace(
    '<h3>Alcance Sectorial (<code>usuarios_sectores</code>)</h3>',
    `<div class="figure-wrapper" style="max-width: 380px; margin: 14px auto;">
      <img src="capturas/captura-5-cambio-pin.png" alt="Modal de Cambio Rápido por PIN" style="max-height: 260px; object-fit: contain;" />
      <div class="figure-caption">Captura 5: Modal de Cambio Rápido por PIN para Dispositivos Compartidos</div>
    </div>
    <h3>Alcance Sectorial (<code>usuarios_sectores</code>)</h3>`
  );

  // Figura 10 en Sección 5 (Matriz Roles Heatmap)
  res = res.replace(
    '<h2>6. Qué Registra el Sistema',
    `<div class="figure-wrapper">
      <img src="figuras/figura-10-matriz-roles-heatmap.svg" alt="Mapa de Calor RBAC" />
      <div class="figure-caption">Figura 10: Mapa de Calor de Permisos por Rol (Principio de Menor Privilegio)</div>
      <div class="figure-look">Qué mirar: La separación estricta de deberes entre inspectores de campo, auditores de solo lectura y gerencia ejecutiva.</div>
    </div>
    <h2>6. Qué Registra el Sistema`
  );

  // Figura 6 en Sección 7 (Offline)
  res = res.replace(
    '<h3>Circuito de Sincronización y Casos Extremos</h3>',
    `<h3>Circuito de Sincronización y Casos Extremos</h3>
    <div class="figure-wrapper">
      <img src="figuras/figura-6-secuencia-offline-quarantine.svg" alt="Secuencia Offline y Cuarentena" />
      <div class="figure-caption">Figura 6: Secuencia de Operación Sin Conexión, Sincronización y Almacén de Cuarentena</div>
      <div class="figure-look">Qué mirar: Cómo se encola en IndexedDB y la protección que envía a cuarentena si el usuario fue revocado durante la desconexión.</div>
    </div>`
  );

  // Figura 7 en Sección 8 (Inmutabilidad y Hashes)
  res = res.replace(
    '<h3>Huella Digital Criptográfica de Snapshots Mensuales</h3>',
    `<h3>Huella Digital Criptográfica de Snapshots Mensuales</h3>
    <div class="figure-wrapper">
      <img src="figuras/figura-7-inmutabilidad-hashes.svg" alt="Inmutabilidad y Hashes" />
      <div class="figure-caption">Figura 7: Mecanismo de Inmutabilidad HTTP 405 y Firma Criptográfica SHA-256 en Cierres Mensuales</div>
      <div class="figure-look">Qué mirar: El bloqueo de edición de inspecciones y la huella digital que garantiza que los reportes no fueron alterados a posteriori.</div>
    </div>`
  );

  // Figura 9 en Sección 10 (Backups)
  res = res.replace(
    '<h3>Objetivos de Continuidad del Negocio (RPO y RTO)</h3>',
    `<div class="figure-wrapper">
      <img src="figuras/figura-9-flujo-backup-acid-vacuum.svg" alt="Flujo de Backup VACUUM INTO" />
      <div class="figure-caption">Figura 9: Flujo de Respaldo Atómico VACUUM INTO y Comprobación Automática integrity_check</div>
      <div class="figure-look">Qué mirar: La generación de copias consistentes sin detener el servicio y la prueba que borra el archivo si no devuelve 'ok'.</div>
    </div>
    <h3>Objetivos de Continuidad del Negocio (RPO y RTO)</h3>`
  );

  // Figura 11 en Sección 10 (Escenarios de Falla)
  res = res.replace(
    '<h2>11. Taller, Vencimientos y Mantenimiento Técnico',
    `<div class="figure-wrapper">
      <img src="figuras/figura-11-escenarios-falla-resiliencia.svg" alt="Matriz de Escenarios de Falla" />
      <div class="figure-caption">Figura 11: Matriz de Escenarios de Falla y Resiliencia del Sistema</div>
      <div class="figure-look">Qué mirar: La respuesta técnica ante cada contingencia (servidor caído, falta de señal, base dañada, pérdida del celular).</div>
    </div>
    <h2>11. Taller, Vencimientos y Mantenimiento Técnico`
  );

  // Figura 8 en Sección 11 (Línea de Tiempo 20 años)
  res = res.replace(
    '<h3>Motor de Semaforización Proactiva (<code>expirationService.js</code>)</h3>',
    `<div class="figure-wrapper">
      <img src="figuras/figura-8-linea-tiempo-vida-util-20-anos.svg" alt="Línea de Tiempo 20 años" />
      <div class="figure-caption">Figura 8: Línea de Tiempo del Ciclo de Vida Útil de un Extintor según Norma IRAM 3517-2</div>
      <div class="figure-look">Qué mirar: La secuencia reglamentaria obligatoria: control mensual, recarga anual, PH cada 5 años y fin de vida útil a 20 años.</div>
    </div>
    <h3>Motor de Semaforización Proactiva (<code>expirationService.js</code>)</h3>`
  );

  // Figura 5 en Sección 11 (Máquina de Estados de Activo)
  res = res.replace(
    '<h3>Gestión de Taller y Órdenes de Servicio (<code>ordenes_servicio</code>)</h3>',
    `<div class="figure-wrapper">
      <img src="figuras/figura-5-maquina-estados-activo-anomalia.svg" alt="Máquina de Estados" />
      <div class="figure-caption">Figura 5: Máquina de Estados del Activo, Casos de Anomalías y Órdenes de Taller</div>
      <div class="figure-look">Qué mirar: La transición formal entre OPERATIVO, EN_TALLER y RESUELTO, exigiendo matafuego sustituto temporal.</div>
    </div>
    <h3>Gestión de Taller y Órdenes de Servicio (<code>ordenes_servicio</code>)</h3>`
  );

  // Captura 3 y Captura 4 en Sección 12 (Tablero de Gerencia)
  res = res.replace(
    '<h3>El Índice de Salud de Protección Contra Incendios (ISPCI)</h3>',
    `<div class="figure-wrapper">
      <img src="capturas/captura-3-dashboard-operativo.png" alt="Dashboard Operativo Escritorio" style="max-height: 290px; object-fit: contain;" />
      <div class="figure-caption">Captura 3: Panel de Control Operativo Diario y Semaforización de Vencimientos (Escritorio)</div>
    </div>
    <div class="figure-wrapper">
      <img src="capturas/captura-4-tablero-gerencia.png" alt="Tablero de Gerencia" style="max-height: 290px; object-fit: contain;" />
      <div class="figure-caption">Captura 4: Tablero de Gerencia (Power BI Style con KPIs, Tendencias y Heatmap Sectorial)</div>
    </div>
    <h3>El Índice de Salud de Protección Contra Incendios (ISPCI)</h3>`
  );

  // Figura 12 en Sección 12 (Arquitectura Tablero Gerencia)
  res = res.replace(
    '<h3>Privacidad y Ética Laboral</h3>',
    `<div class="figure-wrapper">
      <img src="figuras/figura-12-tablero-gerencia-kpi-bi.svg" alt="Arquitectura del Tablero Gerencial" />
      <div class="figure-caption">Figura 12: Arquitectura del Tablero de Gerencia y Acceso Externo para Power BI</div>
      <div class="figure-look">Qué mirar: El desacople entre la base viva operativa y los snapshots mensuales congelados con firma SHA-256.</div>
    </div>
    <h3>Privacidad y Ética Laboral</h3>`
  );

  // Captura 6 en Sección 16 (Usuarios RBAC)
  res = res.replace(
    '<h3>Monitoreo Estructurado de Salud (<code>/api/health</code>)</h3>',
    `<div class="figure-wrapper">
      <img src="capturas/captura-6-usuarios-rbac.png" alt="Módulo de Usuarios" style="max-height: 280px; object-fit: contain;" />
      <div class="figure-caption">Captura 6: Módulo de Gestión de Usuarios, Asignación de Roles y Alcance Sectorial</div>
    </div>
    <h3>Monitoreo Estructurado de Salud (<code>/api/health</code>)</h3>`
  );

  // Figura 13 en Sección 19 (Matriz Impacto Esfuerzo)
  res = res.replace(
    '<h3>Detalle de Mejoras Propuestas</h3>',
    `<div class="figure-wrapper">
      <img src="figuras/figura-13-matriz-impacto-esfuerzo.svg" alt="Matriz Impacto Esfuerzo" />
      <div class="figure-caption">Figura 13: Matriz Estratégica de Mejoras: Impacto Operativo vs. Esfuerzo de TI</div>
      <div class="figure-look">Qué mirar: Las mejoras de alto impacto y bajo esfuerzo que deben implementarse de inmediato (Quick Wins).</div>
    </div>
    <h3>Detalle de Mejoras Propuestas</h3>`
  );

  // Figura 14 en Sección 19 (Roadmap 3 Horizontes)
  res = res.replace(
    '<h2>20. Plan de Implantación y Gestión del Cambio',
    `<div class="figure-wrapper">
      <img src="figuras/figura-14-hoja-ruta-3-horizontes.svg" alt="Hoja de Ruta 3 Horizontes" />
      <div class="figure-caption">Figura 14: Hoja de Ruta de Evolución Tecnológica (Horizontes 1, 2 y 3)</div>
      <div class="figure-look">Qué mirar: El cronograma escalonado hacia la madurez del sistema a 1 mes, 3 meses y 6 a 12 meses vista.</div>
    </div>
    <h2>20. Plan de Implantación y Gestión del Cambio`
  );

  return res;
}

// Compilar Manual Técnico Completo
const rawManualMd = fs.readFileSync(manualMdPath, 'utf8');
const processedManualHtml = markdownToHtml(rawManualMd);
const fullManualContent = injectVisualAssets(processedManualHtml);

const manualHtmlDoc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Milicic FireControl 365 — Manual Técnico y Arquitectura</title>
  <style>
    ${printStyles}
  </style>
</head>
<body>

  <!-- PORTADA INSTITUCIONAL A4 -->
  <div class="cover-page">
    <div>
      <div class="cover-logo-box">
        <img src="../../public/logo-milicic.svg" alt="Milicic S.A." onerror="this.src='../../public/logo-milicic.png'" />
      </div>
      <div style="margin-top: 25mm;">
        <span class="cover-badge">Documento Corporativo Oficial • Arquitectura &amp; Seguridad</span>
        <h1 class="cover-title">Milicic<br/><span>FireControl 365</span></h1>
        <p class="cover-subtitle">Manual Técnico, Arquitectura del Sistema, Integridad de Datos y Criterios Normativos IRAM 3517-2</p>
      </div>
    </div>

    <div>
      <div class="cover-meta-grid">
        <div class="cover-meta-item">
          <strong>Organización Emisora</strong>
          <span>Milicic S.A. — Higiene, Seguridad &amp; TI</span>
        </div>
        <div class="cover-meta-item">
          <strong>Plataforma y Versión</strong>
          <span>FireControl 365 v1.0.0 (Commit 951738c)</span>
        </div>
        <div class="cover-meta-item">
          <strong>Fecha de Emisión</strong>
          <span>Octubre 2026 — Rosario, Santa Fe</span>
        </div>
        <div class="cover-meta-item">
          <strong>Clasificación Documental</strong>
          <span>Confidencial — Uso Interno y Auditoría</span>
        </div>
      </div>
    </div>
  </div>

  <!-- CUERPO PRINCIPAL -->
  <div style="padding: 10px 0;">
    ${fullManualContent}
  </div>

</body>
</html>`;

fs.writeFileSync(path.join(outputDir, 'manual-tecnico.html'), manualHtmlDoc, 'utf8');
console.log('manual-tecnico.html generado con éxito.');

// Compilar Resumen Ejecutivo
const rawResumenMd = fs.readFileSync(resumenMdPath, 'utf8');
const processedResumenHtml = markdownToHtml(rawResumenMd);

// Inyectar gráficos en Resumen Ejecutivo
let resumenWithGraphics = processedResumenHtml;
resumenWithGraphics = resumenWithGraphics.replace(
  '<h2>2. Un Día de Ronda Operativa en 4 Pasos</h2>',
  `<h2>2. Un Día de Ronda Operativa en 4 Pasos</h2>
  <div class="figure-wrapper" style="margin: 12px 0 16px 0;">
    <img src="figuras/figura-3-flujo-dia-ronda.svg" alt="Flujo de Ronda" style="max-height: 180px; width: auto;" />
    <div class="figure-caption">Flujo de la Ronda de Inspección: Del escaneo en campo a la consolidación gerencial</div>
  </div>`
);
resumenWithGraphics = resumenWithGraphics.replace(
  '<h2>4. El Tablero de Gerencia (KPIs Ejecutivos)</h2>',
  `<h2>4. El Tablero de Gerencia (KPIs Ejecutivos)</h2>
  <div class="figure-wrapper" style="margin: 12px 0 16px 0;">
    <img src="capturas/captura-4-tablero-gerencia.png" alt="Tablero de Gerencia" style="max-height: 220px; width: auto; object-fit: contain;" />
    <div class="figure-caption">Tablero Ejecutivo de Gerencia (Vista Power BI Style con KPIs y Heatmap Sectorial)</div>
  </div>`
);
resumenWithGraphics = resumenWithGraphics.replace(
  '<h2>6. Las 5 Mejoras Principales y Próximos Pasos</h2>',
  `<div class="figure-wrapper" style="margin: 12px 0 16px 0;">
    <img src="figuras/figura-13-matriz-impacto-esfuerzo.svg" alt="Matriz Impacto Esfuerzo" style="max-height: 190px; width: auto;" />
    <div class="figure-caption">Matriz de Priorización de Mejoras (Impacto Operativo vs. Esfuerzo de TI)</div>
  </div>
  <h2>6. Las 5 Mejoras Principales y Próximos Pasos</h2>`
);

const resumenHtmlDoc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Milicic FireControl 365 — Resumen Ejecutivo para la Dirección</title>
  <style>
    ${printStyles}
    @page {
      margin: 14mm 14mm 14mm 14mm;
    }
  </style>
</head>
<body>

  <!-- ENCABEZADO RESUMEN EJECUTIVO -->
  <div style="border-bottom: 3px solid #ea580c; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
      <span class="badge-tag tag-impl" style="margin-bottom: 6px;">INFORME EJECUTIVO DE SÍNTESIS</span>
      <h1 style="border: none; margin: 0; padding: 0; font-size: 20pt; line-height: 1.1; color: #0f172a; break-before: auto; page-break-before: auto;">
        Milicic <span style="color: #ea580c;">FireControl 365</span>
      </h1>
      <p style="margin: 4px 0 0 0; color: #64748b; font-size: 9pt;">Control Periódico de Extintores • Norma IRAM 3517-2 • Resumen para la Dirección</p>
    </div>
    <div style="text-align: right;">
      <div class="cover-logo-box" style="padding: 6px 14px; box-shadow: none; border: 1px solid #e2e8f0;">
        <img src="../../public/logo-milicic.svg" alt="Milicic S.A." style="height: 32px;" onerror="this.src='../../public/logo-milicic.png'" />
      </div>
      <div style="font-size: 7.5pt; color: #94a3b8; margin-top: 4px;">Octubre 2026 • v1.0.0 (Commit 951738c)</div>
    </div>
  </div>

  <!-- CONTENIDO RESUMEN EJECUTIVO -->
  <div>
    ${resumenWithGraphics}
  </div>

</body>
</html>`;

fs.writeFileSync(path.join(outputDir, 'resumen-ejecutivo.html'), resumenHtmlDoc, 'utf8');
console.log('resumen-ejecutivo.html generado con éxito.');
