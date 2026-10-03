/**
 * Helpers para pruebas E2E en Playwright
 * Soportan de forma transparente vista de escritorio y vista móvil con bottom-nav y drawer "Más".
 */

export async function navigateToTab(page, tabId) {
  // Verificar si estamos en móvil o escritorio
  const isMobile = await page.locator('.mobile-bottom-nav').isVisible().catch(() => false);

  if (!isMobile) {
    // En escritorio, mapear tabId a la etiqueta correspondiente
    const desktopLabels = {
      dashboard: 'Dashboard',
      route: 'Mi Ruta',
      scan: 'Control Rápido',
      extinguishers: 'Inventario',
      cases: 'Anomalías / Casos',
      qrs: 'Etiquetas QR',
      history: 'Historial',
      users: 'Usuarios',
      audit: 'Auditoría',
      m365: 'Microsoft 365'
    };
    const label = desktopLabels[tabId] || tabId;
    await page.locator('.desktop-header, .desktop-only').getByRole('button', { name: new RegExp(label, 'i') }).click();
  } else {
    // En móvil:
    // Tabs directos en el bottom nav: dashboard, extinguishers, scan, history
    if (tabId === 'dashboard') {
      await page.locator('.mobile-bottom-nav').getByRole('button', { name: /Dashboard/i }).click();
    } else if (tabId === 'extinguishers') {
      await page.locator('.mobile-bottom-nav').getByRole('button', { name: /Inventario/i }).click();
    } else if (tabId === 'scan') {
      await page.locator('.mobile-bottom-nav .mobile-nav-scan').click();
    } else if (tabId === 'history') {
      await page.locator('.mobile-bottom-nav').getByRole('button', { name: /Historial/i }).click();
    } else {
      // Submenú "Más" (route, cases, qrs, users, audit, m365)
      await page.locator('.mobile-bottom-nav').getByRole('button', { name: /Más/i }).click();
      await page.waitForSelector('.bottom-sheet', { state: 'visible' });

      const sheetLabels = {
        route: /Mi Ruta/i,
        cases: /Casos y Anomalías/i,
        qrs: /Etiquetas QR/i,
        users: /Usuarios/i,
        audit: /Auditoría/i,
        m365: /Microsoft 365/i
      };
      await page.locator('.bottom-sheet').getByRole('button', { name: sheetLabels[tabId] }).click();
    }
  }
}
