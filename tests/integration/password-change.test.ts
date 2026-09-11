import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { seedWorkspaceWithOwner, type SeededWorkspace } from '../helpers/fixtures.ts';
import { login } from '../helpers/scenario.ts';
import { startTestServer, type TestClient, type TestServer } from '../helpers/test-server.ts';

let server: TestServer;
let account: SeededWorkspace;

beforeAll(async () => {
  server = await startTestServer();
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

const NEW_PASSWORD = 'Ein-neues-Passwort-2026';

interface ErrorBody {
  error: { code: string; fieldErrors?: Record<string, string[]> };
}

async function changePassword(client: TestClient, currentPassword: string, newPassword: string) {
  const csrf = await client.csrfToken();
  return client.request('/api/v1/auth/password', {
    method: 'POST',
    csrf,
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

async function tryLogin(password: string): Promise<number> {
  const client = server.client();
  const csrf = await client.csrfToken();
  const response = await client.request('/api/v1/auth/login', {
    method: 'POST',
    csrf,
    body: JSON.stringify({ email: account.email, password }),
  });
  return response.status;
}

describe('Passwort ändern', () => {
  it('nimmt danach das neue Passwort und nicht mehr das alte', async () => {
    const client = await login(server, account);
    expect((await changePassword(client, account.password, NEW_PASSWORD)).status).toBe(204);

    expect(await tryLogin(account.password)).toBe(401);
    expect(await tryLogin(NEW_PASSWORD)).toBe(200);
  });

  it('beendet die anderen Sitzungen des Kontos und behält die eigene', async () => {
    const changer = await login(server, account);
    const otherDevice = await login(server, account);

    await changePassword(changer, account.password, NEW_PASSWORD);

    await expect((await otherDevice.request('/api/v1/auth/me')).json()).resolves.toBeNull();
    await expect((await changer.request('/api/v1/auth/me')).json()).resolves.not.toBeNull();
  });

  it('verlangt das bisherige Passwort und antwortet dabei nicht mit 401', async () => {
    const client = await login(server, account);
    const response = await changePassword(client, 'geraten-und-falsch', NEW_PASSWORD);

    // 422 statt 401: die Oberfläche beendet bei 401 die Sitzung.
    expect(response.status).toBe(422);
    const body = (await response.json()) as ErrorBody;
    expect(body.error.fieldErrors?.currentPassword).toEqual(['Stimmt nicht']);
    expect(await tryLogin(account.password)).toBe(200);
  });

  it('weist ein zu kurzes und ein unverändertes Passwort ab', async () => {
    const client = await login(server, account);

    const tooShort = (await (
      await changePassword(client, account.password, 'kurz')
    ).json()) as ErrorBody;
    expect(tooShort.error.fieldErrors?.newPassword).toEqual(['Mindestens 12 Zeichen']);

    const unchanged = (await (
      await changePassword(client, account.password, account.password)
    ).json()) as ErrorBody;
    expect(unchanged.error.fieldErrors?.newPassword).toEqual([
      'Das neue Passwort muss sich vom bisherigen unterscheiden',
    ]);
  });

  it('gibt es ohne Anmeldung nicht', async () => {
    expect((await changePassword(server.client(), account.password, NEW_PASSWORD)).status).toBe(
      401,
    );
  });

  it('ist in der Demo gesperrt', async () => {
    const demo = server.client();
    const csrf = await demo.csrfToken();
    expect((await demo.request('/api/v1/demo/sessions', { method: 'POST', csrf })).status).toBe(
      201,
    );

    const response = await changePassword(demo, 'irgendetwas', NEW_PASSWORD);
    expect(response.status).toBe(403);
  });
});
