import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { seedWorkspaceWithOwner, type SeededWorkspace } from '../helpers/fixtures.ts';
import { startTestServer, type TestServer } from '../helpers/test-server.ts';

let server: TestServer;
let alpen: SeededWorkspace;
let nordlicht: SeededWorkspace;

beforeAll(async () => {
  server = await startTestServer();
}, 60_000);

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  await server.reset();
  alpen = await seedWorkspaceWithOwner(server.db, {
    workspaceName: 'Alpenblick Studio',
    email: 'owner@alpenblick.test',
  });
  nordlicht = await seedWorkspaceWithOwner(server.db, {
    workspaceName: 'Nordlicht Architektur',
    email: 'owner@nordlicht.test',
  });
});

async function login(account: SeededWorkspace) {
  const client = server.client();
  const csrf = await client.csrfToken();
  const response = await client.request('/api/v1/auth/login', {
    method: 'POST',
    csrf,
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  expect(response.status).toBe(200);
  return client;
}

describe('Mandantentrennung', () => {
  it('liefert dem Owner seinen eigenen Workspace', async () => {
    const client = await login(alpen);
    const response = await client.request(`/api/v1/workspaces/${alpen.workspaceId}`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: alpen.workspaceId,
      role: 'owner',
    });
  });

  it('antwortet auf einen fremden Workspace mit 404, nicht mit 403', async () => {
    const client = await login(alpen);
    const response = await client.request(`/api/v1/workspaces/${nordlicht.workspaceId}`);
    // 403 würde bestätigen, dass diese ID existiert.
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'NOT_FOUND' } });
  });

  it('listet nur die eigenen Mitgliedschaften', async () => {
    const client = await login(alpen);
    const body = await client.json<{ data: { id: string }[] }>('/api/v1/workspaces');
    expect(body.data.map((entry) => entry.id)).toEqual([alpen.workspaceId]);
  });

  it('weist eine erfundene Workspace-ID ab', async () => {
    const client = await login(alpen);
    const response = await client.request(
      '/api/v1/workspaces/00000000-0000-4000-8000-000000000000',
    );
    expect(response.status).toBe(404);
  });

  it('weist eine unsinnige Workspace-ID ab, ohne den Server zu stören', async () => {
    const client = await login(alpen);
    const response = await client.request('/api/v1/workspaces/kein-uuid');
    expect(response.status).toBe(404);
  });
});

describe('Sitzung', () => {
  it('verweigert /auth/me ohne Anmeldung', async () => {
    const response = await server.client().request('/api/v1/auth/me');
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
  });

  it('nennt bei falschem Passwort keinen Unterschied zu unbekannter E-Mail', async () => {
    const client = server.client();
    const csrf = await client.csrfToken();
    const falsePassword = await client.request('/api/v1/auth/login', {
      method: 'POST',
      csrf,
      body: JSON.stringify({ email: alpen.email, password: 'falsch' }),
    });
    const unknownEmail = await client.request('/api/v1/auth/login', {
      method: 'POST',
      csrf,
      body: JSON.stringify({ email: 'niemand@example.test', password: 'falsch' }),
    });

    expect(falsePassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    const [a, b] = await Promise.all([falsePassword.json(), unknownEmail.json()]);
    expect((a as { error: { message: string } }).error.message).toBe(
      (b as { error: { message: string } }).error.message,
    );
  });

  it('erneuert die Sitzungs-ID nach der Anmeldung', async () => {
    const client = server.client();
    const csrf = await client.csrfToken();
    const before = client.cookieHeader();

    await client.request('/api/v1/auth/login', {
      method: 'POST',
      csrf,
      body: JSON.stringify({ email: alpen.email, password: alpen.password }),
    });

    expect(client.cookieHeader()).not.toBe(before);
    expect(before).not.toBe('');
  });

  it('macht die Sitzung serverseitig ungültig, nicht nur im Browser', async () => {
    const client = await login(alpen);
    const cookieAfterLogin = client.cookieHeader();
    const csrf = await client.csrfToken();

    expect((await client.request('/api/v1/auth/logout', { method: 'POST', csrf })).status).toBe(
      204,
    );

    // Das alte Cookie erneut vorlegen: der Server darf es nicht mehr akzeptieren.
    const replay = await fetch(`${server.baseUrl}/api/v1/auth/me`, {
      headers: { cookie: cookieAfterLogin },
    });
    expect(replay.status).toBe(401);
  });

  it('trennt zwei gleichzeitige Sitzungen voneinander', async () => {
    const alpenClient = await login(alpen);
    const nordlichtClient = await login(nordlicht);

    const a = await alpenClient.json<{ email: string }>('/api/v1/auth/me');
    const b = await nordlichtClient.json<{ email: string }>('/api/v1/auth/me');

    expect(a.email).toBe(alpen.email);
    expect(b.email).toBe(nordlicht.email);
  });
});

describe('CSRF', () => {
  it('weist einen schreibenden Request ohne Token ab', async () => {
    const client = server.client();
    await client.csrfToken();
    const response = await client.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: alpen.email, password: alpen.password }),
    });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'CSRF_FAILED' } });
  });

  it('weist ein fremdes Token ab', async () => {
    const client = server.client();
    await client.csrfToken();
    const response = await client.request('/api/v1/auth/login', {
      method: 'POST',
      csrf: 'ein-erfundenes-token',
      body: JSON.stringify({ email: alpen.email, password: alpen.password }),
    });
    expect(response.status).toBe(403);
  });

  it('weist eine fremde Herkunft ab, auch mit gültigem Token', async () => {
    const client = server.client();
    const csrf = await client.csrfToken();
    const response = await client.request('/api/v1/auth/login', {
      method: 'POST',
      csrf,
      headers: { origin: 'https://angreifer.example' },
      body: JSON.stringify({ email: alpen.email, password: alpen.password }),
    });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'CSRF_FAILED' } });
  });
});

describe('Fehlerantworten', () => {
  it('gibt keine SQL-Details oder Stacktraces preis', async () => {
    const response = await server.client().request('/api/v1/gibt-es-nicht');
    const text = await response.text();
    expect(response.status).toBe(404);
    expect(text).not.toMatch(/select|from |pg_|stack|at Object/i);
  });

  it('trägt in jeder Antwort eine Request-ID', async () => {
    const response = await server.client().request('/api/v1/auth/me');
    expect(response.headers.get('x-request-id')).toBeTruthy();
  });
});
