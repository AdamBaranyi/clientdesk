import { expect, test, type Page } from '@playwright/test';

/**
 * Prüft den Produktionsaufbau aus infra/compose.prod.yml von aussen: Header,
 * Content Security Policy und einen vollständigen Demo-Durchgang durch Team-
 * und Kundenansicht.
 *
 * Läuft nur mit eigener Konfiguration:
 *   bunx playwright test -c playwright.production.config.ts
 * Ziel über PRODUCTION_URL, ohne Angabe der lokale Aufbau auf Port 8443.
 *
 * Startet genau eine Demo. Die Anwendung lässt fünf je Viertelstunde und
 * Adresse zu, auch gegen den echten Server.
 */

/**
 * Jeder Konsolenfehler zählt, und jeder CSP-Verstoss.
 *
 * Nicht jeder Verstoss erscheint in der Konsole: Zods Probe mit
 * `new Function` scheiterte still, meldete aber `securitypolicyviolation`.
 * Dieser Test sah sie nicht, Lighthouse gegen den Server schon. Deshalb hört
 * ein Skript im Dokument mit, und zwar auf jeder Seite neu — der
 * Rollenwechsel lädt vollständig neu, ein einmal gesetzter Listener wäre
 * danach weg.
 */
async function collectProblems(page: Page): Promise<string[]> {
  const problems: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.error(
        `CSP-Verstoss: ${event.violatedDirective} ${event.blockedURI} in ${event.sourceFile}`,
      );
    });
  });
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  return problems;
}

async function visitEveryLinkIn(page: Page, navigationName: string): Promise<string[]> {
  const navigation = page.getByRole('navigation', { name: navigationName });
  const links = await navigation.getByRole('link').all();
  const visited: string[] = [];
  for (const link of links) {
    const name = (await link.textContent())?.trim() ?? '';
    await link.click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    visited.push(name);
  }
  return visited;
}

test('die Oberfläche trägt die Sicherheitsheader', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);

  const headers = response.headers();
  const csp = headers['content-security-policy'] ?? '';
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("script-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).not.toContain('unsafe-inline');
  expect(headers['strict-transport-security']).toContain('max-age=31536000');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['server']).toBeUndefined();
});

/*
 * Die Angaben kommen erst beim Bauen dazu und stehen nicht im Repository.
 * Fehlen sie im Image, fiele das sonst niemandem auf.
 */
test('das Impressum nennt Anschrift und E-Mail', async ({ page }) => {
  await page.goto('/impressum');
  const address = page.locator('address');
  // innerText, weil textContent die Zeilen ohne Trenner aneinanderhängt:
  // aus "141G" und "6014 Luzern" würde "141G6014 Luzern".
  await expect(address).toContainText(/\b\d{4} \S/, { useInnerText: true });
  await expect(address.getByRole('link', { name: /@/ })).toHaveAttribute('href', /^mailto:.+@.+/);
});

test('ein Demo-Durchgang ohne CSP-Verstoss und ohne Konsolenfehler', async ({ page }) => {
  const problems = await collectProblems(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'Demo starten' }).click();
  await expect(page).toHaveURL(/\/app\/[^/]+\//);
  await page.waitForLoadState('networkidle');

  // Eine neue Demo beginnt mit dem Rundgang, einmal ganz durch.
  const tour = page.getByRole('dialog', { name: 'Rundgang durch die Demo' });
  await expect(tour).toBeVisible();
  for (let step = 1; step < 6; step++) {
    await tour.getByRole('button', { name: 'Weiter' }).click();
  }
  await tour.getByRole('button', { name: 'Loslegen' }).click();
  await expect(tour).toBeHidden();

  const teamPages = await visitEveryLinkIn(page, 'Hauptnavigation');
  expect(teamPages.length).toBeGreaterThanOrEqual(6);

  // Detailseite mit Seitenübergang: der Name wandert aus der Zeile in die Überschrift.
  await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText('Kunden').click();
  await page.waitForLoadState('networkidle');
  await page.getByRole('main').getByRole('link').first().click();
  await page.waitForLoadState('networkidle');

  // Kommandopalette mit Treffern. Die Suche beginnt ab zwei Zeichen.
  await page.getByRole('button', { name: /Springen zu/ }).click();
  await page.getByRole('dialog').getByRole('combobox').fill('al');
  await expect(page.getByRole('option').first()).toBeVisible();
  await page.keyboard.press('Escape');

  // Dokumente werden über die API geladen, als PDF und mit eigener Richtlinie.
  await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText('Dokumente').click();
  await page.waitForLoadState('networkidle');
  // Der sichtbare Text ist "Öffnen", der zugängliche Name nennt die Datei.
  const firstOpenLink = page.getByRole('main').locator('a', { hasText: 'Öffnen' }).first();
  await expect(firstOpenLink).toBeVisible();
  const href = await firstOpenLink.getAttribute('href');
  const download = await page.request.get(href!);
  expect(download.status()).toBe(200);
  expect(download.headers()['content-type']).toBe('application/pdf');
  expect(download.headers()['content-security-policy']).toContain('sandbox');
  expect((await download.body()).subarray(0, 5).toString()).toBe('%PDF-');

  // Wechsel in die Kundenansicht lädt die Oberfläche vollständig neu.
  await page
    .getByRole('button', { name: /^Kunde:/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/portal\//);
  await page.waitForLoadState('networkidle');
  const portalPages = await visitEveryLinkIn(page, 'Portalnavigation');
  expect(portalPages.length).toBeGreaterThan(0);

  // Abmelden führt zur Startseite, nicht zur Anmeldung.
  await page.getByRole('button', { name: 'Abmelden' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'Demo starten' })).toBeVisible();

  expect(problems, problems.join('\n')).toEqual([]);
});
