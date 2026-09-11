import { gzipSync } from 'node:zlib';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Hält die Auslieferungsgrösse des Frontends fest.
 *
 * Gemessen wird gzip, weil das ankommt und nicht, was auf der Platte liegt.
 * Die Grenzen liegen knapp über dem, was gemessen wurde — ein Budget mit
 * viel Luft ist kein Budget, sondern eine Notiz. Erstlast JS am 11.09.2026:
 * 135.7 KB, nachdem Teamansicht, Portal und Rechtsseiten nachgeladen werden.
 * Davor waren es mit vier Sprachen 191 KB, über der alten Grenze von 170 KB.
 *
 * „Erstlast" ist, was jeder Besucher zieht, bevor er irgendetwas anklickt.
 * Nachgeladene Teile zählen einzeln: dass das Diagramm gross ist, ist in
 * Ordnung, solange es nur auf der Seite mit dem Diagramm geladen wird.
 */
const DIST = 'apps/web/dist/assets';

const BUDGET_KB = {
  erstlastJs: 142,
  erstlastCss: 8,
  diagramm: 115,
};

async function gzipKb(pfad) {
  const inhalt = await readFile(pfad);
  return gzipSync(inhalt, { level: 9 }).length / 1024;
}

function pruefe(name, gemessen, grenze, befunde) {
  const ok = gemessen <= grenze;
  console.log(
    `${ok ? 'ok  ' : 'ZU GROSS'} ${name.padEnd(14)} ${gemessen.toFixed(1).padStart(6)} KB gzip  (Grenze ${grenze} KB)`,
  );
  if (!ok) befunde.push(`${name}: ${gemessen.toFixed(1)} KB über der Grenze von ${grenze} KB`);
}

const dateien = await readdir(DIST).catch(() => {
  throw new Error(`${DIST} fehlt. Zuerst bauen: bun run --filter '@tallyroom/web' build`);
});

const js = dateien.filter((d) => d.endsWith('.js'));
const css = dateien.filter((d) => d.endsWith('.css'));

/*
 * Erstlast ist, was index.html anfordert: der Einstieg und alles, was Vite
 * dafür vorab lädt (`modulepreload`). Seit Teamansicht, Portal und
 * Rechtsseiten nachgeladen werden, teilt der Bundler gemeinsame Teile in
 * eigene Dateien. Nur nach dem Namen `index-` zu gehen, würde dann zu wenig
 * zählen.
 */
const html = await readFile('apps/web/dist/index.html', 'utf8');
const angefordert = [...html.matchAll(/(?:src|href)="\/assets\/([^"]+\.js)"/g)].map((t) => t[1]);
const erstlastJs = [...new Set(angefordert)];
const diagramm = js.filter((d) => d.startsWith('ContractValueChart-'));
const uebrig = js.filter((d) => !erstlastJs.includes(d) && !diagramm.includes(d));

if (!erstlastJs.some((d) => d.startsWith('index-')))
  throw new Error('index.html fordert kein Einstiegsbündel an.');
if (diagramm.length !== 1)
  throw new Error('Das Diagramm muss ein eigenes, nachgeladenes Bündel sein.');
if (erstlastJs.some((d) => d.startsWith('WorkspaceRoutes-') || d.startsWith('PortalRoutes-')))
  throw new Error(
    'Teamansicht oder Portal steckt in der Erstlast; beide sollen nachgeladen werden.',
  );

const befunde = [];
let erstlastKb = 0;
for (const datei of erstlastJs) erstlastKb += await gzipKb(join(DIST, datei));
pruefe('Erstlast JS', erstlastKb, BUDGET_KB.erstlastJs, befunde);
pruefe('Erstlast CSS', await gzipKb(join(DIST, css[0])), BUDGET_KB.erstlastCss, befunde);
pruefe('Diagramm', await gzipKb(join(DIST, diagramm[0])), BUDGET_KB.diagramm, befunde);

for (const datei of uebrig) {
  const groesse = await gzipKb(join(DIST, datei));
  console.log(`     ${datei.padEnd(34)} ${groesse.toFixed(1).padStart(6)} KB gzip  (nachgeladen)`);
}

if (befunde.length > 0) {
  console.error(`\ncheck:bundle-size fehlgeschlagen:\n- ${befunde.join('\n- ')}`);
  process.exit(1);
}
console.log('\ncheck:bundle-size ok');
