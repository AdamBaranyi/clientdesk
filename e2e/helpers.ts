import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import { WORKSPACE_FILE } from './paths.ts';

/**
 * Die Workspace-ID der Demo, die `global-setup.ts` einmal für den Lauf
 * angelegt hat. Die Anmeldung kommt über `storageState` aus der Konfiguration.
 */
export function demoWorkspaceId(): string {
  const roh = readFileSync(WORKSPACE_FILE, 'utf8');
  const { workspaceId } = JSON.parse(roh) as { workspaceId: string };
  return workspaceId;
}

/**
 * Prüft, dass die Seite nicht seitlich läuft — und nennt beim Scheitern das
 * schuldige Element. Eine Meldung „scrollWidth 1147 statt 320" allein schickt
 * einen auf die Suche; der Name des Übeltäters beendet sie.
 */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const befund = await page.evaluate(() => {
    const wurzel = document.documentElement;
    if (wurzel.scrollWidth <= wurzel.clientWidth) return null;

    const breite = wurzel.clientWidth;
    const schuldige = [...document.querySelectorAll('body *')]
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.right > breite + 1)
      .slice(0, 3)
      .map(({ el, rect }) => {
        // getAttribute statt className: bei SVG ist className kein Text.
        const klasse = el.getAttribute('class') ?? '';
        return `${el.tagName.toLowerCase()}.${klasse.split(' ').slice(0, 3).join('.')} bis ${Math.round(rect.right)}px`;
      });

    /*
     * Text zählt auch dann, wenn sein Kasten in der Breite bleibt: ein Wort,
     * das über seinen Rahmen hinausragt, verbreitert die Seite, ohne dass ein
     * Element zu weit rechts steht. Genau so lief es in WebKit, und die
     * Meldung nannte niemanden.
     */
    if (schuldige.length === 0) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let node = walker.nextNode(); node && schuldige.length < 3; node = walker.nextNode()) {
        const text = node.textContent ?? '';
        if (!text.trim()) continue;
        range.selectNodeContents(node);
        const rechts = Math.max(0, ...[...range.getClientRects()].map((rect) => rect.right));
        if (rechts <= breite + 1) continue;
        const el = node.parentElement;
        const klasse = el?.getAttribute('class') ?? '';
        schuldige.push(
          `Text in ${el?.tagName.toLowerCase()}.${klasse.split(' ').slice(0, 3).join('.')} ` +
            `bis ${Math.round(rechts)}px: «${text.trim().slice(0, 40)}»`,
        );
      }
    }

    return { scrollWidth: wurzel.scrollWidth, clientWidth: breite, schuldige };
  });

  expect(befund, `Waagerechter Überlauf: ${JSON.stringify(befund)}`).toBeNull();
}

/** Die Schriften müssen stehen, sonst misst man Zeilenumbrüche der Ersatzschrift. */
export async function warteAufSchriften(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
}

/** Die Untergrenze aus CLAUDE.md, Regel 8. */
const MIN_FONT_PX = 16;

/**
 * Keine Schrift unter 16 px, gemessen an dem, was der Browser tatsächlich
 * rechnet: jeder sichtbare Text, jedes Eingabefeld, jeder Text aus ::before
 * und ::after. Dazu kein Wort, das mitten im Wort umbricht. Genau das
 * passiert, wenn grössere Schrift eine Spalte zu eng macht: aus «Danach»
 * wurde bei 320 Pixeln «Danac» und darunter ein einsames «h».
 *
 * Adressen und Pfade dürfen umbrechen, wo sie müssen; eine E-Mail-Adresse
 * ist oft breiter als ein Telefon.
 */
export async function expectReadableText(page: Page): Promise<void> {
  const befund = await page.evaluate((min) => {
    const beschreibe = (el: Element, text: string) => {
      const klasse = (el.getAttribute('class') ?? '').split(' ').slice(0, 3).join('.');
      return `${el.tagName.toLowerCase()}${klasse ? `.${klasse}` : ''} «${text.trim().slice(0, 40)}»`;
    };
    const sichtbar = (el: Element) =>
      el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const groesse = (el: Element, pseudo?: string) =>
      parseFloat(getComputedStyle(el, pseudo).fontSize);

    const zuKlein: string[] = [];
    const gebrochen: string[] = [];
    const gemessen = new Set<Element>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const range = document.createRange();

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? '';
      const el = node.parentElement;
      // Den Text einer Auswahlliste oder eines Textfelds zeichnet das Feld selbst.
      if (!el || !text.trim() || el.closest('select, textarea') || !sichtbar(el)) continue;

      if (!gemessen.has(el)) {
        gemessen.add(el);
        const px = groesse(el);
        if (px < min) zuKlein.push(`${px}px ${beschreibe(el, text)}`);
      }

      for (const stueck of text.matchAll(/\S+/g)) {
        if (/[@/\\]|\.\w/.test(stueck[0])) continue;
        for (const wort of stueck[0].matchAll(/[\p{L}\p{N}]+/gu)) {
          const start = (stueck.index ?? 0) + (wort.index ?? 0);
          range.setStart(node, start);
          range.setEnd(node, start + wort[0].length);
          const teile = [...range.getClientRects()].filter((rect) => rect.width > 0);
          const erste = teile[0];
          if (erste && teile.some((rect) => rect.top >= erste.bottom - 1)) {
            gebrochen.push(`«${wort[0]}» in ${beschreibe(el, text)}`);
          }
        }
      }
    }

    const ohneText = ['checkbox', 'radio', 'hidden', 'file', 'range', 'color'];
    for (const el of document.querySelectorAll<HTMLInputElement>('input, select, textarea')) {
      if (ohneText.includes(el.type) || !sichtbar(el)) continue;
      const px = groesse(el);
      if (px < min) zuKlein.push(`${px}px ${beschreibe(el, el.value || el.placeholder)}`);
    }

    for (const el of document.querySelectorAll('body *')) {
      for (const pseudo of ['::before', '::after']) {
        const inhalt = getComputedStyle(el, pseudo).content;
        if (!/^["'].*\S.*["']$/.test(inhalt)) continue;
        const px = groesse(el, pseudo);
        if (px < min) zuKlein.push(`${px}px ${pseudo} ${beschreibe(el, inhalt)}`);
      }
    }

    return { zuKlein, gebrochen };
  }, MIN_FONT_PX);

  expect(
    befund.zuKlein,
    `Schrift unter ${MIN_FONT_PX} px:\n${befund.zuKlein.slice(0, 10).join('\n')}`,
  ).toEqual([]);
  expect(
    befund.gebrochen,
    `Mitten im Wort umgebrochen:\n${befund.gebrochen.slice(0, 10).join('\n')}`,
  ).toEqual([]);
}

/**
 * Jedes Formularfeld hat eine id oder einen name. Ohne beides kann der
 * Browser es weder zuordnen noch ausfüllen, und Chrome führt es in den
 * DevTools unter „Issues".
 */
export async function expectNamedFormFields(page: Page): Promise<void> {
  const ohne = await page.evaluate(() =>
    [...document.querySelectorAll('input, select, textarea')]
      .filter((el) => !el.id && !el.getAttribute('name'))
      .map((el) => el.outerHTML.slice(0, 120)),
  );
  expect(ohne, `Formularfelder ohne id und name:\n${ohne.join('\n')}`).toEqual([]);
}
