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

    // 1. En el modal de Login obligatorio, abrir formulario de cuenta local
    const useLocalBtn = page.locator('#btn-use-local');
    await useLocalBtn.waitFor({ state: 'visible', timeout: 10000 });
    await useLocalBtn.click();

    // 2. Completar credenciales de Superadmin local
    const emailInput = page.locator('#login-email');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill('admin.ti@milicic.com.ar');
    await page.locator('#login-pass').fill('AdminMilicic2026!');
    await page.locator('form button[type="submit"]').click();

    // 3. Confirmar que ingresó con Superadmin y los módulos de Usuarios y Auditoría están disponibles
    const isMobile = await page.locator('.mobile-bottom-nav').isVisible().catch(() => false);

    if (!isMobile) {
      await expect(page.getByText(/Administrador TI|admin.ti/i).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: /Usuarios/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Auditoría/i })).toBeVisible();
    }

    // 4. Navegar a Gestión de Usuarios
    await navigateToTab(page, 'users');
    await expect(page.getByRole('heading', { name: /Gestión de Usuarios/i })).toBeVisible();
    await expect(page.getByText(/admin.ti@milicic.com.ar/i).first()).toBeVisible();

    // 5. Abrir Modal de Alta de Usuario
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

    // 6. Verificar que aparece en la lista de usuarios
    await expect(page.getByText(testEmail).first()).toBeVisible();

    // Eliminar el usuario de prueba para verificar la funcionalidad y limpiar la base de datos
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    const userRow = page.locator('tr', { hasText: testEmail });
    await userRow.locator('button[title*="Eliminar"]').click();
    await expect(page.getByText(testEmail)).not.toBeVisible();

    // 7. Navegar al Registro Inmutable de Auditoría
    await navigateToTab(page, 'audit');
    await expect(page.getByRole('heading', { name: /Registro de Auditoría/i })).toBeVisible();
    await expect(page.getByText(/CREAR_USUARIO|LOGIN_EXITOSO/i).first()).toBeVisible();
  });

  test('debe permitir cambio rápido de usuario por PIN (shared device)', async ({ page }) => {
    await page.goto('/');

    const modalPinBtn = page.locator('.modal-content button:has-text("PIN")');
    await modalPinBtn.waitFor({ state: 'visible', timeout: 10000 });
    await modalPinBtn.click();

    await expect(page.getByRole('heading', { name: /Cambio Rápido de Inspector|Cambio de Operador/i })).toBeVisible();
    await page.getByRole('button', { name: /Cancelar/i }).click();
  });
});
