#!/usr/bin/env node
/**
 * Projektregel: keine Schrift unter 16 px (CLAUDE.md, Regel 8).
 *
 * Sucht im Quelltext der Oberfläche alles, was eine kleinere Schrift setzen
 * würde: Tailwinds text-xs und text-sm, Grössen in eckigen Klammern,
 * fontSize-Angaben für SVG und Diagramme, font-size in CSS und die
 * Grössen-Tokens selbst.
 *
 * Das ist der schnelle, grobe Teil. Was der Browser am Ende tatsächlich
 * rechnet, auch Vererbtes und Zusammengesetztes, prüft e2e/font-size.spec.ts
 * auf jeder Seite und jeder Breite.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MIN_PX = 16;
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCANNED = ['apps/web/src', 'apps/web/index.html'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.html']);
const SKIPPED_DIRS = new Set(['node_modules', 'dist']);

/** Die Basis ist 16 px, siehe `html` in global.css. */
function toPx(value, unit) {
  const number = Number(value);
  return unit === 'rem' || unit === 'em' ? number * 16 : number;
}

/**
 * Jede Regel liefert die Grösse, die an der Stelle gesetzt würde. `null`
 * heisst: zu klein, ohne dass eine Zahl dasteht.
 */
const RULES = [
  {
    pattern: /(?<![-\w])text-(?:xs|sm)(?![-\w])/g,
    px: () => null,
    what: 'Tailwind-Grösse unter 16 px',
  },
  {
    pattern: /(?<![-\w])text-\[(\d*\.?\d+)(px|rem|em)\]/g,
    px: (m) => toPx(m[1], m[2]),
    what: 'Grösse in Klammern',
  },
  {
    pattern: /\bfontSize\s*[:=]\s*[{'"]?\s*(\d*\.?\d+)(px|rem|em)?/g,
    px: (m) => toPx(m[1], m[2] ?? 'px'),
    what: 'fontSize',
  },
  {
    pattern: /\bfont-size\s*:\s*(\d*\.?\d+)(px|rem|em)/g,
    px: (m) => toPx(m[1], m[2]),
    what: 'font-size',
  },
  {
    pattern: /--text-[\w-]+\s*:\s*(\d*\.?\d+)(px|rem|em)/g,
    px: (m) => toPx(m[1], m[2]),
    what: 'Grössen-Token',
  },
  {
    // Bei fliessender Grösse zählt die Untergrenze, sie gilt auf dem Telefon.
    pattern: /\bclamp\(\s*(\d*\.?\d+)(px|rem|em)/g,
    px: (m) => toPx(m[1], m[2]),
    what: 'Untergrenze von clamp()',
  },
];

/**
 * Kommentare zählen nicht, ihre Zeilen schon: sie werden durch Leerzeichen
 * ersetzt, damit die Zeilennummern der Funde stimmen. `//` direkt nach einem
 * Doppelpunkt bleibt stehen, das ist eine Adresse.
 *
 * @param {string} content
 * @returns {string}
 */
export function stripComments(content) {
  const blank = (text) => text.replace(/[^\n]/g, ' ');
  return content
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/(^|[^:'"\\])(\/\/.*)$/gm, (_, before, comment) => before + blank(comment));
}

/**
 * @param {string} content
 * @returns {{ line: number, text: string, what: string, px: number | null }[]}
 */
export function findSmallFonts(content) {
  const code = stripComments(content);
  const findings = [];
  for (const rule of RULES) {
    for (const match of code.matchAll(rule.pattern)) {
      const px = rule.px(match);
      if (px !== null && px >= MIN_PX) continue;
      const line = code.slice(0, match.index).split('\n').length;
      findings.push({ line, text: match[0].trim(), what: rule.what, px });
    }
  }
  return findings.sort((a, b) => a.line - b.line);
}

/**
 * @param {string} path Absoluter Pfad, Datei oder Verzeichnis.
 * @param {string[]} out
 */
function collect(path, out) {
  if (statSync(path).isFile()) {
    if (EXTENSIONS.has(extname(path))) out.push(path);
    return;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIPPED_DIRS.has(entry.name)) continue;
    collect(join(path, entry.name), out);
  }
}

function main() {
  /** @type {string[]} */
  const files = [];
  for (const path of SCANNED) collect(join(ROOT, path), files);
  files.sort();

  let count = 0;
  for (const absolute of files) {
    const relPath = relative(ROOT, absolute).split(sep).join('/');
    for (const finding of findSmallFonts(readFileSync(absolute, 'utf8'))) {
      if (count === 0) console.error(`\nSchrift unter ${MIN_PX} px:\n`);
      const size = finding.px === null ? '' : `  ${finding.px} px`;
      console.error(`  ${relPath}:${finding.line}  ${finding.text}${size}  (${finding.what})`);
      count += 1;
    }
  }

  if (count > 0) {
    console.error('\nKeine Schrift unter 16 px, auf keiner Breite. Siehe CLAUDE.md, Regel 8.');
    process.exit(1);
  }

  console.log(`check:font-floor ok — ${files.length} Dateien geprüft, nichts unter ${MIN_PX} px.`);
}

// Nur ausführen, wenn direkt aufgerufen — der Test importiert findSmallFonts.
if (process.argv[1] && statSync(process.argv[1]).isFile()) {
  const invoked = relative(ROOT, process.argv[1]).split(sep).join('/');
  if (invoked === 'scripts/check-font-floor.mjs') main();
}
