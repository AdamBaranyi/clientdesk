import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { CreatedInvitation, InvitationPreview, SessionUser } from '@tallyroom/contracts';
import { seedWorkspaceWithOwner } from '../helpers/fixtures.ts';
import { buildScenario, login, post, type Scenario } from '../helpers/scenario.ts';
import { startTestServer, type TestServer } from '../helpers/test-server.ts';

let server: TestServer;
let s: Scenario;

beforeAll(async () => {
  server = await startTestServer();
}, 60_000);

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  await server.reset();
  s = await buildScenario(server);
});

const internal = (path: string) => `/api/v1/workspaces/${s.agency.workspaceId}/${path}`;

function tokenFrom(invitation: CreatedInvitation): string {
  return invitation.inviteUrl.split('/join/')[1] ?? '';
}

async function invite(body: Record<string, unknown>): Promise<CreatedInvitation> {
  return post<CreatedInvitation>(s.team, internal('invitations'), body);
}

describe('Einladungen anlegen', () => {
  it('liefert den Link genau einmal und speichert nur seinen Hash', async () => {
    const invitation = await invite({ email: 'neu@alpenblick.test', role: 'member' });
    expect(invitation.inviteUrl).toContain('/join/');

    // Die spätere Liste kennt den Link nicht mehr.
    const liste = await s.team.json<{ data: Record<string, unknown>[] }>(internal('invitations'));
    expect(liste.data).toHaveLength(1);
    expect(liste.data[0]).not.toHaveProperty('inviteUrl');
    expect(liste.data[0]).not.toHaveProperty('tokenHash');

    const [row] = await server.db
      .execute<{ token_hash: string }>(`SELECT token_hash FROM invitations` as never)
      .then((result) => result.rows);
    expect(row?.token_hash).not.toBe(tokenFrom(invitation));
    expect(row?.token_hash).toHaveLength(64);
  });

  it('verlangt für einen Kundenzugang genau einen Kunden', async () => {
    const csrf = await s.team.csrfToken();
    const ohneKunde = await s.team.request(internal('invitations'), {
      method: 'POST',
      csrf,
      body: JSON.stringify({ email: 'kunde2@seeblick.test', role: 'client' }),
    });
    expect(ohneKunde.status).toBe(422);

    const internMitKunde = await s.team.request(internal('invitations'), {
      method: 'POST',
      csrf,
      body: JSON.stringify({
        email: 'member@alpenblick.test',
        role: 'member',
        customerId: s.clientAccount.customerId,
      }),
    });
    expect(internMitKunde.status).toBe(422);
  });

  it('lässt nur einen Owner einladen', async () => {
    const response = await s.client.request(internal('invitations'));
    expect(response.status).toBe(404);
  });
});

describe('Einladungen annehmen', () => {
  it('legt ein Konto an und aktiviert die Mitgliedschaft', async () => {
    const invitation = await invite({ email: 'neu@alpenblick.test', role: 'member' });
    const token = tokenFrom(invitation);

    const vorschau = await server.client().json<InvitationPreview>(`/api/v1/invitations/${token}`);
    expect(vorschau.workspaceName).toBe('Alpenblick Studio');
    expect(vorschau.accountExists).toBe(false);

    const beitretender = server.client();
    await post(beitretender, `/api/v1/invitations/${token}/accept`, {
      displayName: 'Neues Mitglied',
      password: 'Ein-langes-Passwort-2026',
    });

    // Nach der Annahme ist der Beitretende angemeldet und Mitglied.
    const me = await beitretender.json<SessionUser>('/api/v1/auth/me');
    expect(me.email).toBe('neu@alpenblick.test');
    expect(me.workspaces).toHaveLength(1);
    expect(me.workspaces[0]?.role).toBe('member');
  });

  it('gilt genau einmal', async () => {
    const invitation = await invite({ email: 'neu@alpenblick.test', role: 'member' });
    const token = tokenFrom(invitation);

    await post(server.client(), `/api/v1/invitations/${token}/accept`, {
      password: 'Ein-langes-Passwort-2026',
    });

    const zweiter = server.client();
    const csrf = await zweiter.csrfToken();
    const wiederholung = await zweiter.request(`/api/v1/invitations/${token}/accept`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({ password: 'Ein-anderes-Passwort-2026' }),
    });
    expect(wiederholung.status).toBe(404);
  });

  it('nimmt Rolle und Kundenbezug aus der Einladung, nicht aus dem Request', async () => {
    const invitation = await invite({
      email: 'kunde2@seeblick.test',
      role: 'client',
      customerId: s.clientAccount.customerId,
    });
    const token = tokenFrom(invitation);

    const beitretender = server.client();
    const csrf = await beitretender.csrfToken();
    await beitretender.request(`/api/v1/invitations/${token}/accept`, {
      method: 'POST',
      csrf,
      // Der Versuch, sich selbst zum Owner zu machen und den Kunden zu wechseln.
      body: JSON.stringify({
        password: 'Ein-langes-Passwort-2026',
        role: 'owner',
        customerId: s.otherCustomer.id,
        workspaceId: s.agency.workspaceId,
      }),
    });

    const me = await beitretender.json<SessionUser>('/api/v1/auth/me');
    expect(me.workspaces[0]?.role).toBe('client');
    expect(me.workspaces[0]?.customerId).toBe(s.clientAccount.customerId);
  });

  it('weist eine abgelaufene Einladung ab', async () => {
    const invitation = await invite({ email: 'spaet@alpenblick.test', role: 'member' });
    const token = tokenFrom(invitation);

    await server.db.execute(
      `UPDATE invitations SET expires_at = now() - interval '1 hour'` as never,
    );

    const response = await server.client().request(`/api/v1/invitations/${token}`);
    expect(response.status).toBe(404);
  });

  it('weist ein erfundenes Token ab', async () => {
    const response = await server
      .client()
      .request('/api/v1/invitations/ein-vollstaendig-erfundenes-token-ohne-bedeutung');
    expect(response.status).toBe(404);
  });

  it('verlangt bei bestehendem Konto die passende Anmeldung', async () => {
    const anderes = await seedWorkspaceWithOwner(server.db, {
      workspaceName: 'Nordlicht Architektur',
      email: 'bestehend@example.test',
    });

    const invitation = await invite({ email: 'bestehend@example.test', role: 'member' });
    const token = tokenFrom(invitation);

    // Ohne Anmeldung: abgelehnt, sonst könnte ein fremder Link ein bestehendes
    // Konto in einen Workspace ziehen.
    const anonym = server.client();
    const csrf = await anonym.csrfToken();
    const ohneAnmeldung = await anonym.request(`/api/v1/invitations/${token}/accept`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({ password: 'Ein-langes-Passwort-2026' }),
    });
    expect(ohneAnmeldung.status).toBe(403);

    // Angemeldet als genau dieses Konto: angenommen.
    const angemeldet = await login(server, anderes);
    await post(angemeldet, `/api/v1/invitations/${token}/accept`, {
      password: 'wird-nicht-verwendet-aber-verlangt',
    });

    const me = await angemeldet.json<SessionUser>('/api/v1/auth/me');
    expect(me.workspaces.map((entry) => entry.name).sort()).toEqual([
      'Alpenblick Studio',
      'Nordlicht Architektur',
    ]);
  });
});
