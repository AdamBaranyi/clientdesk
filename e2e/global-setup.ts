import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, type FullConfig } from '@playwright/test';
import { AUTH_DIR, STATE_FILE, WORKSPACE_FILE } from './paths.ts';

/**
 * Startet genau eine Demo für den ganzen Lauf.
 *
 * Zuerst startete jeder Test seine eigene — bei sechs Breiten sind das zwei
 * Dutzend, und die Anwendung lässt pro Viertelstunde fünf zu. Die Grenze ist
 * richtig und bleibt; die Tests haben sich zu fügen.
 *
 * Möglich ist das nur, weil diese Tests ausschliesslich lesen. **Ein Test,
 * der Daten anlegt oder ändert, darf diese Sitzung nicht benutzen** — er
 * würde die Trefferzahlen aller anderen verschieben. Für Schreibfälle gibt es
 * die Integrationstests gegen eine eigene Datenbank.
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL ?? 'http://localhost:5173';
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await page.goto('/');
  await page.getByRole('button', { name: /Demo starten/i }).click();
  await page.waitForURL(/\/app\/[0-9a-f-]+\/dashboard/, { timeout: 60_000 });

  const treffer = /\/app\/([0-9a-f-]+)\//.exec(page.url());
  if (!treffer?.[1]) throw new Error(`Keine Workspace-ID in ${page.url()}`);

  await mkdir(AUTH_DIR, { recursive: true });
  await context.storageState({ path: STATE_FILE });
  await writeFile(WORKSPACE_FILE, JSON.stringify({ workspaceId: treffer[1] }), 'utf8');

  await browser.close();
}

export default globalSetup;
