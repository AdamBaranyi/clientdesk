import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Customer, SearchResult } from '@tallyroom/contracts';
import {
  seedClientUser,
  seedWorkspaceWithOwner,
  type SeededWorkspace,
} from '../helpers/fixtures.ts';
import { startTestServer, type TestClient, type TestServer } from '../helpers/test-server.ts';

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

async function login(account: SeededWorkspace): Promise<TestClient> {
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

async function createCustomer(
  client: TestClient,
  workspaceId: string,
  name: string,
  extra: Record<string, unknown> = {},
): Promise<Customer> {
  const csrf = await client.csrfToken();
  const response = await client.request(`/api/v1/workspaces/${workspaceId}/customers`, {
    method: 'POST',
    csrf,
    body: JSON.stringify({ name, ...extra }),
  });
  expect(response.status).toBe(201);
  return (await response.json()) as Customer;
}

async function createProject(
  client: TestClient,
  workspaceId: string,
  customerId: string,
  name: string,
): Promise<void> {
  const csrf = await client.csrfToken();
  const response = await client.request(`/api/v1/workspaces/${workspaceId}/projects`, {
    method: 'POST',
    csrf,
    body: JSON.stringify({ customerId, name, startDate: '2026-01-15' }),
  });
  expect(response.status).toBe(201);
}

function search(client: TestClient, workspaceId: string, term: string) {
  return client.request(`/api/v1/workspaces/${workspaceId}/search?q=${encodeURIComponent(term)}`);
}

describe('Gebündelte Suche', () => {
  it('findet Kunden über Name, Kontakt und E-Mail', async () => {
    const client = await login(alpen);
    await createCustomer(client, alpen.workspaceId, 'Seeblick Digital', {
      contactName: 'Marina Hug',
      email: 'marina@seeblick.test',
    });

    for (const term of ['Seeblick', 'Marina', 'seeblick.test']) {
      const result = await client.json<SearchResult>(
        `/api/v1/workspaces/${alpen.workspaceId}/search?q=${encodeURIComponent(term)}`,
      );
      expect(result.hits.map((hit) => hit.title)).toContain('Seeblick Digital');
    }
  });

  it('liefert die Art mit, damit die Palette weiss, wohin sie springt', async () => {
    const client = await login(alpen);
    const customer = await createCustomer(client, alpen.workspaceId, 'Talgarten Treuhand');
    await createProject(client, alpen.workspaceId, customer.id, 'Talgarten Onlineshop');

    const result = await client.json<SearchResult>(
      `/api/v1/workspaces/${alpen.workspaceId}/search?q=Talgarten`,
    );
    const arten = result.hits.map((hit) => hit.kind);
    expect(arten).toContain('customer');
    expect(arten).toContain('project');

    const projekt = result.hits.find((hit) => hit.kind === 'project');
    // Die zweite Zeile nennt den Kunden — sonst sind zwei gleichnamige
    // Projekte im Ergebnis nicht auseinanderzuhalten.
    expect(projekt?.subtitle).toBe('Talgarten Treuhand');
  });

  it('zeigt nichts aus einem fremden Workspace', async () => {
    const fremd = await login(nordlicht);
    await createCustomer(fremd, nordlicht.workspaceId, 'Geheimkunde Nordlicht');

    const eigen = await login(alpen);
    const result = await eigen.json<SearchResult>(
      `/api/v1/workspaces/${alpen.workspaceId}/search?q=Geheimkunde`,
    );
    expect(result.hits).toHaveLength(0);
  });

  it('weist den fremden Workspace mit 404 ab, nicht mit 403', async () => {
    const client = await login(alpen);
    const response = await search(client, nordlicht.workspaceId, 'Nordlicht');
    // 403 würde verraten, dass es diesen Workspace gibt.
    expect(response.status).toBe(404);
  });

  it('lässt einen Kundenzugang nicht an die interne Suche', async () => {
    const kunde = await seedClientUser(server.db, {
      workspaceId: alpen.workspaceId,
      customerName: 'Uferpark Gastro',
      email: 'kunde@uferpark.test',
    });

    const client = server.client();
    const csrf = await client.csrfToken();
    await client.request('/api/v1/auth/login', {
      method: 'POST',
      csrf,
      body: JSON.stringify({ email: kunde.email, password: kunde.password }),
    });

    const response = await search(client, alpen.workspaceId, 'Uferpark');
    expect(response.status).toBe(404);
  });

  it('verlangt eine Anmeldung', async () => {
    const response = await search(server.client(), alpen.workspaceId, 'egal');
    expect(response.status).toBe(401);
  });

  it('weist einen einzelnen Buchstaben ab, statt den Bestand auszuliefern', async () => {
    const client = await login(alpen);
    const response = await search(client, alpen.workspaceId, 'a');
    // Das Haus antwortet auf ungültige Eingaben mit 422, nicht mit 400.
    expect(response.status).toBe(422);
  });

  it('behandelt Prozentzeichen als Text und nicht als Platzhalter', async () => {
    const client = await login(alpen);
    await createCustomer(client, alpen.workspaceId, 'Rebberg Weinhandel');

    // Ohne Entschärfung findet „%%" als ILIKE-Muster jeden Datensatz. Das
    // ist kein Einschleusen von SQL — der Begriff wird gebunden — aber es
    // liefert dem Nutzer den ganzen Bestand statt einer Suche.
    const result = await client.json<SearchResult>(
      `/api/v1/workspaces/${alpen.workspaceId}/search?q=${encodeURIComponent('%%')}`,
    );
    expect(result.hits).toHaveLength(0);
  });
});
