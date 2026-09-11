import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { Customer, DemoStatus, ListResponse } from '@tallyroom/contracts';
import { DEMO_LIMITS } from '@tallyroom/contracts';
import { cleanupExpiredDemos } from '../../apps/api/src/modules/demo/cleanup.ts';
import { createDemoRepository } from '../../apps/api/src/modules/demo/repository.ts';
import { startTestServer, type TestClient, type TestServer } from '../helpers/test-server.ts';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
}, 60_000);

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  await server.reset();
});

interface StartedDemo {
  client: TestClient;
  workspaceId: string;
}

async function startDemo(): Promise<StartedDemo> {
  const client = server.client();
  const csrf = await client.csrfToken();
  const response = await client.request('/api/v1/demo/sessions', { method: 'POST', csrf });
  expect(response.status).toBe(201);
  const body = (await response.json()) as { workspaceId: string };
  return { client, workspaceId: body.workspaceId };
}

const api = (demo: StartedDemo, path: string) => `/api/v1/workspaces/${demo.workspaceId}/${path}`;

describe('Demo starten', () => {
  it('legt einen eigenen Workspace mit vollständigen Vorführdaten an', async () => {
    const demo = await startDemo();

    const kunden = await demo.client.json<ListResponse<Customer>>(api(demo, 'customers'));
    expect(kunden.pagination.totalItems).toBe(8);

    const status = await demo.client.json<DemoStatus>(`/api/v1/demo/${demo.workspaceId}/status`);
    expect(status.isDemo).toBe(true);
    expect(status.minutesLeft).toBeGreaterThan(50);
    // Drei interne Identitäten und zwei Kundenzugänge.
    expect(status.identities).toHaveLength(5);
    expect(status.identities.filter((entry) => entry.role === 'client')).toHaveLength(2);
  }, 30_000);

  it('gibt jedem Besucher eine eigene Datenkopie', async () => {
    const ersteDemo = await startDemo();
    const zweiteDemo = await startDemo();

    expect(ersteDemo.workspaceId).not.toBe(zweiteDemo.workspaceId);

    const csrf = await ersteDemo.client.csrfToken();
    await ersteDemo.client.request(api(ersteDemo, 'customers'), {
      method: 'POST',
      csrf,
      body: JSON.stringify({ name: 'Nur in der ersten Demo' }),
    });

    const zweite = await zweiteDemo.client.json<ListResponse<Customer>>(
      api(zweiteDemo, 'customers'),
    );
    // Keine gemeinsam beschreibbare Demo: die zweite sieht davon nichts.
    expect(zweite.data.some((entry) => entry.name === 'Nur in der ersten Demo')).toBe(false);
    expect(zweite.pagination.totalItems).toBe(8);

    // Und die erste Demo kommt nicht an den Workspace der zweiten heran.
    const fremd = await ersteDemo.client.request(
      `/api/v1/workspaces/${zweiteDemo.workspaceId}/customers`,
    );
    expect(fremd.status).toBe(404);
  }, 40_000);

  it('existiert nicht, wenn die Demo abgeschaltet ist', async () => {
    const abgeschaltet = await startTestServer({ demoEnabled: false });
    try {
      const client = abgeschaltet.client();
      const csrf = await client.csrfToken();
      const response = await client.request('/api/v1/demo/sessions', { method: 'POST', csrf });
      expect(response.status).toBe(404);
    } finally {
      await abgeschaltet.close();
    }
  }, 30_000);
});

describe('Rollenwechsel', () => {
  it('wechselt innerhalb der eigenen Demo auf die Kundenansicht', async () => {
    const demo = await startDemo();
    const status = await demo.client.json<DemoStatus>(`/api/v1/demo/${demo.workspaceId}/status`);
    const kundenzugang = status.identities.find((entry) => entry.role === 'client');
    expect(kundenzugang).toBeDefined();

    const csrf = await demo.client.csrfToken();
    const response = await demo.client.request(`/api/v1/demo/${demo.workspaceId}/switch`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({ userId: kundenzugang?.userId }),
    });
    expect(response.status).toBe(200);

    // Der Berechtigungskontext ist ein anderer: der interne Bereich ist weg,
    // das Portal offen.
    const intern = await demo.client.request(api(demo, 'customers'));
    expect(intern.status).toBe(404);

    const portal = await demo.client.request(`/api/v1/portal/${demo.workspaceId}/overview`);
    expect(portal.status).toBe(200);
  }, 30_000);

  it('erneuert beim Wechsel die Sitzungs-ID', async () => {
    const demo = await startDemo();
    const status = await demo.client.json<DemoStatus>(`/api/v1/demo/${demo.workspaceId}/status`);
    const ziel = status.identities.find((entry) => entry.role === 'member');

    const vorher = demo.client.cookieHeader();
    const csrf = await demo.client.csrfToken();
    await demo.client.request(`/api/v1/demo/${demo.workspaceId}/switch`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({ userId: ziel?.userId }),
    });

    expect(demo.client.cookieHeader()).not.toBe(vorher);
  }, 30_000);

  it('lässt keinen Wechsel in eine fremde Demo zu', async () => {
    const ersteDemo = await startDemo();
    const zweiteDemo = await startDemo();

    const fremderStatus = await zweiteDemo.client.json<DemoStatus>(
      `/api/v1/demo/${zweiteDemo.workspaceId}/status`,
    );
    const fremdeIdentitaet = fremderStatus.identities[0];

    const csrf = await ersteDemo.client.csrfToken();

    // Weder über den eigenen Workspace-Pfad …
    const ueberEigenen = await ersteDemo.client.request(
      `/api/v1/demo/${ersteDemo.workspaceId}/switch`,
      { method: 'POST', csrf, body: JSON.stringify({ userId: fremdeIdentitaet?.userId }) },
    );
    expect(ueberEigenen.status).toBe(403);

    // … noch über den fremden.
    const ueberFremden = await ersteDemo.client.request(
      `/api/v1/demo/${zweiteDemo.workspaceId}/switch`,
      { method: 'POST', csrf, body: JSON.stringify({ userId: fremdeIdentitaet?.userId }) },
    );
    expect(ueberFremden.status).toBe(404);
  }, 40_000);

  it('bietet für einen gewöhnlichen Workspace keinen Wechsel an', async () => {
    const demo = await startDemo();
    // Aus der Demo einen gewöhnlichen Workspace machen.
    await server.db.execute(
      sql`UPDATE workspaces SET is_demo = false, expires_at = NULL WHERE id = ${demo.workspaceId}::uuid`,
    );

    const csrf = await demo.client.csrfToken();
    const response = await demo.client.request(`/api/v1/demo/${demo.workspaceId}/switch`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({ userId: '00000000-0000-4000-8000-000000000000' }),
    });
    // Kein frei wählbarer Impersonation-Endpunkt für normale Konten.
    expect(response.status).toBe(404);
  }, 30_000);
});

