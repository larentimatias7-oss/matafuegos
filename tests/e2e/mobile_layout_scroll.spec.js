import { test, expect } from '@playwright/test';

test.describe('E2E Flow 8: Layout Móvil y Prevención de Scroll Horizontal', () => {

  const mobileViewports = [
    { name: 'Pantalla compacta 360x640', width: 360, height: 640 },
    { name: 'iPhone estándar 390x844', width: 390, height: 844 }
  ];

  for (const vp of mobileViewports) {
    test(`debe evitar desborde horizontal en ${vp.name} en pantallas de operación`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const testUrls = [
        '/',
        '/?code=MF-001#check'
      ];

      for (const url of testUrls) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Evaluar que no haya scroll horizontal involuntario en la aplicación de campo
        const isHorizontalScrollPresent = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        expect(
          isHorizontalScrollPresent,
          `Se detectó scroll horizontal indeseado en ${url} con resolución ${vp.width}x${vp.height}`
        ).toBe(false);
      }
    });

    test(`los botones principales deben ser accesibles y tener tamaño táctil en ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/?code=MF-001#check');

      // Botón "Todo OK"
      const markOkBtn = page.getByRole('button', { name: /Todo OK/i });
      await expect(markOkBtn).toBeVisible();

      const box = await markOkBtn.boundingBox();
      expect(box).not.toBeNull();
      // Target táctil recomendado
      expect(box.height).toBeGreaterThanOrEqual(36);

      // Botón Guardar
      const saveBtn = page.locator('button[type="submit"]');
      await expect(saveBtn).toBeVisible();
      const saveBox = await saveBtn.boundingBox();
      expect(saveBox.height).toBeGreaterThanOrEqual(40);
    });
  }
});
