import { mkdir } from 'node:fs/promises';
import { chromium, type Browser, type BrowserContext } from 'playwright';

/**
 * Nimmt vergleichbare Bilder derselben Seiten aus zwei laufenden Ständen auf.
 *
 *   bun scripts/screenshot.ts nachher 5173
 *   bun scripts/screenshot.ts vorher  5174
 *
 * Der Vorher-Stand läuft aus einem zweiten Arbeitsbaum:
 *
 *   git worktree add /tmp/clientdesk-vorher a998cfb
 *
 * Beide Stände sprechen dieselbe API auf Port 4000. Die Demo-Sitzung wird
 * deshalb immer über 5173 gestartet — nur dieser Ursprung ist der API als
 * erlaubt bekannt. Das Sitzungs-Cookie gilt danach für beide Ports, weil
 * Cookies den Port nicht unterscheiden.
 *
 * `reducedMotion: 'reduce'` ist kein Beiwerk: ohne das steht die Aufnahme
 * mitten in einer Eintrittsbewegung, und zwei Läufe wären nie vergleichbar.
 */
const BREITE = 1440;
const HOEHE = 900;
const ERLAUBTER_URSPRUNG = 'http://localhost:5173';

interface Aufnahme {
  name: string;
  pfad: (workspaceId: string) => string;
  angemeldet: boolean;
  ganzeSeite?: boolean;
}

const AUFNAHMEN: Aufnahme[] = [
  { name: 'startseite', pfad: () => '/', angemeldet: false, ganzeSeite: true },
  { name: 'dashboard', pfad: (id) => `/app/${id}/dashboard`, angemeldet: true },
  { name: 'kundenliste', pfad: (id) => `/app/${id}/customers`, angemeldet: true },
  { name: 'projektliste', pfad: (id) => `/app/${id}/projects`, angemeldet: true },
];

async function neuerKontext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({
    viewport: { width: BREITE, height: HOEHE },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    locale: 'de-CH',
  });
}

/** Startet eine Demo und gibt die Workspace-ID zurück. */
async function demoStarten(kontext: BrowserContext): Promise<string> {
  const seite = await kontext.newPage();
  await seite.goto(`${ERLAUBTER_URSPRUNG}/`, { waitUntil: 'networkidle' });
  await seite.getByRole('button', { name: /Demo starten/i }).click();
  await seite.waitForURL(/\/app\/[0-9a-f-]+\/dashboard/, { timeout: 30_000 });

  const treffer = /\/app\/([0-9a-f-]+)\//.exec(seite.url());
  if (!treffer?.[1]) throw new Error(`Keine Workspace-ID in ${seite.url()}`);

  await seite.close();
  return treffer[1];
}

async function main(): Promise<void> {
  const [variante, port] = process.argv.slice(2);
  if (!variante || !port) {
    throw new Error('Aufruf: bun scripts/screenshot.ts <vorher|nachher> <port>');
  }

  const ordner = 'docs/screenshots';
  await mkdir(ordner, { recursive: true });

  const browser = await chromium.launch();
  const angemeldet = await neuerKontext(browser);
  const workspaceId = await demoStarten(angemeldet);
  const anonym = await neuerKontext(browser);

  for (const aufnahme of AUFNAHMEN) {
    const kontext = aufnahme.angemeldet ? angemeldet : anonym;
    const seite = await kontext.newPage();
    await seite.goto(`http://localhost:${port}${aufnahme.pfad(workspaceId)}`, {
      waitUntil: 'networkidle',
    });
    // Schriften müssen stehen, sonst wechselt die Zeilenumbrüche zwischen den Läufen.
    await seite.evaluate(() => document.fonts.ready);
    const datei = `${ordner}/${variante}-${aufnahme.name}.png`;
    await seite.screenshot({ path: datei, fullPage: aufnahme.ganzeSeite ?? false });
    console.log(datei);
    await seite.close();
  }

  await browser.close();
}

await main();
