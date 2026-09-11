import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { demoWorkspaceId, warteAufSchriften } from './helpers.ts';
import { TOUR_KEY } from './paths.ts';

/**
 * Der Rundgang durch die Demo.
 *
 * Die gemeinsame Sitzung hat ihn als gesehen vermerkt (global-setup.ts). Jeder
 * Test nimmt den Vermerk in seinem eigenen Browserkontext wieder heraus; an
 * der Demo selbst ändert das nichts, der Rundgang liest nur.
 */
const SCHRITTE = 6;

async function rundgangOeffnen(page: Page): Promise<Locator> {
  await page.goto(`/app/${demoWorkspaceId()}/dashboard`);
  await page.evaluate((key) => window.localStorage.removeItem(key), TOUR_KEY);
  await page.reload();
  await warteAufSchriften(page);
  const dialog = page.getByRole('dialog', { name: 'Rundgang durch die Demo' });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Die Karte steht ganz im Bild, auch bei 320 Pixeln. Sie wird nach dem Zeichnen gesetzt. */
async function karteImBild(page: Page, dialog: Locator) {
  const viewport = page.viewportSize();
  await expect(async () => {
    const box = await dialog.locator('section').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
  }).toPass({ timeout: 3_000 });
}

/** Der ausgesparte Rahmen liegt über dem Element, um das es im Schritt geht. */
async function rahmenUm(page: Page, dialog: Locator, ziel: string) {
  await expect(async () => {
    const rahmen = await dialog.locator('[data-tour-spotlight]').boundingBox();
    const element = await page.locator(`[data-tour="${ziel}"]:visible`).first().boundingBox();
    expect(rahmen).not.toBeNull();
    expect(element).not.toBeNull();
    const ueberlappt =
      rahmen!.x < element!.x + element!.width &&
      element!.x < rahmen!.x + rahmen!.width &&
      rahmen!.y < element!.y + element!.height &&
      element!.y < rahmen!.y + rahmen!.height;
    expect(ueberlappt).toBe(true);
  }).toPass({ timeout: 3_000 });
}

test.describe('Rundgang', () => {
  test('öffnet sich einmal, führt durch alle Schritte und bleibt danach zu', async ({ page }) => {
    const dialog = await rundgangOeffnen(page);
    const weiter = dialog.getByRole('button', { name: 'Weiter' });
    await expect(weiter).toBeFocused();

    for (let schritt = 1; schritt < SCHRITTE; schritt++) {
      await expect(dialog.getByText(`Schritt ${schritt} von ${SCHRITTE}`)).toBeVisible();
      await karteImBild(page, dialog);
      if (schritt === 2) await rahmenUm(page, dialog, 'metrics');
      if (schritt === 3) await expect(dialog.getByRole('term')).toHaveCount(6);
      if (schritt === 5) await rahmenUm(page, dialog, 'role-switch');
      await weiter.click();
    }

    await expect(dialog.getByText(`Schritt ${SCHRITTE} von ${SCHRITTE}`)).toBeVisible();
    await karteImBild(page, dialog);
    await dialog.getByRole('button', { name: 'Loslegen' }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await warteAufSchriften(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });

  test('startet aus dem Banner neu, Escape beendet ihn, der Fokus kehrt zurück', async ({
    page,
  }) => {
    await page.goto(`/app/${demoWorkspaceId()}/customers`);
    await warteAufSchriften(page);

    // Per Tastatur, wie in focus.spec.ts begründet.
    const knopf = page.getByRole('button', { name: 'Rundgang starten' });
    await knopf.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/dashboard$/);

    const dialog = page.getByRole('dialog', { name: 'Rundgang durch die Demo' });
    await expect(dialog.getByText(`Schritt 1 von ${SCHRITTE}`)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Weiter' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(knopf).toBeFocused();
  });

  for (const thema of ['light', 'dark'] as const) {
    test(`besteht axe, ${thema === 'dark' ? 'dunkel' : 'hell'}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: thema, reducedMotion: 'reduce' });
      const dialog = await rundgangOeffnen(page);

      // Der Schritt mit dem meisten Inhalt: die Bereiche mit ihren Erklärungen.
      await dialog.getByRole('button', { name: 'Weiter' }).click();
      await dialog.getByRole('button', { name: 'Weiter' }).click();
      await expect(dialog.getByRole('term')).toHaveCount(6);

      const ergebnis = await new AxeBuilder({ page })
        .include('dialog[open]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const befunde = ergebnis.violations.map((v) => `${v.id}: ${v.help}`);
      expect(befunde).toEqual([]);
    });
  }
});
