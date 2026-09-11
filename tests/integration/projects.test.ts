import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Customer, Milestone, Project } from '@tallyroom/contracts';
import { seedWorkspaceWithOwner, type SeededWorkspace } from '../helpers/fixtures.ts';
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
  await client.request('/api/v1/auth/login', {
    method: 'POST',
    csrf,
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  return client;
}

async function post<T>(
  client: TestClient,
  path: string,
  body: Record<string, unknown>,
  expected = 201,
): Promise<T> {
  const csrf = await client.csrfToken();
  const response = await client.request(path, { method: 'POST', csrf, body: JSON.stringify(body) });
  expect(response.status).toBe(expected);
  return (await response.json()) as T;
}

async function setup(client: TestClient, workspaceId: string) {
  const customer = await post<Customer>(client, `/api/v1/workspaces/${workspaceId}/customers`, {
    name: 'Seeblick Digital',
  });
  const project = await post<Project>(client, `/api/v1/workspaces/${workspaceId}/projects`, {
    customerId: customer.id,
    name: 'Onlineshop',
    startDate: '2026-01-15',
  });
  return { customer, project };
}

/** Kalenderdatum in der Workspace-Zeitzone, relativ zu heute. */
function dateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

describe('Projekt einem Kunden zuordnen', () => {
  it('legt ein Projekt an und behält die Zuordnung nach erneutem Laden', async () => {
    const client = await login(alpen);
    const { customer, project } = await setup(client, alpen.workspaceId);

    const fetched = await client.json<Project>(
      `/api/v1/workspaces/${alpen.workspaceId}/projects/${project.id}`,
    );
    expect(fetched.customerId).toBe(customer.id);
    expect(fetched.customerName).toBe('Seeblick Digital');
    expect(fetched.status).toBe('planned');
  });

  it('weist einen Kunden aus einem fremden Workspace ab', async () => {
    const nordlichtClient = await login(nordlicht);
    const fremd = await post<Customer>(
      nordlichtClient,
      `/api/v1/workspaces/${nordlicht.workspaceId}/customers`,
      { name: 'Fremdkunde' },
    );

    const alpenClient = await login(alpen);
    const csrf = await alpenClient.csrfToken();
    const response = await alpenClient.request(`/api/v1/workspaces/${alpen.workspaceId}/projects`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({
        customerId: fremd.id,
        name: 'Untergeschobenes Projekt',
        startDate: '2026-01-15',
      }),
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'VALIDATION_FAILED', fieldErrors: { customerId: ['Unbekannter Kunde'] } },
    });
  });

  it('lässt kein Projekt für einen archivierten Kunden entstehen', async () => {
    const client = await login(alpen);
    const customer = await post<Customer>(
      client,
      `/api/v1/workspaces/${alpen.workspaceId}/customers`,
      { name: 'Ruhender Kunde' },
    );
    const csrf = await client.csrfToken();
    await client.request(
      `/api/v1/workspaces/${alpen.workspaceId}/customers/${customer.id}/archive`,
      { method: 'POST', csrf },
    );

    const response = await client.request(`/api/v1/workspaces/${alpen.workspaceId}/projects`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({ customerId: customer.id, name: 'Zu spät', startDate: '2026-01-15' }),
    });
    expect(response.status).toBe(422);
  });

  it('weist einen Zieltermin vor dem Start ab', async () => {
    const client = await login(alpen);
    const customer = await post<Customer>(
      client,
      `/api/v1/workspaces/${alpen.workspaceId}/customers`,
      { name: 'Seeblick Digital' },
    );
    const csrf = await client.csrfToken();
    const response = await client.request(`/api/v1/workspaces/${alpen.workspaceId}/projects`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({
        customerId: customer.id,
        name: 'Rückwärts',
        startDate: '2026-06-01',
        targetDate: '2026-05-01',
      }),
    });
    expect(response.status).toBe(422);
  });
});

