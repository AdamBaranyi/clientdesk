import { defineConfig, devices } from '@playwright/test';
import { STATE_FILE } from './e2e/paths.ts';

/**
 * Die sechs Prüfbreiten aus docs/TESTING.md, je eine als eigenes Projekt.
 *
 * Jedes Projekt hat seinen eigenen Viewport und lädt jede Seite frisch. Das
 * ist Absicht und der einzige verlässliche Weg: ein Fenster mitten im Test zu
 * ziehen liefert falsche Ergebnisse, weil manche Umgebungen das Layout
 * ändern, ohne der Seite Bescheid zu sagen — dann feuert weder `resize` noch
 * ein `ResizeObserver`, und Bauteile, die sich selbst messen, bleiben auf der
 * alten Grösse stehen. Wer zieht statt neu zu laden, prüft ein Artefakt.
 *
 * 320 ist die untere Grenze aus CLAUDE.md, 640 und 1024 sind die beiden
 * Umbruchpunkte des Entwurfs, und beide werden von je einer Breite darunter
 * und darüber eingeklammert.
 */
const BREITEN = [320, 375, 390, 768, 1024, 1440] as const;

export default defineConfig({
  testDir: './e2e',
  // Läuft gegen den Produktionsaufbau, siehe playwright.production.config.ts.
  testIgnore: 'production.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  // Eine Demo für den ganzen Lauf. Die Anwendung lässt fünf pro
  // Viertelstunde zu; zwei Dutzend wären mehr als die Grenze und die Grenze
  // ist richtig. Siehe e2e/global-setup.ts.
  globalSetup: './e2e/global-setup.ts',

  use: {
    baseURL: 'http://localhost:5173',
    storageState: STATE_FILE,
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    trace: 'on-first-retry',
  },

  projects: BREITEN.map((breite) => ({
    name: `${breite}px`,
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: breite, height: 900 },
    },
  })),

  webServer: {
    command: 'bun dev',
    url: 'http://localhost:5173',
    // Lokal läuft der Server meist schon; in der CI wird er gestartet.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
