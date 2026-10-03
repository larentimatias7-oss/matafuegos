import { test, expect } from '@playwright/test';
import { ensureInspectorSession } from './helpers.js';

test.describe('E2E Flow 1: Login, Dashboard y Verificación de KPIs', () => {

  test('debe solicitar inicio de sesión en un dispositivo nuevo sin credenciales', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.modal-content')).toBeVisible();
    await expect(page.getByText('FireControl 365').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Ingresar con Microsoft 365/i })).toBeVisible();
    await expect(page.getByText(/Identificación requerida para operar/i)).toBeVisible();
  });

  test('con sesión activa debe cargar la aplicación, mostrar identidad Milicic y KPIs clave', async ({ page }) => {
    await ensureInspectorSession(page);
    await page.goto('/');

    // 1. Identidad institucional Milicic
    const logo = page.locator('img[alt="Milicic S.A."]:visible').first();
    await expect(logo).toBeVisible();

    const isMobile = await page.locator('.mobile-bottom-nav').isVisible().catch(() => false);

    // 2. Verificar usuario activo
    if (!isMobile) {
      await expect(page.getByText('Santiago Amaya').first()).toBeVisible();
    }

    // 3. Verificar KPIs en el Dashboard
    const kpiCards = page.locator('.dashboard-kpi-grid > .card');
    await expect(kpiCards.first()).toBeVisible();
    await expect(page.getByText(/Avance Ronda Mensual/i).first()).toBeVisible();
    await expect(page.getByText(/Cobertura/i).first()).toBeVisible();
    await expect(page.getByText(/Anomalías y Casos/i).first()).toBeVisible();

    // 4. Verificar Mapa de Calor de Sectores (Heatmap)
    await expect(page.getByText(/Tablero Táctico de Sectores/i).first()).toBeVisible();

    // 5. Botones de acción rápida
    if (!isMobile) {
      await expect(page.getByRole('button', { name: /Escanear QR/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Excel 365/i })).toBeVisible();
    } else {
      await expect(page.locator('.mobile-nav-scan')).toBeVisible();
    }
  });
});
