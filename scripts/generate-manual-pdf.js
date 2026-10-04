const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function buildDocs() {
  console.log('Compilando páginas HTML del Manual y Resumen...');
  require('./build-manual-pages.js');
  require('./build-executive-pages.js');

  const docsDir = path.resolve(__dirname, '../docs/documento');
  const previewDir = path.join(docsDir, 'preview-paginas');
  if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true });
  }

  const manualHtmlPath = path.join(docsDir, 'manual-tecnico.html');
  const manualPdfPath = path.join(docsDir, 'Milicic-FireControl365-Manual-Tecnico.pdf');

  const resumenHtmlPath = path.join(docsDir, 'resumen-ejecutivo.html');
  const resumenPdfPath = path.join(docsDir, 'Milicic-FireControl365-Resumen-Ejecutivo.pdf');

  const browser = await chromium.launch({ headless: true });

  // 1. GENERAR MANUAL TÉCNICO COMPLETO (28 PÁGINAS EXACTAS)
  console.log('Generando PDF del Manual Técnico Completo...');
  const pageManual = await browser.newPage();
  await pageManual.setViewportSize({ width: 1200, height: 1600 });
  await pageManual.goto(`file://${manualHtmlPath}`, { waitUntil: 'networkidle' });
  await pageManual.waitForTimeout(2000);

  await pageManual.pdf({
    path: manualPdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: false,
    margin: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    },
    preferCSSPageSize: true
  });

  const manualStat = fs.statSync(manualPdfPath);
  console.log(`Manual Técnico generado: ${manualPdfPath} (${(manualStat.size / (1024 * 1024)).toFixed(2)} MB)`);

  // Capturar preview PNG de cada una de las 28 páginas del Manual
  console.log('Generando capturas de revisión visual de páginas del Manual...');
  const manualPages = await pageManual.$$('.pdf-page');
  console.log(`Detectadas ${manualPages.length} páginas en Manual HTML.`);
  for (let i = 0; i < manualPages.length; i++) {
    const pageNum = String(i + 1).padStart(2, '0');
    const previewFile = path.join(previewDir, `manual-pag-${pageNum}.png`);
    await manualPages[i].screenshot({ path: previewFile });
  }

  // 2. GENERAR RESUMEN EJECUTIVO (4 PÁGINAS EXACTAS)
  console.log('Generando PDF del Resumen Ejecutivo...');
  const pageResumen = await browser.newPage();
  await pageResumen.setViewportSize({ width: 1200, height: 1600 });
  await pageResumen.goto(`file://${resumenHtmlPath}`, { waitUntil: 'networkidle' });
  await pageResumen.waitForTimeout(2000);

  await pageResumen.pdf({
    path: resumenPdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: false,
    margin: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    },
    preferCSSPageSize: true
  });

  const resumenStat = fs.statSync(resumenPdfPath);
  console.log(`Resumen Ejecutivo generado: ${resumenPdfPath} (${(resumenStat.size / (1024 * 1024)).toFixed(2)} MB)`);

  // Capturar preview PNG de cada una de las 4 páginas del Resumen
  console.log('Generando capturas de revisión visual del Resumen Ejecutivo...');
  const resumenPages = await pageResumen.$$('.pdf-page');
  console.log(`Detectadas ${resumenPages.length} páginas en Resumen HTML.`);
  for (let i = 0; i < resumenPages.length; i++) {
    const pageNum = String(i + 1).padStart(2, '0');
    const previewFile = path.join(previewDir, `resumen-pag-${pageNum}.png`);
    await resumenPages[i].screenshot({ path: previewFile });
  }

  // 3. CONTAR PÁGINAS REALES EN PDF BINARIO
  const manualBytes = fs.readFileSync(manualPdfPath);
  const manualStr = manualBytes.toString('latin1');
  const countMatches = manualStr.match(/\/Count\s+(\d+)/g);
  let manualPageCount = 'Desconocido';
  if (countMatches && countMatches.length > 0) {
    const counts = countMatches.map(m => parseInt(m.replace('/Count', '').trim())).filter(n => !isNaN(n));
    manualPageCount = Math.max(...counts);
  }

  const resumenBytes = fs.readFileSync(resumenPdfPath);
  const resumenStr = resumenBytes.toString('latin1');
  const rMatches = resumenStr.match(/\/Count\s+(\d+)/g);
  let resumenPageCount = 'Desconocido';
  if (rMatches && rMatches.length > 0) {
    const counts = rMatches.map(m => parseInt(m.replace('/Count', '').trim())).filter(n => !isNaN(n));
    resumenPageCount = Math.max(...counts);
  }

  console.log(`\n=================== ESTADÍSTICAS DE PRODUCCIÓN ===================`);
  console.log(`• Manual Técnico Completo: ${manualPageCount} páginas (Meta: 20-30 páginas) -> ${manualPageCount === 28 ? 'PERFECTO (28 págs)' : manualPageCount + ' págs'}`);
  console.log(`• Resumen Ejecutivo:       ${resumenPageCount} páginas (Meta: 3-4 páginas)   -> ${resumenPageCount === 4 ? 'PERFECTO (4 págs)' : resumenPageCount + ' págs'}`);
  console.log(`• Vistas previas en PNG:    Guardadas en docs/documento/preview-paginas/`);
  console.log(`==================================================================\n`);

  await browser.close();
  console.log('Proceso de compilación y generación de PDFs finalizado con éxito.');
}

buildDocs().catch(err => {
  console.error('Error generando PDFs:', err);
  process.exit(1);
});
