/**
 * Helpers para pruebas E2E en Playwright
 * Soportan de forma transparente vista de escritorio y vista móvil con bottom-nav y drawer "Más".
 */

export async function ensureAdminSession(page) {
  const { db } = require('../../server/db');
  const { hashPassword, createSession } = require('../../server/services/authService');
  const { ROLES } = require('../../server/config/permissions');
  const passHash = await hashPassword('AdminMilicic2026!');
  const adminId = 'a5c57ded-2699-4822-9b5a-9095cd07419b';
  const existing = db.prepare("SELECT id FROM usuarios WHERE id = ?").get(adminId);
  if (existing) {
    db.prepare(`
      UPDATE usuarios 
      SET password_hash = ?, activo = 1, intentos_fallidos = 0, bloqueado_hasta = NULL, rol = ?
      WHERE id = ?
    `).run(passHash, ROLES.SUPERADMIN, existing.id);
  } else {
    db.prepare(`
      INSERT INTO usuarios (
        id, organizacion_id, nombre, apellido, email, origen, password_hash, rol, activo, debe_cambiar_password
      ) VALUES (
        ?, 1, 'Administrador', 'TI', 'admin.ti@milicic.com.ar', 'local', ?, ?, 1, 0
      )
    `).run(adminId, passHash, ROLES.SUPERADMIN);
  }

  // Crear la sesión en SQLite y setear la cookie en el contexto de Playwright
  const session = createSession(db, { usuario_id: adminId });
  await page.context().addCookies([{
    name: 'firecontrol_session',
    value: session.sessionId,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax'
  }]);

  // Asegurar que localStorage tenga la identidad de Administrador para render inmediato
  await page.addInitScript(() => {
    localStorage.setItem('firecontrol_user', JSON.stringify({
      id: 'a5c57ded-2699-4822-9b5a-9095cd07419b',
      name: 'Administrador TI',
      email: 'admin.ti@milicic.com.ar',
      role: 'SUPERADMIN',
      rol: 'SUPERADMIN',
      activo: 1,
      isGlobalScope: true
    }));
  });
}

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
