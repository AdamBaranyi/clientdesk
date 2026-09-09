import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { createDatabase, createPool, type Database, type Pool } from '@clientdesk/db';
import { createApp } from '../../apps/api/src/app.ts';
import { createMemoryStorage } from '../../apps/api/src/storage/memory.ts';
import { loadEnv } from '../../apps/api/src/config/env.ts';

const APP_ORIGIN = 'http://localhost:5173';

export interface TestServer {
  baseUrl: string;
  db: Database;
  pool: Pool;
  /** Speicher im Prozess: die Tests prüfen die Regeln, nicht die S3-Anbindung. */
  storage: ReturnType<typeof createMemoryStorage>;
  /** Eigener Cookie-Speicher je Client, damit zwei Sitzungen sich nicht mischen. */
  client: () => TestClient;
  reset: () => Promise<void>;
  close: () => Promise<void>;
}

export interface TestClient {
  request: (path: string, init?: RequestInit & { csrf?: string }) => Promise<Response>;
  json: <T>(path: string, init?: RequestInit & { csrf?: string }) => Promise<T>;
  csrfToken: () => Promise<string>;
  cookieHeader: () => string;
}

function connectionString(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL fehlt. Testdatenbank starten mit:\n' +
        '  docker compose -f infra/docker-compose.yml up -d postgres_test',
    );
  }
  return url;
}

export interface TestServerOptions {
  /** Standard ist hoch, damit die Anmeldung in Tests nicht am Limiter scheitert.
      Für den Limiter-Test wird bewusst ein kleiner Wert übergeben. */
  loginRateLimitMax?: number;
  /** Für den Test, dass eine abgeschaltete Demo gar nicht existiert. */
  demoEnabled?: boolean;
  /** Standard hoch, damit der Limiter nicht andere Tests stört. */
  demoRateLimitMax?: number;
}

export async function startTestServer(options: TestServerOptions = {}): Promise<TestServer> {
  const env = loadEnv({
    NODE_ENV: 'test',
    DATABASE_URL: connectionString(),
    SESSION_SECRET: 'test-secret-mindestens-zweiunddreissig-zeichen',
    APP_ORIGIN,
    TRUST_PROXY_HOPS: '0',
    LOGIN_RATE_LIMIT_MAX: String(options.loginRateLimitMax ?? 1000),
    DEMO_ENABLED: options.demoEnabled === false ? 'false' : 'true',
    DEMO_RATE_LIMIT_MAX: String(options.demoRateLimitMax ?? 500),
    S3_ENDPOINT: 'http://localhost:9000',
    S3_BUCKET: 'test',
    S3_ACCESS_KEY_ID: 'test',
    S3_SECRET_ACCESS_KEY: 'test',
  } as NodeJS.ProcessEnv);

  const pool = createPool({ connectionString: connectionString(), maxConnections: 5 });
  const db = createDatabase(pool);

  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../../packages/db/migrations', import.meta.url)),
  });

  const storage = createMemoryStorage();
  const app = createApp({ env, db, pool, storage });
  const server: Server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('Kein Port erhalten.');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    db,
    pool,
    storage,
    client: () => createClient(baseUrl),
    async reset() {
      // Der Speicher gehört zum Zustand des Servers und wird mit zurückgesetzt.
      storage.clear();
      await db.execute(sql`
        TRUNCATE TABLE
          activity_events, idempotency_keys, request_comments, service_requests,
          documents, contract_rates, service_contracts, milestones, projects,
          invitations, memberships, customers, workspaces, users, session
        RESTART IDENTITY CASCADE
      `);
    },
    async close() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await pool.end();
    },
  };
}

function createClient(baseUrl: string): TestClient {
  const cookies = new Map<string, string>();

  function absorb(response: Response): void {
    for (const raw of response.headers.getSetCookie()) {
      const pair = raw.split(';', 1)[0];
      const separator = pair?.indexOf('=') ?? -1;
      if (!pair || separator < 0) continue;
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (value === '') cookies.delete(name);
      else cookies.set(name, value);
    }
  }

  const cookieHeader = () => [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');

  async function request(
    path: string,
    init: RequestInit & { csrf?: string } = {},
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    const jar = cookieHeader();
    if (jar) headers.set('cookie', jar);
    // Schreibende Requests brauchen einen erlaubten Origin — genau wie im Browser.
    // Ein im Test ausdrücklich gesetzter Origin bleibt stehen, sonst könnte der
    // Helper den Angriffsfall wegkonfigurieren, den der Test prüfen soll.
    if (init.method && init.method !== 'GET' && !headers.has('origin')) {
      headers.set('origin', APP_ORIGIN);
    }
    if (init.csrf) headers.set('x-csrf-token', init.csrf);
    if (init.body && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }

    const response = await fetch(`${baseUrl}${path}`, { ...init, headers, redirect: 'manual' });
    absorb(response);
    return response;
  }

  return {
    request,
    async json<T>(path: string, init?: RequestInit & { csrf?: string }): Promise<T> {
      const response = await request(path, init);
      return (await response.json()) as T;
    },
    async csrfToken(): Promise<string> {
      const body = await (await request('/api/v1/auth/csrf')).json();
      return (body as { csrfToken: string }).csrfToken;
    },
    cookieHeader,
  };
}
