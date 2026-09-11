import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resetPassword } from '@tallyroom/db/reset-password';
import { seedWorkspaceWithOwner, type SeededWorkspace } from '../helpers/fixtures.ts';
import { login } from '../helpers/scenario.ts';
import { startTestServer, type TestServer } from '../helpers/test-server.ts';

/**
 * Der Befehl für ein vergessenes Passwort (`bun run admin:reset-password`).
 * Geprüft wird die Funktion dahinter, gegen die echte Datenbank.
 */
let server: TestServer;
let account: SeededWorkspace;

beforeAll(async () => {
  server = await startTestServer();
  await server.reset();
  account = await seedWorkspaceWithOwner(server.db, {
    workspaceName: 'Seeblick Digital',
    email: 'owner@seeblick.test',
  });
});

afterAll(async () => {
  await server.close();
});

describe('Passwort über die Kommandozeile neu setzen', () => {
  it('ersetzt das alte Passwort und beendet jede Sitzung des Kontos', async () => {
    const before = await login(server, account);

    const result = await resetPassword(server.db, 'Owner@Seeblick.test');

    expect(result.password).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(result.endedSessions).toBe(1);
    await expect((await before.request('/api/v1/auth/me')).json()).resolves.toBeNull();
    await expect(login(server, account)).rejects.toThrow(/401/);
    await expect(login(server, { ...account, password: result.password })).resolves.toBeDefined();
  });

  it('meldet eine unbekannte Adresse, statt still nichts zu tun', async () => {
    await expect(resetPassword(server.db, 'niemand@seeblick.test')).rejects.toThrow(/Kein Konto/);
  });
});
