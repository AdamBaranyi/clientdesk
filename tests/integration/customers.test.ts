import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { ArchiveBlockers, Customer, ListResponse } from '@tallyroom/contracts';
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
  body: Record<string, unknown>,
): Promise<Customer> {
  const csrf = await client.csrfToken();
  const response = await client.request(`/api/v1/workspaces/${workspaceId}/customers`, {
    method: 'POST',
    csrf,
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(201);
  return (await response.json()) as Customer;
}

describe('Kunden anlegen und lesen', () => {
  it('legt einen Kunden an und findet ihn danach wieder', async () => {
    const client = await login(alpen);
    const created = await createCustomer(client, alpen.workspaceId, {
      name: 'Seeblick Digital',
      email: 'kontakt@seeblick.test',
      internalNote: 'Zahlt zuverlässig',
    });

    // Zweiter Abruf gegen die Datenbank, nicht gegen die Antwort von eben.
    const fetched = await client.json<Customer>(
      `/api/v1/workspaces/${alpen.workspaceId}/customers/${created.id}`,
    );
    expect(fetched.name).toBe('Seeblick Digital');
    expect(fetched.internalNote).toBe('Zahlt zuverlässig');
    expect(fetched.version).toBe(1);
  });

  it('verlangt einen Namen', async () => {
    const client = await login(alpen);
    const csrf = await client.csrfToken();
    const response = await client.request(`/api/v1/workspaces/${alpen.workspaceId}/customers`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({ name: '   ' }),
    });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'VALIDATION_FAILED' },
    });
  });

  it('macht aus leeren Formularfeldern null statt leerer Zeichenketten', async () => {
    const client = await login(alpen);
    const created = await createCustomer(client, alpen.workspaceId, {
      name: 'Talgarten Treuhand',
      phone: '',
      website: '',
    });
    expect(created.phone).toBeNull();
    expect(created.website).toBeNull();
  });

  it('findet Kunden über die Suche', async () => {
    const client = await login(alpen);
    await createCustomer(client, alpen.workspaceId, { name: 'Seeblick Digital' });
    await createCustomer(client, alpen.workspaceId, { name: 'Talgarten Treuhand' });

    const body = await client.json<ListResponse<Customer>>(
      `/api/v1/workspaces/${alpen.workspaceId}/customers?search=Seeblick`,
    );
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.name).toBe('Seeblick Digital');
    expect(body.pagination.totalItems).toBe(1);
  });
});

describe('Zähler in der Kundenliste', () => {
  /**
   * Der Zähler kam aus einer korrelierten Unterabfrage. In einem rohen
   * sql-Template rendert Drizzle Spalten unqualifiziert — `customer_id = id`
   * band beide Namen an dieselbe innere Tabelle und lieferte still überall
   * null. Dieser Test hält fest, dass gezählt wird, was tatsächlich da ist.
   */
  it('zählt die laufenden Projekte je Kunde', async () => {
    const client = await login(alpen);
    const mitProjekten = await createCustomer(client, alpen.workspaceId, { name: 'Mit Projekten' });
    const ohneProjekte = await createCustomer(client, alpen.workspaceId, { name: 'Ohne Projekte' });

    const csrf = await client.csrfToken();
    for (const name of ['Erstes Projekt', 'Zweites Projekt']) {
      const created = await client.request(`/api/v1/workspaces/${alpen.workspaceId}/projects`, {
        method: 'POST',
        csrf,
        body: JSON.stringify({ customerId: mitProjekten.id, name, startDate: '2026-01-15' }),
      });
      const project = (await created.json()) as { id: string; version: number };
      // Erst der Status active zählt als laufend.
      await client.request(`/api/v1/workspaces/${alpen.workspaceId}/projects/${project.id}`, {
        method: 'PATCH',
        csrf,
        body: JSON.stringify({ status: 'active', version: project.version }),
      });
    }

    const list = await client.json<ListResponse<Customer>>(
      `/api/v1/workspaces/${alpen.workspaceId}/customers`,
    );
    const counts = new Map(list.data.map((entry) => [entry.name, entry.activeProjectCount]));

    expect(counts.get('Mit Projekten')).toBe(2);
    expect(counts.get('Ohne Projekte')).toBe(0);

    const detail = await client.json<Customer>(
      `/api/v1/workspaces/${alpen.workspaceId}/customers/${mitProjekten.id}`,
    );
    expect(detail.activeProjectCount).toBe(2);
    expect(ohneProjekte.activeProjectCount).toBe(0);
  });
});

