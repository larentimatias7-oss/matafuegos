const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function run() {
  const outputDir = path.resolve(__dirname, '../docs/documento/capturas');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // 1. Contexto Escritorio
  const desktopContext = await browser.newContext({
    viewport: { width: 1366, height: 850 },
    deviceScaleFactor: 2
  });

  // Login directo vía API en la sesión
  console.log('Autenticando como Admin TI vía API...');
  const loginRes = await desktopContext.request.post('http://localhost:3000/api/auth/login', {
    data: {
      email: 'admin.ti@milicic.com.ar',
      password: 'AdminMilicic2026!'
    }
  });
  console.log('Login API status:', loginRes.status());

  const page = await desktopContext.newPage();
  console.log('Navegando a Dashboard Escritorio...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Captura 3: Dashboard Operativo
  console.log('Capturando Dashboard Operativo...');
  await page.screenshot({ path: path.join(outputDir, 'captura-3-dashboard-operativo.png'), fullPage: false });

  // Captura 4: Tablero de Gerencia
  console.log('Navegando a Tablero de Gerencia...');
  const gerenciaLink = await page.$('a:has-text("Gerencia"), button:has-text("Gerencia"), a[href*="gerencia"]');
  if (gerenciaLink) {
    await gerenciaLink.click();
  } else {
    await page.goto('http://localhost:3000/#gerencia', { waitUntil: 'networkidle' });
  }
  await page.waitForTimeout(2500);
  console.log('Capturando Tablero de Gerencia...');
  await page.screenshot({ path: path.join(outputDir, 'captura-4-tablero-gerencia.png'), fullPage: false });

  // Volver a inicio para usuarios
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Captura 6: Gestión de Usuarios
  console.log('Abriendo Gestión de Usuarios...');
  const usersBtn = await page.$('button:has-text("Usuarios"), a:has-text("Usuarios")');
  if (usersBtn) {
    await usersBtn.click();
    await page.waitForTimeout(1500);
    console.log('Capturando Módulo de Usuarios...');
    await page.screenshot({ path: path.join(outputDir, 'captura-6-usuarios-rbac.png'), fullPage: false });
    const closeUsers = await page.$('button:has-text("Cerrar"), button[aria-label="Cerrar"]');
    if (closeUsers) await closeUsers.click();
  }

  // 2. Contexto Móvil
  const mobileContext = await browser.newContext({
    viewport: { width: 412, height: 880 },
    deviceScaleFactor: 2,
    isMobile: true
  });

  // Autenticar móvil también
  await mobileContext.request.post('http://localhost:3000/api/auth/login', {
    data: {
      email: 'santiago.amaya@milicic.com.ar',
      password: 'AdminMilicic2026!'
    }
  });

  const mPage = await mobileContext.newPage();
  console.log('Navegando a móvil...');
  await mPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mPage.waitForTimeout(1500);

  // Captura 5: Modal Cambio Rápido por PIN
  console.log('Abriendo modal PIN...');
  const pinBtn = await mPage.$('button[title*="PIN"], button:has-text("PIN"), button:has-text("Cambiar")');
  if (pinBtn) {
    await pinBtn.click();
    await mPage.waitForTimeout(1000);
    console.log('Capturando Modal PIN Móvil...');
    await mPage.screenshot({ path: path.join(outputDir, 'captura-5-cambio-pin.png') });
    const cancelPin = await mPage.$('button:has-text("Cancelar"), button[aria-label="Cerrar"]');
    if (cancelPin) await cancelPin.click();
  }

  // Captura 2: Formulario de Inspección Modal
  console.log('Abriendo Modal de Inspección...');
  const inspectBtn = await mPage.$('button:has-text("Inspeccionar"), button:has-text("Nueva Inspección")');
  if (inspectBtn) {
    await inspectBtn.click();
    await mPage.waitForTimeout(1000);
    console.log('Capturando Formulario de Inspección Móvil...');
    await mPage.screenshot({ path: path.join(outputDir, 'captura-2-checklist-inspeccion.png') });
    const cancelModal = await mPage.$('button:has-text("Cancelar"), button[aria-label="Cerrar"]');
    if (cancelModal) await cancelModal.click();
  }

  // Captura 1: Escáner QR / Ficha
  console.log('Abriendo Escáner QR...');
  const qrBtn = await mPage.$('button:has-text("Escanear"), button[title*="QR"]');
  if (qrBtn) {
    await qrBtn.click();
    await mPage.waitForTimeout(1000);
    console.log('Capturando Escáner QR Móvil...');
    await mPage.screenshot({ path: path.join(outputDir, 'captura-1-escaner-qr.png') });
  }

  await browser.close();
  console.log('Todas las capturas generadas con éxito en:', outputDir);
}

run().catch(err => {
  console.error('Error generando capturas:', err);
  process.exit(1);
});