describe('Dateien in der Demo', () => {
  it('nimmt keine fremde Datei an, bietet aber das Beispieldokument', async () => {
    const demo = await startDemo();
    const kunden = await demo.client.json<ListResponse<Customer>>(api(demo, 'customers'));
    const kunde = kunden.data[0];
    expect(kunde).toBeDefined();

    const csrf = await demo.client.csrfToken();
    const eigeneDatei = await demo.client.request(
      api(demo, `documents?customerId=${kunde?.id}&filename=fremd.pdf`),
      {
        method: 'POST',
        csrf,
        headers: { 'content-type': 'application/pdf' },
        body: new TextEncoder().encode('%PDF-1.4 etwas Fremdes'),
      },
    );
    expect(eigeneDatei.status).toBe(403);

    const beispiel = await demo.client.request(
      api(demo, `documents/sample?customerId=${kunde?.id}`),
      { method: 'POST', csrf },
    );
    expect(beispiel.status).toBe(201);
    const angelegt = (await beispiel.json()) as { originalName: string; clientVisible: boolean };
    expect(angelegt.originalName).toBe('Beispieldokument.pdf');
    // Auch das Beispiel liegt zuerst intern.
    expect(angelegt.clientVisible).toBe(false);
  }, 30_000);
});

describe('Grenzen und Ablauf', () => {
  it('lässt nicht mehr Kunden zu als vorgesehen', async () => {
    const demo = await startDemo();
    const csrf = await demo.client.csrfToken();

    // Der Seed bringt acht Kunden mit; bis zur Grenze fehlen die übrigen.
    for (let index = 8; index < DEMO_LIMITS.customers; index += 1) {
      const response = await demo.client.request(api(demo, 'customers'), {
        method: 'POST',
        csrf,
        body: JSON.stringify({ name: `Zusatzkunde ${index}` }),
      });
      expect(response.status).toBe(201);
    }

    const ueberGrenze = await demo.client.request(api(demo, 'customers'), {
      method: 'POST',
      csrf,
      body: JSON.stringify({ name: 'Einer zu viel' }),
    });
    expect(ueberGrenze.status).toBe(422);
    await expect(ueberGrenze.json()).resolves.toMatchObject({
      error: { code: 'VALIDATION_FAILED' },
    });
  }, 60_000);

  it('lässt eine abgelaufene Demo nicht weiterarbeiten', async () => {
    const demo = await startDemo();
    await server.db.execute(
      sql`UPDATE workspaces SET expires_at = now() - interval '1 minute' WHERE id = ${demo.workspaceId}::uuid`,
    );

    const csrf = await demo.client.csrfToken();
    const wechsel = await demo.client.request(`/api/v1/demo/${demo.workspaceId}/switch`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({ userId: '00000000-0000-4000-8000-000000000000' }),
    });
    expect(wechsel.status).toBe(404);
  }, 30_000);

  it('räumt eine abgelaufene Demo samt Dateien und Sitzung weg', async () => {
    const demo = await startDemo();
    expect(server.storage.size()).toBeGreaterThan(0);

    await server.db.execute(
      sql`UPDATE workspaces SET expires_at = now() - interval '1 minute' WHERE id = ${demo.workspaceId}::uuid`,
    );

    const result = await cleanupExpiredDemos(
      server.db,
      createDemoRepository(server.db),
      server.storage,
    );

    expect(result.workspaces).toBe(1);
    expect(result.documents).toBe(6);
    // Fünf Identitäten je Demo.
    expect(result.users).toBe(5);
    expect(server.storage.size()).toBe(0);

    // Das Cookie der Demo ist danach wertlos: die Sitzung wurde mitgelöscht.
    const nachher = await demo.client.request('/api/v1/auth/me');
    await expect(nachher.json()).resolves.toBeNull();
  }, 40_000);

  it('lässt eine laufende Demo unangetastet', async () => {
    const laufend = await startDemo();
    const result = await cleanupExpiredDemos(
      server.db,
      createDemoRepository(server.db),
      server.storage,
    );

    expect(result.workspaces).toBe(0);
    const me = await laufend.client.request('/api/v1/auth/me');
    await expect(me.json()).resolves.not.toBeNull();
  }, 30_000);
});