describe('Kunden über Mandantengrenzen', () => {
  it('zeigt einen fremden Kunden nicht, auch nicht mit der richtigen ID', async () => {
    const nordlichtClient = await login(nordlicht);
    const fremd = await createCustomer(nordlichtClient, nordlicht.workspaceId, {
      name: 'Geheimkunde',
    });

    const alpenClient = await login(alpen);
    const response = await alpenClient.request(
      `/api/v1/workspaces/${alpen.workspaceId}/customers/${fremd.id}`,
    );
    expect(response.status).toBe(404);
  });

  it('lässt einen Kunden nicht über den fremden Workspace-Pfad lesen', async () => {
    const nordlichtClient = await login(nordlicht);
    const fremd = await createCustomer(nordlichtClient, nordlicht.workspaceId, {
      name: 'Geheimkunde',
    });

    const alpenClient = await login(alpen);
    const response = await alpenClient.request(
      `/api/v1/workspaces/${nordlicht.workspaceId}/customers/${fremd.id}`,
    );
    // Schon der Workspace ist für dieses Konto unbekannt.
    expect(response.status).toBe(404);
  });

  it('verweigert einem Kundenbenutzer den internen Kundenbereich', async () => {
    const clientAccount = await seedClientUser(server.db, {
      workspaceId: alpen.workspaceId,
      customerName: 'Seeblick Digital',
      email: 'kunde@seeblick.test',
    });

    const clientSession = await login(clientAccount);
    const response = await clientSession.request(
      `/api/v1/workspaces/${alpen.workspaceId}/customers`,
    );
    // 404 statt 403: für einen Client existiert dieser Bereich nicht.
    expect(response.status).toBe(404);
  });
});

describe('Gleichzeitige Änderungen', () => {
  it('weist die zweite Änderung mit veralteter Version ab', async () => {
    const client = await login(alpen);
    const created = await createCustomer(client, alpen.workspaceId, { name: 'Seeblick Digital' });
    const csrf = await client.csrfToken();
    const url = `/api/v1/workspaces/${alpen.workspaceId}/customers/${created.id}`;

    const first = await client.request(url, {
      method: 'PATCH',
      csrf,
      body: JSON.stringify({ name: 'Seeblick Digital AG', version: created.version }),
    });
    expect(first.status).toBe(200);

    const second = await client.request(url, {
      method: 'PATCH',
      csrf,
      body: JSON.stringify({ name: 'Seeblick GmbH', version: created.version }),
    });
    expect(second.status).toBe(409);
    await expect(second.json()).resolves.toMatchObject({
      error: { code: 'VERSION_CONFLICT' },
    });

    // Die erste Änderung bleibt bestehen, die zweite hat nichts überschrieben.
    const current = await client.json<Customer>(url);
    expect(current.name).toBe('Seeblick Digital AG');
    expect(current.version).toBe(2);
  });
});

describe('Archivieren', () => {
  it('archiviert einen Kunden ohne laufende Arbeit', async () => {
    const client = await login(alpen);
    const created = await createCustomer(client, alpen.workspaceId, { name: 'Ruhender Kunde' });
    const csrf = await client.csrfToken();

    const response = await client.request(
      `/api/v1/workspaces/${alpen.workspaceId}/customers/${created.id}/archive`,
      { method: 'POST', csrf },
    );
    expect(response.status).toBe(200);
    expect(((await response.json()) as Customer).archivedAt).not.toBeNull();
  });

  it('nennt die Gründe, wenn ein laufendes Projekt entgegensteht', async () => {
    const client = await login(alpen);
    const customer = await createCustomer(client, alpen.workspaceId, { name: 'Seeblick Digital' });
    const csrf = await client.csrfToken();

    await client.request(`/api/v1/workspaces/${alpen.workspaceId}/projects`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({
        customerId: customer.id,
        name: 'Onlineshop',
        startDate: '2026-01-15',
      }),
    });

    const blockers = await client.json<ArchiveBlockers>(
      `/api/v1/workspaces/${alpen.workspaceId}/customers/${customer.id}/archive-blockers`,
    );
    expect(blockers.runningProjects).toBe(1);

    const response = await client.request(
      `/api/v1/workspaces/${alpen.workspaceId}/customers/${customer.id}/archive`,
      { method: 'POST', csrf },
    );
    expect(response.status).toBe(422);
  });

  it('holt einen archivierten Kunden zurück', async () => {
    const client = await login(alpen);
    const created = await createCustomer(client, alpen.workspaceId, { name: 'Ruhender Kunde' });
    const csrf = await client.csrfToken();
    const base = `/api/v1/workspaces/${alpen.workspaceId}/customers/${created.id}`;

    await client.request(`${base}/archive`, { method: 'POST', csrf });
    const restored = await client.request(`${base}/restore`, { method: 'POST', csrf });

    expect(restored.status).toBe(200);
    expect(((await restored.json()) as Customer).archivedAt).toBeNull();
  });

  it('blendet archivierte Kunden aus der Standardliste aus, zeigt sie aber auf Wunsch', async () => {
    const client = await login(alpen);
    const created = await createCustomer(client, alpen.workspaceId, { name: 'Ruhender Kunde' });
    const csrf = await client.csrfToken();
    await client.request(
      `/api/v1/workspaces/${alpen.workspaceId}/customers/${created.id}/archive`,
      { method: 'POST', csrf },
    );

    const aktiv = await client.json<ListResponse<Customer>>(
      `/api/v1/workspaces/${alpen.workspaceId}/customers`,
    );
    const archiviert = await client.json<ListResponse<Customer>>(
      `/api/v1/workspaces/${alpen.workspaceId}/customers?status=archived`,
    );

    expect(aktiv.data).toHaveLength(0);
    expect(archiviert.data).toHaveLength(1);
  });
});
