import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config.ts';

/**
 * Dieselben Prüfungen in den Engines von Safari und Firefox, auf Geräten
 * statt nur auf Breiten: iPhone und iPad mit Touch, Pixeldichte und
 * Kennung von iOS, dazu Safari und Firefox am Schreibtisch.
 *
 * WebKit auf dem Mac ist Safaris Engine, aber nicht iOS selbst. Ein Blick
 * auf ein echtes iPhone ersetzt das nicht.
 *
 * Nicht Teil der CI: beide Browser sind ein eigener Download.
 *   bunx playwright install webkit firefox
 *   bun run test:e2e:browsers
 */
export default defineConfig({
  ...base,
  projects: [
    { name: 'iPhone SE (WebKit)', use: { ...devices['iPhone SE (3rd gen)'] } },
    { name: 'iPhone 15 (WebKit)', use: { ...devices['iPhone 15'] } },
    { name: 'iPad Pro 11 (WebKit)', use: { ...devices['iPad Pro 11'] } },
    {
      name: 'Safari 1440',
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'Firefox 1440',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'Firefox 390',
      use: { ...devices['Desktop Firefox'], viewport: { width: 390, height: 844 } },
    },
  ],
});
