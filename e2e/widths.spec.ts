import { expect, test } from '@playwright/test';
import { demoWorkspaceId, expectNoHorizontalOverflow, warteAufSchriften } from './helpers.ts';

test.describe('Prüfbreiten', () => {
  test('Startseite läuft nicht seitlich', async ({ page }) => {
    await page.goto('/');
    await warteAufSchriften(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('Dashboard läuft nicht seitlich', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/dashboard`);
    await warteAufSchriften(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('Kundenliste läuft nicht seitlich', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/customers`);
    await warteAufSchriften(page);
    await expect(page.getByRole('heading', { name: 'Kunden' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('Liste wechselt bei 640 Pixeln zwischen Tabelle und Karten', async ({ page }, testInfo) => {
    const breite = page.viewportSize()?.width ?? 0;
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/customers`);
    await warteAufSchriften(page);

    const tabelle = page.getByRole('table');
    const karten = page.locator('ul.sm\\:hidden');

    if (breite < 640) {
      await expect(tabelle, `bei ${testInfo.project.name} darf keine Tabelle stehen`).toBeHidden();
      await expect(karten.first()).toBeVisible();
    } else {
      await expect(tabelle.first()).toBeVisible();
      await expect(karten.first()).toBeHidden();
    }
  });

  test('Seitenleiste steht ab 1024 fest, darunter hinter dem Hamburger', async ({ page }) => {
    const breite = page.viewportSize()?.width ?? 0;
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/dashboard`);
    await warteAufSchriften(page);

    const hamburger = page.getByRole('button', { name: 'Navigation öffnen' });
    const hauptnavigation = page.getByRole('navigation', { name: 'Hauptnavigation' });

    if (breite >= 1024) {
      await expect(hamburger).toBeHidden();
      await expect(hauptnavigation.first()).toBeVisible();
      return;
    }

    await expect(hamburger).toBeVisible();
    await hamburger.click();
    await expect(hauptnavigation.first()).toBeVisible();

    // Wieder verlassen können gehört dazu, sonst ist das Panel eine Falle.
    await page.keyboard.press('Escape');
    await expect(hauptnavigation.first()).toBeHidden();
  });

  test('Fliesstext wird nicht verkleinert, um Platz zu schaffen', async ({ page }) => {
    await page.goto('/');
    await warteAufSchriften(page);
    const basis = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    expect(basis).toBe('16px');
  });
});
