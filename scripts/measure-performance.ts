import { createServer } from 'node:http';
import { createDatabase, createPool, workspaces } from '@clientdesk/db';
import { eq } from 'drizzle-orm';
import { createApp } from '../apps/api/src/app.ts';
import { loadEnv } from '../apps/api/src/config/env.ts';

/**
 * Misst die API-Laufzeit gegen den Lastdaten-Workspace. Ohne diesen Seed gibt
 * es nichts zu messen, und eine genannte Laufzeit wäre erfunden.
 *
 *   bun run seed:load
 *   bun --env-file=.env scripts/measure-performance.ts
 */
const APP_ORIGIN = 'http://localhost:5173';
const WARMUP = 5;
const ITERATIONS = 30;

interface Result {
  label: string;
  p50: number;
  p95: number;
  max: number;
}

function percentile(sorted: number[], fraction: number): number {
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * fraction));
  return sorted[index] ?? 0;
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL fehlt.');

  const env = loadEnv({
    NODE_ENV: 'test',
    DATABASE_URL: connectionString,
    SESSION_SECRET: 'messung-secret-mindestens-zweiunddreissig-zeichen',
    APP_ORIGIN,
  } as NodeJS.ProcessEnv);

  const pool = createPool({ connectionString, maxConnections: 10 });
  const db = createDatabase(pool);
  const server = createServer(createApp({ env, db, pool }));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('Kein Port erhalten.');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.name, 'Lastdaten (nur lokal)'))
    .limit(1);
  if (!workspace) throw new Error('Lastdaten fehlen. Zuerst: bun run seed:load');

  const cookies = new Map<string, string>();
  const absorb = (response: Response) => {
    for (const raw of response.headers.getSetCookie()) {
      const [name, value] = (raw.split(';', 1)[0] ?? '').split('=');
      if (name && value) cookies.set(name, value);
    }
  };
  const jar = () => [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');

  const csrfResponse = await fetch(`${baseUrl}/api/v1/auth/csrf`);
  absorb(csrfResponse);
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: jar(),
      origin: APP_ORIGIN,
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify({
      email: 'last@clientdesk.test',
      password: 'Lastdaten-Passwort-2026',
    }),
  });
  absorb(loginResponse);
  if (!loginResponse.ok) throw new Error('Anmeldung mit dem Lastdaten-Konto fehlgeschlagen.');

  const base = `/api/v1/workspaces/${workspace.id}`;
  const cases: { label: string; path: string }[] = [
    { label: 'Dashboard (Stichtag heute)', path: `${base}/dashboard` },
    { label: 'Kundenliste, Seite 1', path: `${base}/customers` },
    { label: 'Kundenliste, Seite 20', path: `${base}/customers?page=20` },
    { label: 'Kundensuche', path: `${base}/customers?search=Lastkunde+07` },
    { label: 'Projektliste, Seite 1', path: `${base}/projects` },
    { label: 'Projektliste, gefiltert', path: `${base}/projects?status=active` },
    { label: 'Vertragsliste, Seite 1', path: `${base}/contracts` },
  ];

  const results: Result[] = [];
  for (const testCase of cases) {
    const call = async () => {
      const response = await fetch(`${baseUrl}${testCase.path}`, { headers: { cookie: jar() } });
      if (!response.ok) throw new Error(`${testCase.label}: HTTP ${response.status}`);
      await response.arrayBuffer();
    };

    for (let i = 0; i < WARMUP; i += 1) await call();

    const timings: number[] = [];
    for (let i = 0; i < ITERATIONS; i += 1) {
      const startedAt = performance.now();
      await call();
      timings.push(performance.now() - startedAt);
    }
    timings.sort((a, b) => a - b);
    results.push({
      label: testCase.label,
      p50: percentile(timings, 0.5),
      p95: percentile(timings, 0.95),
      max: timings[timings.length - 1] ?? 0,
    });
  }

  console.log(`\nMessung gegen ${workspace.id}`);
  console.log(`${WARMUP} Aufwärm- und ${ITERATIONS} gemessene Aufrufe je Fall.\n`);
  console.log('| Abfrage | p50 | p95 | max |');
  console.log('| --- | ---: | ---: | ---: |');
  for (const result of results) {
    console.log(
      `| ${result.label} | ${result.p50.toFixed(0)} ms | ${result.p95.toFixed(0)} ms | ${result.max.toFixed(0)} ms |`,
    );
  }

  const ueber = results.filter((result) => result.p95 > 500);
  console.log(
    ueber.length === 0
      ? '\nAlle Abfragen bleiben im 95. Perzentil unter 500 ms.'
      : `\nÜber 500 ms im 95. Perzentil: ${ueber.map((r) => r.label).join(', ')}`,
  );

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
