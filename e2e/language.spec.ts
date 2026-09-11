import { expect, test } from '@playwright/test';

/**
 * Sprachwechsel. Eine Breite genügt: die Übersetzung ändert keine Anordnung,
 * und für das Layout bei 320 Pixeln mit Sprachschalter sorgt widths.spec.ts.
 *
 * Eigener Kontext ohne Anmeldung und ohne gespeicherte Wahl, damit die
 * Erkennung aus dem Browser tatsächlich greift.
 */
test.skip(({ viewport }) => viewport?.width !== 1440, 'Eine Breite genügt.');

test.use({ storageState: { cookies: [], origins: [] } });

test('ein englischer Browser bekommt die englische Oberfläche', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-GB' });
  const page = await context.newPage();
  await page.goto('http://localhost:5173/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Client overview and client portal for small agencies',
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-CH');
  await context.close();
});

test('die Wahl gilt sofort, bleibt nach dem Neuladen und erreicht die API', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Kundenübersicht und Kundenportal für kleine Agenturen',
  );

  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Client overview and client portal for small agencies',
  );
  await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.reload();
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();

  // Meldungen der API kommen in der gewählten Sprache, nicht in der des Browsers.
  await page.goto('/login');
  await page.getByLabel('Email').fill('niemand@example.invalid');
  await page.getByLabel('Password').fill('falsch-und-lang-genug');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.');

  // Prüfmeldungen der gemeinsamen Schemas ebenso.
  await page.getByLabel('Email').fill('');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Email is required')).toBeVisible();
});
