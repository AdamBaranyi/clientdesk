import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { demoWorkspaceId, warteAufSchriften } from './helpers.ts';

/**
 * axe über die Hauptseiten, hell und dunkel getrennt.
 *
 * Getrennt, weil sich die beiden Wertesätze bei den Kontrasten unterscheiden
 * und ein Lauf in nur einem Erscheinungsbild die Hälfte der Anwendung nicht
 * anschaut. Genau dort lag heute schon ein Befund: `--faint` erreichte auf
 * dunklem Grund 3,7:1 und auf hellem genug.
 *
 * Geprüft wird gegen WCAG 2.2 AA. Nichts wird ausgeblendet — steht hier je
 * eine Ausnahme, dann mit Begründung und nicht als Liste von Regelnamen.
 */
const NORMEN = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/*
 * Ohne Bewegung geprüft, und zwar aus Genauigkeit statt aus Bequemlichkeit.
 *
 * Läuft der Eintritt noch, misst axe die Kontraste bei einer Deckkraft unter
 * eins und meldet Verletzungen, die es im fertigen Bild nicht gibt — bei
 * manchen Breiten, je nachdem wer das Rennen gewinnt. Auf das Ende der
 * Bewegung zu warten hilft nicht zuverlässig: zum Zeitpunkt der Prüfung
 * existieren die Animationen teils noch gar nicht, `getAnimations()` liefert
 * eine leere Liste und die Wartebedingung ist sofort erfüllt.
 *
 * `reduce` schaltet die Eintritte ab und lässt den Ruhezustand stehen. Genau
 * den soll axe messen; die Bewegung selbst prüft focus.spec.ts.
 */
test.use({ reducedMotion: 'reduce' });

async function pruefe(page: Page, thema: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: thema });
  await warteAufSchriften(page);

  /*
   * Erst warten, bis nichts mehr nachlädt, dann laufende Bewegungen ans Ende
   * setzen, dann prüfen, dass wirklich keine mehr läuft.
   *
   * Die Reihenfolge ist der ganze Punkt. Das Kennzahlband hängt sich erst
   * ein, wenn seine Abfrage geantwortet hat, und startet dabei neue
   * Eintritte. Wer vorher `finish()` aufruft, beendet Bewegungen, die es noch
   * gar nicht gibt — und axe misst danach eine Deckkraft unter eins. Genau
   * daher kamen Kontrastbefunde, die bei jedem Lauf auf einer anderen Breite
   * auftraten und im Einzellauf nie.
   */
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.finish();
  });
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== 'running'),
  );

  const ergebnis = await new AxeBuilder({ page }).withTags(NORMEN).analyze();

  const befunde = ergebnis.violations.map((v) => ({
    regel: v.id,
    wirkung: v.impact,
    beschreibung: v.help,
    stellen: v.nodes.map((n) => n.target.join(' ')).slice(0, 4),
  }));

  expect(befunde, `axe-Befunde in ${thema}: ${JSON.stringify(befunde, null, 2)}`).toEqual([]);
}

const SEITEN = [
  { name: 'Dashboard', pfad: (id: string) => `/app/${id}/dashboard` },
  { name: 'Kundenliste', pfad: (id: string) => `/app/${id}/customers` },
  { name: 'Projektliste', pfad: (id: string) => `/app/${id}/projects` },
  { name: 'Vertragsliste', pfad: (id: string) => `/app/${id}/contracts` },
  // Die Rechtsseiten stehen auch mit Sitzung, es gibt keine Weiterleitung.
  { name: 'Impressum', pfad: () => '/impressum' },
  { name: 'Datenschutz', pfad: () => '/datenschutz' },
];

test.describe('Barrierefreiheit', () => {
  for (const seite of SEITEN) {
    for (const thema of ['light', 'dark'] as const) {
      test(`${seite.name}, ${thema === 'dark' ? 'dunkel' : 'hell'}`, async ({ page }) => {
        await page.goto(seite.pfad(demoWorkspaceId()));
        await pruefe(page, thema);
      });
    }
  }

  /*
   * Die Startseite braucht einen eigenen Kontext ohne Anmeldung. Mit der
   * gespeicherten Sitzung leitet „/" sofort auf das Dashboard weiter — die
   * erste Fassung dieses Tests hat deshalb zweimal das Dashboard geprüft und
   * die Startseite nie.
   */
  for (const thema of ['light', 'dark'] as const) {
    test(`Startseite, ${thema === 'dark' ? 'dunkel' : 'hell'}`, async ({ browser }) => {
      const context = await browser.newContext({
        storageState: { cookies: [], origins: [] },
        reducedMotion: 'reduce',
      });
      const seite = await context.newPage();
      await seite.goto('http://localhost:5173/');
      await pruefe(seite, thema);
      await context.close();
    });
  }

  test('der geöffnete Dialog, dunkel', async ({ page }) => {
    await page.goto(`/app/${demoWorkspaceId()}/customers`);
    await page.getByRole('button', { name: 'Kunde anlegen' }).first().click();
    await expect(page.locator('dialog[open]')).toBeVisible();
    await pruefe(page, 'dark');
  });

  test('die Kommandopalette mit Treffern, dunkel', async ({ page }) => {
    await page.goto(`/app/${demoWorkspaceId()}/dashboard`);
    await page.getByRole('button', { name: /Suche öffnen/i }).click();
    await page.getByRole('dialog').getByRole('combobox').fill('berg');
    await expect(page.getByRole('option').first()).toBeVisible();
    await pruefe(page, 'dark');
  });
});
