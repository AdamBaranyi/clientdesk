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

    return { scrollWidth: wurzel.scrollWidth, clientWidth: breite, schuldige };
  });

  expect(befund, `Waagerechter Überlauf: ${JSON.stringify(befund)}`).toBeNull();
}

/** Die Schriften müssen stehen, sonst misst man Zeilenumbrüche der Ersatzschrift. */
export async function warteAufSchriften(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
}
