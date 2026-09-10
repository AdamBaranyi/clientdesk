import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
 *
 * Läuft die Sitzung vom letzten Mal noch, wird sie weiterverwendet. Sonst
 * verbraucht jeder Lauf während der Entwicklung eine der fünf Demos, und nach
 * dem fünften Durchgang steht man vor derselben Grenze wie eben.
 */
/** Eine gespeicherte Sitzung ist brauchbar, solange sie nicht zur Anmeldung führt. */
async function bestehendeSitzungLaeuftNoch(baseURL: string): Promise<boolean> {
  if (!existsSync(STATE_FILE) || !existsSync(WORKSPACE_FILE)) return false;

  const { workspaceId } = JSON.parse(await readFile(WORKSPACE_FILE, 'utf8')) as {
    workspaceId: string;
  };
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ baseURL, storageState: STATE_FILE });
    const page = await context.newPage();
    await page.goto(`/app/${workspaceId}/dashboard`);
    await page.waitForLoadState('networkidle');
    return page.url().includes(`/app/${workspaceId}/`);
  } catch {
    return false;
  } finally {
    await browser.close();
  }
}

async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL ?? 'http://localhost:5173';
  if (await bestehendeSitzungLaeuftNoch(baseURL)) return;

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await page.goto('/');
  await page.getByRole('button', { name: /Demo starten/i }).click();

  try {
    await page.waitForURL(/\/app\/[0-9a-f-]+\/dashboard/, { timeout: 60_000 });
  } catch (fehler) {
    // Ohne diese Erklärung sucht man den Fehler in den Tests statt in der
    // Begrenzung, die genau so gedacht ist.
    const meldung = await page
      .getByRole('alert')
      .textContent()
      .catch(() => null);
    await browser.close();
    throw new Error(
      `Demo konnte nicht gestartet werden${meldung ? `: ${meldung.trim()}` : ''}. ` +
        'Die Anwendung lässt fünf Demos je Viertelstunde zu — abwarten oder die API neu starten.',
      { cause: fehler },
    );
  }

  const treffer = /\/app\/([0-9a-f-]+)\//.exec(page.url());
  if (!treffer?.[1]) throw new Error(`Keine Workspace-ID in ${page.url()}`);

  await mkdir(AUTH_DIR, { recursive: true });
  await context.storageState({ path: STATE_FILE });
  await writeFile(WORKSPACE_FILE, JSON.stringify({ workspaceId: treffer[1] }), 'utf8');

  await browser.close();
}

export default globalSetup;
