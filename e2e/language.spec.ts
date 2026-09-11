import { expect, test } from '@playwright/test';

/**
 * Sprachwechsel. Eine Breite genügt: die Übersetzung ändert keine Anordnung,
 * und für das Layout bei 320 Pixeln mit Sprachschalter sorgt widths.spec.ts.
 *
 * Ohne Anmeldung und ohne gespeicherte Wahl, damit die Erkennung aus dem
 * Browser tatsächlich greift.
 */
test.skip(({ viewport }) => viewport?.width !== 1440, 'Eine Breite genügt.');

test.use({ storageState: { cookies: [], origins: [] } });

const GERMAN_HEADLINE = 'Kundenübersicht und Kundenportal für kleine Agenturen';

for (const [browserLocale, expected] of [
  ['en-GB', 'en'],
  ['fr-CH', 'fr'],
  ['it-CH', 'it'],
  ['rm-CH', 'de'],
] as const) {
  test(`ein Browser mit ${browserLocale} bekommt ${expected}`, async ({ browser }) => {
    const context = await browser.newContext({ locale: browserLocale });
    const page = await context.newPage();
    await page.goto('http://localhost:5173/');

    await expect(page.locator('html')).toHaveAttribute('lang', `${expected}-CH`);
    const headline = page.getByRole('heading', { level: 1 });
    if (expected === 'de') await expect(headline).toHaveText(GERMAN_HEADLINE);
    else await expect(headline).not.toHaveText(GERMAN_HEADLINE);
    await context.close();
  });
}

test('die Wahl gilt sofort, bleibt nach dem Neuladen und erreicht die API', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GERMAN_HEADLINE);

  await page.getByLabel('Sprache').selectOption('en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Client overview and client portal for small agencies',
  );

  await page.reload();
  await expect(page.getByLabel('Language')).toHaveValue('en');

  // Meldungen der API kommen in der gewählten Sprache, nicht in der des Browsers.
  // Nach fünf Läufen in einer Viertelstunde greift das Anmelde-Limit; auch
  // dessen Meldung kommt von der API und beweist dasselbe.
  await page.goto('/login');
  await page.getByLabel('Email').fill('niemand@example.invalid');
  await page.getByLabel('Password').fill('falsch-und-lang-genug');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    /^(Email or password is incorrect\.|Too many attempts\. Please try again later\.)$/,
  );

  // Prüfmeldungen der gemeinsamen Schemas ebenso.
  await page.getByLabel('Email').fill('');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Email is required')).toBeVisible();
});

test('jede Übersetzung der Rechtsseiten sagt, dass die deutsche Fassung gilt', async ({ page }) => {
  await page.goto('/impressum');
  const note = page
    .getByRole('main')
    .getByText(/German version is binding|version allemande fait foi|Fa fede la versione tedesca/);
  await expect(note).toHaveCount(0);

  for (const locale of ['fr', 'it', 'en'] as const) {
    await page.getByRole('combobox').selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', `${locale}-CH`);
    await expect(note).toHaveCount(1);
  }
});
