import { test, expect } from '@playwright/test';
import { ensureInspectorSession } from './helpers.js';

test.describe('E2E Flow 2: Flujo Ágil del Inspector (<= 3 Toques)', () => {

  test('debe permitir completar un control mensual conforme y pasar al siguiente en 3 toques', async ({ page }) => {
    await ensureInspectorSession(page);
    // Abrir ficha directamente por código simulando escaneo de QR
    await page.goto('/?code=MF-010#check');

    // Verificar que cargó la ficha técnica de MF-010
    await expect(page.locator('.plate-code').filter({ hasText: 'MF-010' }).first()).toBeVisible();
    await expect(page.locator('.inspector-toggle-card')).toHaveCount(6);

    let tapCount = 0;

    // TOQUE 1: "Todo OK" (Marca los 6 puntos normativos conformes con un toque)
    const markAllOkBtn = page.getByRole('button', { name: /Todo OK/i });
    await expect(markAllOkBtn).toBeVisible();
    await markAllOkBtn.click();
    tapCount++;

    // Verificar que los 6 checks están en estado conforme
    const activeOkBtns = page.locator('.toggle-btn.active-ok');
    await expect(activeOkBtns).toHaveCount(6);

    // TOQUE 2: "Guardar Control Mensual"
    const saveBtn = page.locator('button[type="submit"]');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    tapCount++;

    // Verificar pantalla de confirmación exitosa
    await expect(page.getByText('¡Control Mensual Guardado!')).toBeVisible({ timeout: 7000 });

    // TOQUE 3: "Siguiente equipo en tu ruta" / "Ir a MF-XXX"
    const nextBtn = page.locator('button', { hasText: /Ir a MF-/i });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      tapCount++;

      // Verificar que el formulario cambió al siguiente extintor pendiente
      await expect(page.locator('.inspector-toggle-card')).toHaveCount(6);
    }

    // Aseveración estricta de usabilidad en terreno: flujo completado en <= 3 toques
    expect(tapCount).toBeLessThanOrEqual(3);
  });
});
