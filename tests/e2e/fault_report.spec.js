import { test, expect } from '@playwright/test';
import { navigateToTab } from './helpers.js';

test.describe('E2E Flow 3: Registro de Anomalía con Foto y Creación de Caso', () => {

  test('debe registrar un control con falla y verificar la apertura automática del caso', async ({ page }) => {
    // Usar extintor pendiente de inspección
    const faultCode = 'MF-055';
    await page.goto(`/?code=${faultCode}#check`);

    await expect(page.locator('.plate-code').filter({ hasText: faultCode }).first()).toBeVisible();

    // Si ya estuviera inspeccionado por corridas previas, completar motivo de reinspección
    const reasonInput = page.locator('input[placeholder*="reemplazó" i], input[placeholder*="Motivo" i]');
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('Reinspección automática por prueba E2E');
    }

    // Marcar check_pressure como FALLA (hacer clic en el botón de falla del grupo de manómetro/presión)
    const pressureCard = page.locator('.inspector-toggle-card').filter({ hasText: /Presión|Manómetro/i });
    const failBtn = pressureCard.locator('.toggle-btn').nth(1);
    await failBtn.click();

    // Escribir observación detallada
    const obsInput = page.locator('textarea');
    await obsInput.fill('Falla detectada en test E2E: manómetro despresurizado en zona roja.');

    // Simular adjuntar foto de evidencia (input file)
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      await fileInput.setInputFiles({
        name: 'evidence.png',
        mimeType: 'image/png',
        buffer: samplePng
      });
    }

    // Guardar inspección
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Confirmación de anomalía registrada en el heading
    await expect(page.getByRole('heading', { name: /Control Registrado con Anomalía/i })).toBeVisible({ timeout: 7000 });

    // Navegar a la pestaña de Casos
    await navigateToTab(page, 'cases');

    // Comprobar que el caso aparece en la lista de Casos y Anomalías
    await expect(page.getByText(faultCode).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/despresurizado en zona roja/i).first()).toBeVisible();
  });
});
