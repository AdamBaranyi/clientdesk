import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['scripts/**/*.test.mjs', 'tests/**/*.test.ts', 'apps/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: false,
    // Integrationstests teilen sich eine Datenbank und laufen deshalb nacheinander.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
