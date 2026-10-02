import { test, expect } from '@playwright/test';
import { navigateToTab } from './helpers.js';
import path from 'path';

test.describe('E2E Flow 5: Generación y Decodificación de Etiquetas QR', () => {

  test('debe generar las etiquetas QR del parque y decodificar que coincidan con la URL del equipo', async ({ page }) => {
    await page.goto('/');

    // 1. Navegar a la pestaña de Impresión de Etiquetas QR
    await navigateToTab(page, 'qrs');

    // 2. Esperar a que cargue la grilla de etiquetas
    await expect(page.locator('.qr-label-card').first()).toBeVisible({ timeout: 15000 });

    // 3. Verificar cantidad de etiquetas generadas (debe haber ~130 extintores en el parque)
    const cardCount = await page.locator('.qr-label-card').count();
    expect(cardCount).toBeGreaterThanOrEqual(100);

    // 4. Inyectar biblioteca jsQR en el navegador para decodificar la imagen real
    const jsqrPath = path.resolve(process.cwd(), 'node_modules/jsqr/dist/jsQR.js');
    await page.addScriptTag({ path: jsqrPath });

    // 5. Decodificar el primer código QR renderizado en pantalla
    const firstCard = page.locator('.qr-label-card').first();
    const codeOnCard = await firstCard.locator('.font-mono, [class*="mono"], strong').first().textContent();
    expect(codeOnCard).toMatch(/MF-\d{3}/);

    const decodedQrContent = await page.evaluate(async () => {
      const img = document.querySelector('.qr-label-card img[src^="data:image"]');
      if (!img) return null;

      if (!img.complete) {
        await new Promise(r => { img.onload = r; });
      }

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 200;
      canvas.height = img.naturalHeight || 200;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrResult = window.jsQR(imageData.data, imageData.width, imageData.height);
      return qrResult ? qrResult.data : null;
    });

    // 6. Validar que el QR decodificado apunta a la URL corta segura del equipo (/m/:publicId)
    expect(decodedQrContent).not.toBeNull();
    expect(decodedQrContent).toContain('/m/');
  });
});
