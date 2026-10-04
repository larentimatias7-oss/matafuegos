const { chromium } = require('@playwright/test');
const path = require('path');

async function run() {
  const outputDir = path.resolve(__dirname, '../docs/documento/capturas');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 880 },
    deviceScaleFactor: 2,
    isMobile: true
  });

  await context.request.post('http://localhost:3000/api/auth/login', {
    data: {
      email: 'santiago.amaya@milicic.com.ar',
      password: 'AdminMilicic2026!'
    }
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Ir a la pestaña Escanear
  const scanNav = await page.$('button:has-text("Escanear"), a:has-text("Escanear"), [data-tab="scan"]');
  if (scanNav) {
    await scanNav.click();
    await page.waitForTimeout(1000);
  }

  // En el Scanner, suele haber un selector o buscador manual de código "Seleccionar manualmente" o lista
  const manualInput = await page.$('input[placeholder*="Buscar"], input[placeholder*="Código"], select');
  if (manualInput) {
    const tagName = await manualInput.evaluate(el => el.tagName.toLowerCase());
    if (tagName === 'select') {
      await manualInput.selectOption({ index: 1 });
    } else {
      await manualInput.fill('MF-001');
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(1500);
  } else {
    // Intentar desde la lista de extintores
    const listNav = await page.$('button:has-text("Extintores"), a:has-text("Extintores")');
    if (listNav) {
      await listNav.click();
      await page.waitForTimeout(1500);
      const row = await page.$('tr:has-text("MF-001"), div:has-text("MF-001")');
      if (row) {
        await row.click();
        await page.waitForTimeout(1000);
        const inspectBtn = await page.$('button:has-text("Inspeccionar"), button:has-text("Controlar")');
        if (inspectBtn) await inspectBtn.click();
      }
    }
  }

  await page.waitForTimeout(1500);
  console.log('Capturando Formulario de Inspección...');
  await page.screenshot({ path: path.join(outputDir, 'captura-2-checklist-inspeccion.png'), fullPage: false });

  await browser.close();
  console.log('Captura 2 completada.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
