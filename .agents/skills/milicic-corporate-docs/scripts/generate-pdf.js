#!/usr/bin/env node
/**
 * generate-pdf.js - Milicic S.A. Corporate PDF Engine
 * Renderiza documentos HTML a PDF con estándar institucional mediante Chrome DevTools Protocol.
 * Soporta numeración dinámica de páginas, encabezados corporativos, A4 portrait/landscape y CSS Paged Media.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Uso: node generate-pdf.js <input.html> <output.pdf> [opciones]');
    console.log('Opciones:');
    console.log('  --landscape       Genera el documento en orientación apaisada');
    console.log('  --no-header-footer Desactiva el encabezado y pie de página dinámicos');
    console.log('  --title "..."     Sobrescribe el título institucional del encabezado');
    process.exit(1);
  }

  const inputFile = path.resolve(args[0]);
  const outputFile = path.resolve(args[1]);

  const isLandscape = args.includes('--landscape');
  const noHeaderFooter = args.includes('--no-header-footer');
  const titleIdx = args.indexOf('--title');
  const customTitle = titleIdx !== -1 && args[titleIdx + 1] ? args[titleIdx + 1] : 'MILICIC S.A. | Infraestructura, Construcción & TI';

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Error: Archivo de entrada no encontrado: ${inputFile}`);
    process.exit(1);
  }

  // Candidatos de navegadores Chromium en Windows y Linux
  const candidateBrowsers = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ];

  let browserPath = null;
  for (const b of candidateBrowsers) {
    if (fs.existsSync(b)) {
      browserPath = b;
      break;
    }
  }

  if (!browserPath) {
    console.error('❌ Error: No se encontró Google Chrome ni Microsoft Edge en las rutas del sistema.');
    process.exit(1);
  }

  // Cargar logotipo en base64 si existe
  let logoBase64 = '';
  const logoCandidates = [
    path.resolve(__dirname, '../resources/assets/logo-milicic.png'),
    path.resolve('docs/assets/logo-milicic.png'),
    path.resolve('../docs/assets/logo-milicic.png')
  ];
  for (const lc of logoCandidates) {
    if (fs.existsSync(lc)) {
      logoBase64 = 'data:image/png;base64,' + fs.readFileSync(lc).toString('base64');
      break;
    }
  }

  const port = 9445;
  const cp = spawn(browserPath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--allow-file-access-from-files',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  try {
    const versionRes = await fetch(`http://127.0.0.1:${port}/json/version`);
    if (!versionRes.ok) throw new Error('No se pudo establecer conexión con CDP.');

    const newTargetRes = await fetch(`http://127.0.0.1:${port}/json/new`, { method: 'PUT' });
    const target = await newTargetRes.json();
    const wsUrl = target.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    await new Promise(resolve => ws.onopen = resolve);

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (event) => {
          const res = JSON.parse(event.data);
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');

    const fileUrl = 'file:///' + inputFile.replace(/\\/g, '/');
    console.log(`[milicic-pdf] Cargando documento: ${fileUrl}`);
    await send('Page.navigate', { url: fileUrl });

    // Esperar render de fuentes y assets
    await new Promise(r => setTimeout(r, 1500));

    // Templates institucionales de Header y Footer
    const headerHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 8px; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 45px; border-bottom: 1px solid #fed7aa; height: 26px; box-sizing: border-box;">
        <span style="font-weight: 800; color: #ea580c; letter-spacing: 0.5px;">${customTitle}</span>
        <span style="color: #64748b; font-weight: 500;">Documento Oficial</span>
      </div>
    `;

    const footerHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 8px; color: #64748b; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 45px; border-top: 1px solid #e2e8f0; height: 26px; box-sizing: border-box;">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${logoBase64 ? `<img src="${logoBase64}" style="height: 10px; object-fit: contain;" />` : '<span style="font-weight:800; color:#ea580c;">MILICIC S.A.</span>'}
          <span style="color: #94a3b8;">| Informe Gerencial Confidencial</span>
        </div>
        <div>
          Página <span class="pageNumber"></span> de <span class="totalPages"></span>
        </div>
      </div>
    `;

    console.log('[milicic-pdf] Compilando PDF institucional vía CDP...');
    const pdfData = await send('Page.printToPDF', {
      displayHeaderFooter: !noHeaderFooter,
      headerTemplate: headerHtml,
      footerTemplate: footerHtml,
      printBackground: true,
      landscape: isLandscape,
      paperWidth: isLandscape ? 11.69 : 8.27,   // A4
      paperHeight: isLandscape ? 8.27 : 11.69,
      marginTop: noHeaderFooter ? 0.4 : 0.75,
      marginBottom: noHeaderFooter ? 0.4 : 0.75,
      marginLeft: 0.65,
      marginRight: 0.65,
      preferCSSPageSize: true
    });

    const pdfBuffer = Buffer.from(pdfData.data, 'base64');
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, pdfBuffer);

    console.log(`[milicic-pdf] ✅ PDF institucional generado: ${outputFile} (${pdfBuffer.length} bytes)`);
    ws.close();
  } catch (err) {
    console.error('[milicic-pdf] ❌ Error en generación de PDF:', err);
    process.exit(1);
  } finally {
    cp.kill();
  }
}

main();
