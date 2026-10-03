import { test, expect } from '@playwright/test';
import { navigateToTab, ensureAdminSession } from './helpers.js';

test.describe('E2E Flow 4: Alta, Edición y Búsqueda / Filtros de Inventario', () => {

  test('debe permitir buscar, filtrar, dar de alta y editar un extintor', async ({ page }) => {
    await ensureAdminSession(page);
    await page.goto('/');

    // 1. Navegar a Inventario de Extintores
    await navigateToTab(page, 'extinguishers');

    const searchInput = page.locator('input[placeholder*="Buscar por código"]').first();
    await expect(searchInput).toBeVisible();

    // 2. Búsqueda por código existente
    await searchInput.fill('MF-001');
    const items = page.locator('.desktop-table-view tbody tr:visible, .mobile-extinguisher-card:visible');
    await expect(items.first()).toContainText('MF-001');

    // Limpiar búsqueda
    await searchInput.fill('');
    await expect(items.first()).toBeVisible();

    // 3. Alta de nuevo extintor con código único para evitar colisiones entre navegadores
    const newBtn = page.locator('button:has-text("Nuevo Extintor"):visible, button[title="Nuevo Extintor"]:visible').first();
    await newBtn.click();

    // Verificar modal abierto
    await expect(page.locator('.modal-overlay:visible')).toBeVisible();

    const uniqueCode = `MF-${Math.floor(1100 + Math.random() * 8800)}`;
    await page.locator('input[placeholder*="MF-"]').first().fill(uniqueCode);
    await page.locator('input[placeholder*="Piso 2"]').first().fill('Sector Pruebas E2E');
    
    // Guardar extintor
    const saveExtBtn = page.locator('.modal-overlay:visible button[type="submit"]');
    await saveExtBtn.click();

    // Esperar a que se cierre el modal
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 });

    // 4. Buscar el equipo recién creado
    await searchInput.fill(uniqueCode);
    const createdItem = page.locator('.desktop-table-view tbody tr:visible, .mobile-extinguisher-card:visible').filter({ hasText: uniqueCode }).first();
    await expect(createdItem).toBeVisible({ timeout: 5000 });

    // 5. Edición del extintor
    const editBtn = createdItem.locator('button[title*="Editar Ficha" i], button:has-text("Ficha")').first();
    await editBtn.click();
    await expect(page.locator('.modal-overlay:visible')).toBeVisible();

    // Modificar observaciones
    const notesInput = page.locator('textarea[placeholder*="observaciones" i]').first();
    await notesInput.fill('Ficha actualizada por prueba automatizada E2E');

    const updateBtn = page.locator('.modal-overlay:visible button[type="submit"]');
    await updateBtn.click();

    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 });
  });
});
