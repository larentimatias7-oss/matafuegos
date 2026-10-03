import { test, expect } from '@playwright/test';
const { navigateToTab } = require('./helpers');

test.describe('E2E Flow: Autenticación, Gestión de Usuarios (RBAC) y Auditoría', () => {

  test.beforeAll(async () => {
    const { db } = require('../../server/db');
    const { hashPassword } = require('../../server/services/authService');
    const { ROLES } = require('../../server/config/permissions');
    const passHash = await hashPassword('AdminMilicic2026!');
    const existing = db.prepare("SELECT id FROM usuarios WHERE email = 'admin.ti@milicic.com.ar'").get();
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
          'a5c57ded-2699-4822-9b5a-9095cd07419b', 1, 'Administrador', 'TI', 'admin.ti@milicic.com.ar', 'local', ?, ?, 1, 0
        )
      `).run(passHash, ROLES.SUPERADMIN);
    }
  });

  test('debe permitir login con Superadmin local, navegar a Usuarios y Auditoría', async ({ page }) => {
    await page.goto('/');

    // 1. Si hay una sesión previa activa, cerrar sesión para iniciar con Superadmin
    const profileBtn = page.locator('button[title*="Perfil"]:visible, button:has-text("Santiago Amaya"):visible').first();
    await profileBtn.waitFor({ state: 'visible', timeout: 10000 });
    await profileBtn.click();
    await page.waitForSelector('.modal-overlay', { state: 'visible' });
    await page.getByRole('button', { name: /Cerrar Sesión/i }).click();

    // 2. En el modal de Login, abrir formulario de cuenta local
    const useLocalBtn = page.locator('button:has-text("cuenta local")');
    await useLocalBtn.waitFor({ state: 'visible', timeout: 5000 });
    await useLocalBtn.click();

    await page.locator('#login-email').fill('admin.ti@milicic.com.ar');
    await page.locator('#login-pass').fill('AdminMilicic2026!');
    await page.getByRole('button', { name: /Ingresar al Sistema/i }).click();

    // 4. Confirmar que ingresó con Superadmin y los módulos de Usuarios y Auditoría están disponibles
    const isMobile = await page.locator('.mobile-bottom-nav').isVisible().catch(() => false);

    if (!isMobile) {
      await expect(page.getByText(/Administrador TI|admin.ti/i).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: /Usuarios/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Auditoría/i })).toBeVisible();
    }

    // 5. Navegar a Gestión de Usuarios
    await navigateToTab(page, 'users');
    await expect(page.getByRole('heading', { name: /Gestión de Usuarios/i })).toBeVisible();
    await expect(page.getByText(/admin.ti@milicic.com.ar/i).first()).toBeVisible();

    // 6. Abrir Modal de Alta de Usuario
    await page.getByRole('button', { name: /Nuevo Usuario/i }).click();
    await expect(page.getByRole('heading', { name: /Nuevo Usuario/i })).toBeVisible();

    const timestamp = Date.now();
    const testEmail = `inspector.${timestamp}@milicic.com.ar`;

    await page.locator('#user-nombre').fill('Roberto');
    await page.locator('#user-apellido').fill('Gómez');
    await page.locator('#user-email').fill(testEmail);
    await page.locator('#user-pass').fill('MiliPass2026!');

    await page.getByRole('button', { name: /Crear Usuario|Guardar/i }).click();
    await page.waitForTimeout(1000);

    // 7. Verificar que aparece en la lista de usuarios
    await expect(page.getByText(testEmail).first()).toBeVisible();

    // 8. Navegar al Registro Inmutable de Auditoría
    await navigateToTab(page, 'audit');
    await expect(page.getByRole('heading', { name: /Registro de Auditoría/i })).toBeVisible();
    await expect(page.getByText(/CREAR_USUARIO|LOGIN_EXITOSO/i).first()).toBeVisible();
  });

  test('debe permitir cambio rápido de usuario por PIN (shared device)', async ({ page }) => {
    await page.goto('/');

    // Clic directo en botón de cambio de operario por PIN en la barra de navegación
    const pinBtn = page.locator('button[title*="PIN"]').first();
    if (await pinBtn.isVisible()) {
      await pinBtn.click();
      await expect(page.getByRole('heading', { name: /Cambio Rápido de Inspector/i })).toBeVisible();
      await expect(page.getByText(/Dispositivo Compartido/i)).toBeVisible();
      await page.getByRole('button', { name: /Cancelar/i }).click();
    }
  });
});
