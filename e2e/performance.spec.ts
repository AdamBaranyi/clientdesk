import { existsSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { LOAD_STATE_FILE, LOAD_WORKSPACE_FILE } from './paths.ts';

/**
 * Messungen gegen den Lastdaten-Workspace: 1'000 Kunden, 3'000 Projekte,
 * 1'500 Verträge, 10'000 Anfragen.
 *
 *   bun --env-file=.env run seed:load
 *
 * Gegen den Vorführ-Seed mit acht Kunden zu messen sagt über das Verhalten
 * bei tausend nichts — deshalb der eigene Bestand und der eigene Zugang.
 *
 * Die Grenzen sind die anerkannten Schwellen für „gut" bei LCP und CLS, nicht
 * die hier gemessenen Werte. Lokal ist alles um ein Vielfaches schneller als
 * über ein echtes Netz; ein Budget auf dem lokalen Wert würde in der CI oder
 * auf dem Server sofort und ohne Erkenntnis reissen. Der gemessene Wert wird
 * mitgeschrieben, damit eine Verschlechterung sichtbar wird.
 */
const LCP_GRENZE_MS = 2500;
const CLS_GRENZE = 0.1;

/*
 * Eine Einschränkung, die man kennen muss, bevor man diese Zahlen zitiert:
 * gemessen wird gegen den Entwicklungsserver, nicht gegen einen Produktbau.
 * Vite liefert dort unminifizierte Module einzeln aus. Für LCP und CLS als
 * Regressionssignal reicht das — beide hängen hier an Layout und Nachladen,
 * nicht an der Bündelgrösse. Für eine Aussage über echte Ladezeiten reicht es
 * nicht; die Auslieferungsgrösse misst deshalb `check:bundle-size` am
 * gebauten Ergebnis, und die echte Ladezeit gehört auf den Server aus
 * Meilenstein 6.
 */

/*
 * Angemeldet wird einmal im globalen Setup. Die Anwendung lässt fünf
 * Anmeldeversuche je Fenster zu — drei Messungen, die sich einzeln anmelden,
 * verbrauchen die Grenze in einem einzigen Lauf. Dieselbe Lehre wie bei der
 * Demo: die Grenze ist richtig, die Tests fügen sich.
 */
const lastDatenVorhanden = existsSync(LOAD_WORKSPACE_FILE);

/*
 * Ausdrücklich der Lastdaten-Zugang und nicht die Demo aus der
 * Konfiguration. Ohne diese Zeile misst die Datei den Vorführbestand mit acht
 * Kunden — und liefert Zahlen, die nach einer Messung aussehen und keine sind.
 */
test.use({ storageState: LOAD_STATE_FILE });

function lastWorkspaceId(): string {
  const { workspaceId } = JSON.parse(readFileSync(LOAD_WORKSPACE_FILE, 'utf8')) as {
    workspaceId: string;
  };
  return workspaceId;
}

/** Grösster Inhaltsanstrich und aufsummierte Layoutverschiebung. */
async function messeKennwerte(page: Page): Promise<{ lcp: number; cls: number }> {
  return page.evaluate(
    () =>
      new Promise<{ lcp: number; cls: number }>((fertig) => {
        let lcp = 0;
        let cls = 0;

        new PerformanceObserver((liste) => {
          for (const eintrag of liste.getEntries()) lcp = Math.max(lcp, eintrag.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        new PerformanceObserver((liste) => {
          for (const eintrag of liste.getEntries()) {
            const verschiebung = eintrag as PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
            };
            // Verschiebungen direkt nach einer Eingabe zählen nicht — die hat
            // der Nutzer selbst ausgelöst.
            if (!verschiebung.hadRecentInput) cls += verschiebung.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });

        // Eine Sekunde nach dem Laden ist der Anstrich durch und ein
        // nachgeladenes Bündel hat seine Verschiebung angerichtet oder nicht.
        setTimeout(() => fertig({ lcp, cls }), 1000);
      }),
  );
}

test.describe('Kennwerte gegen Lastdaten', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'Eine Breite genügt: sechsmal dieselbe Zahl ist keine zusätzliche Erkenntnis.',
  );
  test.skip(
    !lastDatenVorhanden,
    'Kein Lastdaten-Bestand. Anlegen mit: bun --env-file=.env run seed:load',
  );

  test('Dashboard', async ({ page }, testInfo) => {
    const workspaceId = lastWorkspaceId();
    await page.goto(`/app/${workspaceId}/dashboard`);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    const { lcp, cls } = await messeKennwerte(page);
    testInfo.annotations.push({ type: 'LCP', description: `${Math.round(lcp)} ms` });
    testInfo.annotations.push({ type: 'CLS', description: cls.toFixed(4) });

    expect(lcp, `LCP ${Math.round(lcp)} ms`).toBeLessThan(LCP_GRENZE_MS);
    expect(cls, `CLS ${cls.toFixed(4)}`).toBeLessThan(CLS_GRENZE);
  });

  test('Kundenliste mit 1000 Kunden', async ({ page }, testInfo) => {
    const workspaceId = lastWorkspaceId();
    await page.goto(`/app/${workspaceId}/customers`);
    await expect(page.getByRole('table')).toBeVisible();

    const { lcp, cls } = await messeKennwerte(page);
    testInfo.annotations.push({ type: 'LCP', description: `${Math.round(lcp)} ms` });
    testInfo.annotations.push({ type: 'CLS', description: cls.toFixed(4) });

    expect(lcp).toBeLessThan(LCP_GRENZE_MS);
    expect(cls).toBeLessThan(CLS_GRENZE);
  });

  test('die Suche antwortet, während 1000 Kunden im Bestand sind', async ({ page }, testInfo) => {
    const workspaceId = lastWorkspaceId();
    await page.goto(`/app/${workspaceId}/customers`);
    await expect(page.getByRole('table')).toBeVisible();

    const beginn = Date.now();
    const antwort = page.waitForResponse(
      (res) => res.url().includes('/customers?') && res.url().includes('search='),
    );
    await page.getByRole('searchbox', { name: 'Kunden durchsuchen' }).fill('Kunde 4');
    await antwort;
    const dauer = Date.now() - beginn;

    testInfo.annotations.push({ type: 'Suchantwort', description: `${dauer} ms` });
    // Grosszügig: das ist eine Regressionsschwelle, keine Zielvorgabe.
    expect(dauer, `Suche brauchte ${dauer} ms`).toBeLessThan(2000);
  });
});
