import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { navigateToTab, ensureInspectorSession } from './helpers.js';

test.describe('Fase 4: Auditoría de Accesibilidad (Axe-Core)', () => {

  test.beforeEach(async ({ page }) => {
    await ensureInspectorSession(page);
  });

  test('Dashboard debe tener cero violaciones críticas o serias de accesibilidad', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalOrSerious = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalOrSerious.length > 0) {
      console.log('Violaciones detectadas en Dashboard:', JSON.stringify(criticalOrSerious, null, 2));
    }

    expect(criticalOrSerious.length).toBe(0);
  });

  test('Ficha Técnica de Inspección debe tener cero violaciones críticas o serias', async ({ page }) => {
    await page.goto('/?code=MF-001#check');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalOrSerious = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalOrSerious.length > 0) {
      console.log('Violaciones en Inspección:', JSON.stringify(criticalOrSerious, null, 2));
    }

    expect(criticalOrSerious.length).toBe(0);
  });

  test('Inventario de Extintores debe tener cero violaciones críticas o serias', async ({ page }) => {
    await page.goto('/');
    await navigateToTab(page, 'extinguishers');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalOrSerious = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalOrSerious.length > 0) {
      console.log('Violaciones en Inventario:', JSON.stringify(criticalOrSerious, null, 2));
    }

    expect(criticalOrSerious.length).toBe(0);
  });

  test('Portal de Documentación Oficial debe tener cero violaciones críticas o serias', async ({ page }) => {
    await page.goto('/documentacion');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalOrSerious = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalOrSerious.length > 0) {
      console.log('Violaciones en Documentación:', JSON.stringify(criticalOrSerious, null, 2));
    }

    expect(criticalOrSerious.length).toBe(0);
  });
});