describe('Fortschritt aus Meilensteinen', () => {
  it('meldet keinen Fortschritt, solange es keine Meilensteine gibt', async () => {
    const client = await login(alpen);
    const { project } = await setup(client, alpen.workspaceId);
    // Nicht 100 Prozent, sondern gar kein Wert.
    expect(project.progress).toBeNull();
    expect(project.milestoneCount).toBe(0);
  });

  it('rechnet erledigte durch alle Meilensteine', async () => {
    const client = await login(alpen);
    const { project } = await setup(client, alpen.workspaceId);
    const base = `/api/v1/workspaces/${alpen.workspaceId}/projects`;

    await post<{ data: Milestone[] }>(client, `${base}/${project.id}/milestones`, {
      title: 'Entwurf freigeben',
    });
    const zweite = await post<{ data: Milestone[] }>(client, `${base}/${project.id}/milestones`, {
      title: 'Zahlungsanbindung',
    });

    const ersterMeilenstein = zweite.data[0];
    expect(ersterMeilenstein).toBeDefined();

    const csrf = await client.csrfToken();
    const response = await client.request(`${base}/milestones/${ersterMeilenstein?.id}`, {
      method: 'PATCH',
      csrf,
      body: JSON.stringify({ status: 'done' }),
    });
    expect(response.status).toBe(200);

    const updated = await client.json<Project>(`${base}/${project.id}`);
    expect(updated.milestoneCount).toBe(2);
    expect(updated.milestonesDone).toBe(1);
    expect(updated.progress).toBe(0.5);
  });

  it('erkennt einen überfälligen Meilenstein', async () => {
    const client = await login(alpen);
    const { project } = await setup(client, alpen.workspaceId);
    const base = `/api/v1/workspaces/${alpen.workspaceId}/projects`;

    const result = await post<{ data: Milestone[] }>(client, `${base}/${project.id}/milestones`, {
      title: 'Längst fällig',
      dueDate: dateOffset(-3),
    });
    expect(result.data[0]?.overdue).toBe(true);

    const kuenftig = await post<{ data: Milestone[] }>(client, `${base}/${project.id}/milestones`, {
      title: 'Kommt noch',
      dueDate: dateOffset(5),
    });
    expect(kuenftig.data.find((m) => m.title === 'Kommt noch')?.overdue).toBe(false);

    const withOverdue = await client.json<Project>(`${base}/${project.id}`);
    expect(withOverdue.overdueMilestones).toBe(1);
  });

  it('wertet einen erledigten Meilenstein nicht mehr als überfällig', async () => {
    const client = await login(alpen);
    const { project } = await setup(client, alpen.workspaceId);
    const base = `/api/v1/workspaces/${alpen.workspaceId}/projects`;

    const created = await post<{ data: Milestone[] }>(client, `${base}/${project.id}/milestones`, {
      title: 'Längst fällig',
      dueDate: dateOffset(-3),
    });
    const csrf = await client.csrfToken();
    await client.request(`${base}/milestones/${created.data[0]?.id}`, {
      method: 'PATCH',
      csrf,
      body: JSON.stringify({ status: 'done' }),
    });

    const updated = await client.json<Project>(`${base}/${project.id}`);
    expect(updated.overdueMilestones).toBe(0);
  });
});

describe('Projekt abschliessen', () => {
  it('verlangt eine Begründung, solange Meilensteine offen sind', async () => {
    const client = await login(alpen);
    const { project } = await setup(client, alpen.workspaceId);
    const base = `/api/v1/workspaces/${alpen.workspaceId}/projects`;
    await post<{ data: Milestone[] }>(client, `${base}/${project.id}/milestones`, {
      title: 'Noch offen',
    });

    const csrf = await client.csrfToken();
    const ohne = await client.request(`${base}/${project.id}`, {
      method: 'PATCH',
      csrf,
      body: JSON.stringify({ status: 'completed', version: project.version }),
    });
    expect(ohne.status).toBe(422);

    const mit = await client.request(`${base}/${project.id}`, {
      method: 'PATCH',
      csrf,
      body: JSON.stringify({
        status: 'completed',
        completionReason: 'Der Kunde übernimmt den Rest selbst.',
        version: project.version,
      }),
    });
    expect(mit.status).toBe(200);
    expect(((await mit.json()) as Project).status).toBe('completed');
  });

  it('schliesst ohne Begründung ab, wenn alle Meilensteine erledigt sind', async () => {
    const client = await login(alpen);
    const { project } = await setup(client, alpen.workspaceId);
    const base = `/api/v1/workspaces/${alpen.workspaceId}/projects`;

    const created = await post<{ data: Milestone[] }>(client, `${base}/${project.id}/milestones`, {
      title: 'Einziger Schritt',
    });
    const csrf = await client.csrfToken();
    await client.request(`${base}/milestones/${created.data[0]?.id}`, {
      method: 'PATCH',
      csrf,
      body: JSON.stringify({ status: 'done' }),
    });

    const response = await client.request(`${base}/${project.id}`, {
      method: 'PATCH',
      csrf,
      body: JSON.stringify({ status: 'completed', version: project.version }),
    });
    expect(response.status).toBe(200);
  });

  it('weist eine veraltete Projektversion ab', async () => {
    const client = await login(alpen);
    const { project } = await setup(client, alpen.workspaceId);
    const url = `/api/v1/workspaces/${alpen.workspaceId}/projects/${project.id}`;
    const csrf = await client.csrfToken();

    await client.request(url, {
      method: 'PATCH',
      csrf,
      body: JSON.stringify({ name: 'Onlineshop 2026', version: project.version }),
    });
    const zweite = await client.request(url, {
      method: 'PATCH',
      csrf,
      body: JSON.stringify({ name: 'Anders', version: project.version }),
    });

    expect(zweite.status).toBe(409);
  });
});
