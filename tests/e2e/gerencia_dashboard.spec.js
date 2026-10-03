import { test, expect } from '@playwright/test';
import { ensureGerenciaSession, ensureInspectorSession, navigateToTab } from './helpers.js';

test.describe('E2E: Tablero Ejecutivo de Gerencia (KPIs Power BI)', () => {

  test('usuario con rol GERENCIA ingresa y visualiza el tablero ejecutivo con los 6 Top KPIs', async ({ page }) => {
    await ensureGerenciaSession(page);
    await page.goto('/');

    // Verificar título del módulo
    await expect(page.getByText(/Gerencia • Tablero Ejecutivo de Seguridad/i)).toBeVisible();

    // Verificar Síntesis Ejecutiva en lenguaje natural
    await expect(page.getByText(/Síntesis Ejecutiva de Desempeño y Riesgo/i)).toBeVisible();
    await expect(page.locator('.gerencia-narrative-text')).toBeVisible();

    // Verificar las 6 Tarjetas Ejecutivas
    const cards = page.locator('.gerencia-cards-grid .kpi-card');
    await expect(cards).toHaveCount(6);

    // Verificar tarjetas clave
    await expect(page.getByText(/Índice de Salud de Planta/i).first()).toBeVisible();
    await expect(page.getByText(/Cumplimiento de Ronda/i).first()).toBeVisible();
    await expect(page.getByText(/Vigencia Normativa IRAM/i).first()).toBeVisible();
    await expect(page.getByText(/Casos y Tiempo Medio/i).first()).toBeVisible();
    await expect(page.getByText(/Disponibilidad de Protección/i).first()).toBeVisible();
    await expect(page.getByText(/Confiabilidad e Integridad/i).first()).toBeVisible();
  });

  test('los 5 Paneles Estratégicos se renderizan correctamente con gráficos interactivos', async ({ page }) => {
    await ensureGerenciaSession(page);
    await page.goto('/');

    // 1. Panel "¿Estamos cumpliendo?"
    await expect(page.getByText(/¿Estamos cumpliendo\? • Evolución a 12 Meses/i)).toBeVisible();
    await expect(page.getByText(/Meta Reglamentaria: 95%/i)).toBeVisible();

    // 2. Panel "¿Dónde está el riesgo?" (Heatmap)
    await expect(page.getByText(/¿Dónde está el riesgo\? • Mapa de Calor de Sectores/i)).toBeVisible();
    const heatmapCards = page.locator('.heatmap-card');
    await expect(heatmapCards.first()).toBeVisible();

    // 3. Panel "¿Qué viene?" (Vencimientos)
    await expect(page.getByText(/¿Qué viene\? • Vencimientos y Presupuesto Proyectado/i)).toBeVisible();
    await expect(page.getByText(/Cargas Anuales/i)).toBeVisible();
    await expect(page.getByText(/Pruebas Hidrostáticas/i)).toBeVisible();

    // 4. Panel "¿Resolvemos rápido?" (MTTR y Aging)
    await expect(page.getByText(/¿Resolvemos rápido\? • Antigüedad y MTTR/i)).toBeVisible();
    await expect(page.getByText(/Meta MTTR: ≤ 7 días/i)).toBeVisible();

    // 5. Panel Proveedores de Taller IRAM
    await expect(page.getByText(/Gestión de Proveedores de Taller y Mantenimiento Externo/i)).toBeVisible();
    await expect(page.getByText(/Taller Certificado IRAM #1042/i)).toBeVisible();
  });

  test('soporta cross-filtering interactivo al hacer click en un sector del mapa de calor', async ({ page }) => {
    await ensureGerenciaSession(page);
    await page.goto('/');

    const firstSectorCard = page.locator('.heatmap-card').first();
    const sectorName = await firstSectorCard.locator('.heatmap-sector-name').innerText();

    // Click para activar cross-filtering
    await firstSectorCard.click();
    await expect(firstSectorCard).toHaveClass(/selected/);
    await expect(page.getByText(new RegExp(`Filtro Activo: ${sectorName}`, 'i'))).toBeVisible();

    // Click en botón para limpiar filtro
    await page.getByRole('button', { name: /Limpiar filtro/i }).click();
    await expect(firstSectorCard).not.toHaveClass(/selected/);
  });

  test('abre modal de Power BI con credenciales Bearer y listado de endpoints analíticos', async ({ page }) => {
    await ensureGerenciaSession(page);
    await page.goto('/');

    await page.getByRole('button', { name: /Power BI/i }).click();
    await expect(page.getByText(/Conectar con Power BI Desktop/i)).toBeVisible();
    await expect(page.getByText(/TOKEN DE ACCESO SOLO LECTURA/i)).toBeVisible();
    await expect(page.getByText(/Power Query \(M\) Snippet/i)).toBeVisible();

    // Cerrar modal
    await page.getByRole('button', { name: /Cerrar modal de Power BI/i }).click({ force: true });
  });

  test('activa y desactiva el Modo Presentación para pantallas de sala de reuniones', async ({ page }) => {
    await ensureGerenciaSession(page);
    await page.goto('/');

    await page.getByRole('button', { name: /Modo Presentación/i }).click();
    await expect(page.locator('.presentation-overlay')).toBeVisible();
    await expect(page.getByText(/SALA DE GERENCIA • SEGURIDAD PATRIMONIAL/i)).toBeVisible();

    // Salir del modo presentación
    await page.locator('.presentation-overlay button').filter({ hasText: /Salir/i }).click();
    await expect(page.locator('.presentation-overlay')).not.toBeVisible();
  });

  test('un usuario con rol INSPECTOR no tiene acceso al tablero de Gerencia', async ({ page }) => {
    await ensureInspectorSession(page);
    await page.goto('/');

    // En inspector, la pestaña Gerencia no debe estar visible en el navbar principal
    const isMobile = await page.locator('.mobile-bottom-nav').isVisible().catch(() => false);
    if (!isMobile) {
      await expect(page.locator('.desktop-only').getByRole('button', { name: /Gerencia/i })).not.toBeVisible();
    }
  });

});
