import { chromium } from 'playwright';

/**
 * Nimmt das Vorschaubild für geteilte Links auf: die echte Startseite in
 * 1200 × 630, dem Format, das Messenger und soziale Netzwerke erwarten.
 *
 *   bun scripts/capture-og-image.ts                         # Entwicklungsserver
 *   bun scripts/capture-og-image.ts https://localhost:8443  # Produktionsaufbau lokal
 *
 * Ein Bildschirmfoto statt einer gestalteten Karte: es zeigt, was man beim
 * Klick tatsächlich bekommt, und behauptet nichts, was die Seite nicht sagt.
 * Hell, weil die Vorschau meist auf hellem Grund steht.
 */
const ziel = process.argv[2] ?? 'http://localhost:5173';
const lokal = new URL(ziel).hostname === 'localhost';
const AUSGABE = 'apps/web/public/og.png';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'de-CH',
    // Nur für die lokale Zertifizierungsstelle von Caddy, nie gegen eine echte Adresse.
    ignoreHTTPSErrors: lokal,
  });
  await page.goto(ziel);
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: AUSGABE });
  console.log(`Gespeichert: ${AUSGABE}`);
} finally {
  await browser.close();
}
