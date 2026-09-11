import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { ClientRequest, ListResponse, ServiceRequest } from '@tallyroom/contracts';
import { buildScenario, post, type Scenario } from '../helpers/scenario.ts';
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
const portal = (path: string) => `/api/v1/portal/${s.agency.workspaceId}/${path}`;

describe('Idempotenz beim Erstellen', () => {
  const body = {
    customerId: '',
    subject: 'Doppelklick',
    body: 'Einmal genügt.',
  };

  it('erzeugt bei gleichem Schlüssel und gleichem Inhalt nur eine Anfrage', async () => {
    const payload = { ...body, customerId: s.clientAccount.customerId };
    const csrf = await s.team.csrfToken();

    const senden = () =>
      s.team.request(internal('requests'), {
        method: 'POST',
        csrf,
        headers: { 'idempotency-key': 'doppelklick-schluessel-1' },
        body: JSON.stringify(payload),
      });

    const erste = await senden();
    const zweite = await senden();
    expect(erste.status).toBe(201);
    expect(zweite.status).toBe(201);

    const a = (await erste.json()) as ServiceRequest;
    const b = (await zweite.json()) as ServiceRequest;
    expect(b.id).toBe(a.id);

    const liste = await s.team.json<ListResponse<ServiceRequest>>(
      internal('requests?search=Doppelklick'),
    );
    expect(liste.pagination.totalItems).toBe(1);
  });

  it('meldet einen Konflikt, wenn derselbe Schlüssel mit anderem Inhalt kommt', async () => {
    const csrf = await s.team.csrfToken();
    const erste = await s.team.request(internal('requests'), {
      method: 'POST',
      csrf,
      headers: { 'idempotency-key': 'gleicher-schluessel-2' },
      body: JSON.stringify({ ...body, customerId: s.clientAccount.customerId }),
    });
    expect(erste.status).toBe(201);

    const zweite = await s.team.request(internal('requests'), {
      method: 'POST',
      csrf,
      headers: { 'idempotency-key': 'gleicher-schluessel-2' },
      body: JSON.stringify({
        ...body,
        customerId: s.clientAccount.customerId,
        subject: 'Etwas anderes',
      }),
    });

    // Kein Wiederholungsversuch, sondern ein Widerspruch.
    expect(zweite.status).toBe(409);
    await expect(zweite.json()).resolves.toMatchObject({
      error: { code: 'IDEMPOTENCY_CONFLICT' },
    });
  });

  it('gilt auch im Kundenportal', async () => {
    const csrf = await s.client.csrfToken();
    const senden = () =>
      s.client.request(portal('requests'), {
        method: 'POST',
        csrf,
        headers: { 'idempotency-key': 'kunden-doppelklick-3' },
        body: JSON.stringify({ subject: 'Kundenanfrage', body: 'Bitte prüfen.' }),
      });

    const a = (await (await senden()).json()) as ClientRequest;
    const b = (await (await senden()).json()) as ClientRequest;
    expect(b.id).toBe(a.id);

    const liste = await s.client.json<{ data: ClientRequest[] }>(portal('requests'));
    expect(liste.data.filter((entry) => entry.subject === 'Kundenanfrage')).toHaveLength(1);
  });
});

describe('Statusfolge', () => {
  async function anfrage(): Promise<ServiceRequest> {
    return post<ServiceRequest>(s.team, internal('requests'), {
      customerId: s.clientAccount.customerId,
      subject: 'Ablauf',
      body: 'Text.',
    });
  }

  it('führt die vorgesehenen Übergänge aus', async () => {
    let current = await anfrage();
    expect(current.status).toBe('open');

    for (const status of ['in_progress', 'waiting_customer', 'resolved'] as const) {
      current = await post<ServiceRequest>(
        s.team,
        internal(`requests/${current.id}/status`),
        { status, version: current.version },
        200,
      );
      expect(current.status).toBe(status);
    }
  });

  it('erlaubt das erneute Öffnen einer erledigten Anfrage', async () => {
    let current = await anfrage();
    current = await post<ServiceRequest>(
      s.team,
      internal(`requests/${current.id}/status`),
      { status: 'resolved', version: current.version },
      200,
    );
    const wieder = await post<ServiceRequest>(
      s.team,
      internal(`requests/${current.id}/status`),
      { status: 'open', version: current.version },
      200,
    );
    expect(wieder.status).toBe('open');
  });

  it('weist eine veraltete Version ab', async () => {
    const current = await anfrage();
    await post<ServiceRequest>(
      s.team,
      internal(`requests/${current.id}/status`),
      { status: 'in_progress', version: current.version },
      200,
    );

    const csrf = await s.team.csrfToken();
    const zweite = await s.team.request(internal(`requests/${current.id}/status`), {
      method: 'POST',
      csrf,
      body: JSON.stringify({ status: 'resolved', version: current.version }),
    });
    expect(zweite.status).toBe(409);
  });
});

describe('Zuordnung von Projekten', () => {
  it('weist ein Projekt ab, das nicht zum Kunden der Anfrage gehört', async () => {
    const csrf = await s.team.csrfToken();
    const response = await s.team.request(internal('requests'), {
      method: 'POST',
      csrf,
      body: JSON.stringify({
        customerId: s.otherCustomer.id,
        projectId: s.visibleProject.id,
        subject: 'Falsch zugeordnet',
        body: 'Text.',
      }),
    });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: { fieldErrors: { projectId: ['Projekt passt nicht zum Kunden'] } },
    });
  });

  it('lässt einen Kunden kein nicht freigegebenes Projekt wählen', async () => {
    const csrf = await s.client.csrfToken();
    const response = await s.client.request(portal('requests'), {
      method: 'POST',
      csrf,
      body: JSON.stringify({
        projectId: s.hiddenProject.id,
        subject: 'Versuch',
        body: 'Text.',
      }),
    });
    expect(response.status).toBe(422);
  });

  it('bietet dem Kunden nur freigegebene Projekte zur Auswahl an', async () => {
    const body = await s.client.json<{ data: { id: string; name: string }[] }>(
      portal('requests/assignable-projects'),
    );
    expect(body.data.map((entry) => entry.name)).toEqual(['Freigegebenes Projekt']);
  });
});
