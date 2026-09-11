import { defineConfig, devices } from '@playwright/test';

/**
 * Prüfung gegen den Produktionsaufbau statt gegen den Entwicklungsserver.
 * Kein webServer: der Aufbau läuft schon, lokal über infra/compose.prod.yml,
 * sonst auf dem Server.
 *
 * Lokal stellt Caddy für "localhost" ein Zertifikat seiner eigenen
 * Zertifizierungsstelle aus, dem kein Browser vertraut. Nur dort wird der
 * Zertifikatsfehler ignoriert, gegen eine echte Adresse nie.
 */
const productionUrl = process.env.PRODUCTION_URL ?? 'https://localhost:8443';
const isLocal = new URL(productionUrl).hostname === 'localhost';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'production.spec.ts',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: productionUrl,
    ignoreHTTPSErrors: isLocal,
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
  },
});
