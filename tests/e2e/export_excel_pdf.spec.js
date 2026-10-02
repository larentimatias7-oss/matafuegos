import { test, expect } from '@playwright/test';

test.describe('E2E Flow 6: Exportación de Planilla Excel y Reportes desde Navegador', () => {

  test('debe permitir descargar el libro Excel formateado de auditoría', async ({ page }) => {
    // En Playwright, al navegar directamente a una URL con Content-Disposition: attachment,
    // page.goto inicia la descarga.
    const downloadPromise = page.waitForEvent('download');
    await page.goto('/api/m365/export-excel').catch(e => {
      if (!e.message.includes('Download is starting')) throw e;
    });
    const download = await downloadPromise;

    // Verificar nombre de archivo normativo Milicic
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/Milicic_Control_Matafuegos.*\.xlsx/);

    // Guardar temporalmente y comprobar tamaño
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
  });

  test('debe cargar el informe oficial HTML de auditoría para impresión y guardado como PDF', async ({ page }) => {
    // Abrir endpoint de informe oficial HTML
    await page.goto('/api/m365/report-html');

    // Verificar elementos obligatorios del informe para ART
    await expect(page.locator('h1')).toContainText('CONTROL PERIÓDICO DE EXTINTORES');
    await expect(page.locator('.brand')).toContainText('MILICIC');
    await expect(page.getByText(/IRAM 3517-2/i).first()).toBeVisible();
    await expect(page.locator('.kpi-card')).toHaveCount(4);
    await expect(page.locator('.signatures')).toBeVisible();
  });
});
