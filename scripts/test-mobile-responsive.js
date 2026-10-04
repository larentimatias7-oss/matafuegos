const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function testMobileResponsive() {
  const browser = await chromium.launch({ headless: true });
  // iPhone 13/14 viewport: 390 x 844
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  const previewDir = path.resolve(__dirname, '../docs/documento/preview-mobile');
  if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

  console.log('Navegando a http://localhost:3000 con viewport 390x844...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check login
  const btnLocal = await page.$('#btn-use-local');
  if (btnLocal) {
    console.log('Seleccionando login local...');
    await btnLocal.click();
    await page.waitForTimeout(500);
  }

  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    console.log('Completando credenciales de Admin TI...');
    await emailInput.fill('admin.ti@milicic.com.ar');
    await page.fill('input[type="password"]', 'AdminMilicic2026!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  }

  // 1. Capturar Dashboard Principal en Mobile
  console.log('Capturando Dashboard principal en móvil (390px)...');
  await page.screenshot({ path: path.join(previewDir, 'mobile-dashboard-kpis.png'), fullPage: false });

  // Scroll down a los 4 KPIs
  const kpiGrid = await page.$('.dashboard-kpi-grid');
  if (kpiGrid) {
    await kpiGrid.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(previewDir, 'mobile-dashboard-kpi-cards.png') });
  }

  // 2. Navegar a Tablero de Gerencia
  console.log('Navegando a pestaña Gerencia...');
  const moreBtn = await page.$('nav.mobile-bottom-nav button:has-text("Más")');
  if (moreBtn) {
    await moreBtn.click();
    await page.waitForTimeout(600);
    const gerenciaOption = await page.$('.bottom-sheet button:has-text("Gerencia")');
    if (gerenciaOption) {
      await gerenciaOption.click();
      await page.waitForTimeout(2000);
    }
  }

  // Capturar vista Gerencia en móvil
  console.log('Capturando Gerencia en móvil (390px)...');
  await page.screenshot({ path: path.join(previewDir, 'mobile-gerencia-top.png'), fullPage: false });

  // Scroll down a los paneles
  const panel1 = await page.$('.strategic-panel');
  if (panel1) {
    await panel1.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(previewDir, 'mobile-gerencia-panel-cumplimiento.png') });
  }

  const heatmap = await page.$('.heatmap-sectors-grid');
  if (heatmap) {
    await heatmap.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(previewDir, 'mobile-gerencia-heatmap.png') });
  }

  await browser.close();
  console.log('Capturas móviles generadas con éxito en docs/documento/preview-mobile/');
}

testMobileResponsive().catch(console.error);
