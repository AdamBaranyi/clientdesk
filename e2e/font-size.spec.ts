import { expect, test, type Page } from '@playwright/test';
import {
  demoWorkspaceId,
  expectNamedFormFields,
  expectNoHorizontalOverflow,
  expectReadableText,
  warteAufSchriften,
} from './helpers.ts';
import { TOUR_KEY } from './paths.ts';

/**
 * Keine Schrift unter 16 px, auf jeder Seite und jeder der sechs Breiten
 * (CLAUDE.md, Regel 8). Grössere Schrift braucht Platz, deshalb prüft jede
 * Station dasselbe mit: nichts läuft seitlich, kein Wort bricht mitten im
 * Wort um, jedes Formularfeld hat eine id oder einen name.
 *
 * Die Kundenansicht fehlt hier mit Absicht: ein Rollenwechsel stellt die
 * Sitzung um, die alle anderen Tests teilen. Sie läuft in production.spec.ts
 * mit eigener Demo durch dieselbe Prüfung.
 */
test.use({ contextOptions: { reducedMotion: 'reduce' } });

async function pruefe(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await warteAufSchriften(page);
  await expectReadableText(page);
  await expectNoHorizontalOverflow(page);
  await expectNamedFormFields(page);
}

test.describe('ohne Anmeldung', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // Ein Einladungslink, den es nicht gibt, zeigt die Fehlerseite der Einladung.
  for (const pfad of ['/', '/login', '/impressum', '/datenschutz', '/join/gibt-es-nicht']) {
    test(pfad, async ({ page }) => {
      await page.goto(pfad);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await pruefe(page);
    });
  }
});

test.describe('Teamansicht', () => {
  const BEREICHE = [
    'dashboard',
    'customers',
    'projects',
    'contracts',
    'requests',
    'documents',
    'settings',
  ];

  test('jeder Bereich', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    for (const bereich of BEREICHE) {
      await page.goto(`/app/${workspaceId}/${bereich}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await pruefe(page);
    }
  });

  test('je eine Detailseite', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    for (const bereich of ['customers', 'projects', 'contracts', 'requests']) {
      await page.goto(`/app/${workspaceId}/${bereich}`);
      await page.waitForLoadState('networkidle');
      // Unter 640 Pixeln steht die Liste als Karten, die Tabelle ist versteckt.
      await page
        .getByRole('main')
        .locator(`a[href*="/${bereich}/"]`)
        .filter({ visible: true })
        .first()
        .click();
      await expect(page).toHaveURL(new RegExp(`/${bereich}/[0-9a-f-]{36}`));
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await pruefe(page);
    }
  });

  test('Formulare im Dialog', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    for (const [bereich, knopf] of [
      ['customers', 'Kunde anlegen'],
      ['projects', 'Projekt anlegen'],
      ['contracts', 'Vertrag anlegen'],
      ['requests', 'Anfrage anlegen'],
    ] as const) {
      await page.goto(`/app/${workspaceId}/${bereich}`);
      await page.getByRole('button', { name: knopf }).first().click();
      await expect(page.locator('dialog[open]')).toBeVisible();
      await pruefe(page);
    }
  });

  test('Kommandopalette mit Treffern', async ({ page }) => {
    await page.goto(`/app/${demoWorkspaceId()}/dashboard`);
    await page.getByRole('button', { name: /Suche öffnen/i }).click();
    await page.getByRole('dialog').getByRole('combobox').fill('berg');
    await expect(page.getByRole('option').first()).toBeVisible();
    await pruefe(page);
  });

  test('Rundgang, jeder Schritt', async ({ page }) => {
    await page.goto(`/app/${demoWorkspaceId()}/dashboard`);
    // Nur in diesem Browserkontext; die gemeinsame Demo merkt davon nichts.
    await page.evaluate((key) => window.localStorage.removeItem(key), TOUR_KEY);
    await page.reload();
    const dialog = page.getByRole('dialog', { name: 'Rundgang durch die Demo' });
    await expect(dialog).toBeVisible();

    for (let schritt = 1; schritt <= 6; schritt++) {
      await pruefe(page);
      if (schritt < 6) await dialog.getByRole('button', { name: 'Weiter' }).click();
    }
  });

  test('Navigation hinter dem Hamburger', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'Ab 1024 steht die Seitenleiste fest.');
    await page.goto(`/app/${demoWorkspaceId()}/dashboard`);
    await page.getByRole('button', { name: 'Navigation öffnen' }).click();
    await expect(page.getByRole('navigation', { name: 'Hauptnavigation' }).first()).toBeVisible();
    await pruefe(page);
  });
});
