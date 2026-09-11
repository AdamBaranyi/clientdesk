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
 * Chrome meldet jeden CSP-Verstoss als Fehler in der Konsole, auch über ein
 * vollständiges Neuladen hinweg — anders als ein Ereignis-Listener im
 * Dokument, der mit jedem Neuladen verschwindet. Der Rollenwechsel lädt neu.
 */
function collectProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    // Vor der Anmeldung fragt die Oberfläche nach der Sitzung und bekommt 401.
    if (text.includes('status of 401')) return;
    problems.push(text);
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

test('ein Demo-Durchgang ohne CSP-Verstoss und ohne Konsolenfehler', async ({ page }) => {
  const problems = collectProblems(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'Demo starten' }).click();
  await expect(page).toHaveURL(/\/app\/[^/]+\//);
  await page.waitForLoadState('networkidle');

  const teamPages = await visitEveryLinkIn(page, 'Hauptnavigation');
  expect(teamPages.length).toBeGreaterThanOrEqual(6);

  // Detailseite mit Seitenübergang: der Name wandert aus der Zeile in die Überschrift.
  await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText('Kunden').click();
  await page.waitForLoadState('networkidle');
  await page.getByRole('main').getByRole('link').first().click();
  await page.waitForLoadState('networkidle');

  // Kommandopalette mit Treffern. Die Suche beginnt ab zwei Zeichen.
  await page.getByRole('button', { name: /Springen zu/ }).click();
  await page.getByRole('combobox').fill('al');
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

  expect(problems, problems.join('\n')).toEqual([]);
});
