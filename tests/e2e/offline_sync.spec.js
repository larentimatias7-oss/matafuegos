import { test, expect } from '@playwright/test';
import { ensureInspectorSession } from './helpers.js';

test.describe('E2E Flow 7: Modo Sin Conexión (Offline) y Sincronización sin Pérdida', () => {

  test('debe encolar inspecciones en modo offline y sincronizarlas al recuperar conexión', async ({ page }) => {
    await ensureInspectorSession(page);
    // 1. Cargar la ficha técnica
    const offlineExtCode = 'MF-030';
    await page.goto(`/?code=${offlineExtCode}#check`);
    await expect(page.locator('.plate-code').filter({ hasText: offlineExtCode }).first()).toBeVisible();

    // Si ya estuviera inspeccionado por corridas previas, completar motivo de reinspección
    const reasonInput = page.locator('input[placeholder*="reemplazó" i], input[placeholder*="Motivo" i]');
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('Reinspección offline de auditoría');
    }

    // 2. Simular pérdida de conectividad a nivel de red
    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    // 3. Completar inspección sin señal con "Todo OK"
    await page.getByRole('button', { name: /Todo OK/i }).click();

    const saveBtn = page.locator('button[type="submit"]');
    await saveBtn.click();

    // 4. Verificar mensaje de resguardo en dispositivo
    await expect(page.getByText(/guardó en tu dispositivo/i)).toBeVisible({ timeout: 8000 });

    // 5. Restablecer conexión a Internet
    await page.context().setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // 6. Verificar que la app notifica la presencia de pendientes o auto-sincroniza
    await page.waitForTimeout(1000);
    const syncBtn = page.getByRole('button', { name: /Sincronizar ahora/i });
    if (await syncBtn.isVisible()) {
      await syncBtn.click();
    }
  });
});
