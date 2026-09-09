import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { seedWorkspaceWithOwner, type SeededWorkspace } from '../helpers/fixtures.ts';
import { startTestServer, type TestServer } from '../helpers/test-server.ts';

let server: TestServer;
let account: SeededWorkspace;

beforeAll(async () => {
  // Bewusst eng gesetzt, damit die Grenze im Test tatsächlich erreicht wird.
  server = await startTestServer({ loginRateLimitMax: 3 });
}, 60_000);

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  await server.reset();
  account = await seedWorkspaceWithOwner(server.db, {
    workspaceName: 'Seeblick Digital',
    email: 'owner@seeblick.test',
  });
});

describe('Anmeldung wird rate-limitiert', () => {
  it('bremst nach der konfigurierten Anzahl Fehlversuche', async () => {
    const client = server.client();
    const csrf = await client.csrfToken();

    const attempt = () =>
      client.request('/api/v1/auth/login', {
        method: 'POST',
        csrf,
        body: JSON.stringify({ email: account.email, password: 'falsch' }),
      });

    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBeTruthy();
    await expect(blocked.json()).resolves.toMatchObject({ error: { code: 'RATE_LIMITED' } });
  });
});
