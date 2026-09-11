import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type {
  ClientComment,
  ClientContract,
  ClientDocument,
  ClientProject,
  ClientRequest,
  PortalOverview,
  ServiceRequest,
} from '@tallyroom/contracts';
import { containsText, makePdfBytes } from '../helpers/fixtures.ts';
import {
  buildScenario,
  INTERNAL_COMMENT,
  INTERNAL_NOTE,
  post,
  type Scenario,
} from '../helpers/scenario.ts';
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

const portal = (path: string) => `/api/v1/portal/${s.agency.workspaceId}/${path}`;
const internal = (path: string) => `/api/v1/workspaces/${s.agency.workspaceId}/${path}`;

async function uploadPdf(options: {
  customerId: string;
  filename: string;
  release: boolean;
}): Promise<{ id: string }> {
  const csrf = await s.team.csrfToken();
  const response = await s.team.request(
    internal(`documents?customerId=${options.customerId}&filename=${options.filename}`),
    {
      method: 'POST',
      csrf,
      headers: { 'content-type': 'application/pdf' },
      body: makePdfBytes(options.filename),
    },
  );
  expect(response.status).toBe(201);
  const created = (await response.json()) as { id: string };

  if (options.release) {
    const releaseCsrf = await s.team.csrfToken();
    const released = await s.team.request(internal(`documents/${created.id}/visibility`), {
      method: 'PATCH',
      csrf: releaseCsrf,
      body: JSON.stringify({ clientVisible: true }),
    });
    expect(released.status).toBe(200);
  }
  return created;
}

describe('Das Portal zeigt nur eigenen, freigegebenen Inhalt', () => {
  it('liefert nur freigegebene Projekte des eigenen Kunden', async () => {
    const body = await s.client.json<{ data: ClientProject[] }>(portal('projects'));
    const namen = body.data.map((project) => project.name);

    expect(namen).toContain('Freigegebenes Projekt');
    expect(namen).not.toContain('Nicht freigegebenes Projekt');
  });

  it('führt interne Notizen in keiner Antwort des Portals', async () => {
    const antworten = await Promise.all([
      s.client.json<unknown>(portal('overview')),
      s.client.json<unknown>(portal('projects')),
      s.client.json<unknown>(portal('contracts')),
      s.client.json<unknown>(portal('requests')),
      s.client.json<unknown>(portal('documents')),
    ]);

    // Rekursiv über die ganze Antwort: auch ein vergessenes verschachteltes
    // Feld würde hier auffallen.
    for (const antwort of antworten) {
      expect(containsText(antwort, INTERNAL_NOTE)).toBe(false);
    }
  });

  it('liefert die Leistungsbeschreibung des Vertrags, nicht den internen Vermerk', async () => {
    const body = await s.client.json<{ data: ClientContract[] }>(portal('contracts'));
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.publicDescription).toBe('Betrieb und Wartung.');
    expect(containsText(body, INTERNAL_NOTE)).toBe(false);
  });

  it('zeigt eine Anfrage eines anderen Kunden auch bei bekannter ID nicht', async () => {
    const response = await s.client.request(portal(`requests/${s.otherCustomerRequest.id}`));
    expect(response.status).toBe(404);
  });

  it('verweigert einem Kundenbenutzer die internen Routen', async () => {
    for (const route of ['customers', 'projects', 'contracts', 'requests', 'documents']) {
      const response = await s.client.request(internal(route));
      // 404 statt 403: für einen Client existiert der interne Bereich nicht.
      expect(response.status, route).toBe(404);
    }
  });

  it('verweigert einem internen Konto das Portal', async () => {
    const response = await s.team.request(portal('overview'));
    expect(response.status).toBe(404);
  });

  it('lässt ein Portal eines fremden Workspace nicht zu', async () => {
    const response = await s.client.request(
      `/api/v1/portal/00000000-0000-4000-8000-000000000000/overview`,
    );
    expect(response.status).toBe(404);
  });
});

describe('Interne Kommentare bleiben intern', () => {
  it('liefert dem Kunden nur öffentliche Kommentare', async () => {
    const anfrage = await post<ServiceRequest>(s.team, internal('requests'), {
      customerId: s.clientAccount.customerId,
      subject: 'Zertifikat erneuern',
      body: 'Bitte prüfen.',
    });

    await post(s.team, internal(`requests/${anfrage.id}/comments`), {
      body: INTERNAL_COMMENT,
      visibility: 'internal',
    });
    await post(s.team, internal(`requests/${anfrage.id}/comments`), {
      body: 'Wir haben das Zertifikat erneuert.',
      visibility: 'public',
    });

    const sicht = await s.client.json<{ request: ClientRequest; comments: ClientComment[] }>(
      portal(`requests/${anfrage.id}`),
    );

    expect(sicht.comments).toHaveLength(1);
    expect(sicht.comments[0]?.body).toBe('Wir haben das Zertifikat erneuert.');
    expect(containsText(sicht, INTERNAL_COMMENT)).toBe(false);
    // Das Feld visibility existiert in der Kundenansicht gar nicht.
    expect(sicht.comments[0]).not.toHaveProperty('visibility');
  });

  it('zeigt dem Team beide Kommentare', async () => {
    const anfrage = await post<ServiceRequest>(s.team, internal('requests'), {
      customerId: s.clientAccount.customerId,
      subject: 'Zertifikat erneuern',
      body: 'Bitte prüfen.',
    });
    await post(s.team, internal(`requests/${anfrage.id}/comments`), {
      body: INTERNAL_COMMENT,
      visibility: 'internal',
    });
    await post(s.team, internal(`requests/${anfrage.id}/comments`), {
      body: 'Öffentliche Antwort',
      visibility: 'public',
    });

    const body = await s.team.json<{ data: { visibility: string }[] }>(
      internal(`requests/${anfrage.id}/comments`),
    );
    expect(body.data).toHaveLength(2);
    expect(body.data.map((entry) => entry.visibility).sort()).toEqual(['internal', 'public']);
  });

  it('öffnet eine wartende Anfrage durch die Kundenantwort wieder', async () => {
    const anfrage = await post<ServiceRequest>(s.team, internal('requests'), {
      customerId: s.clientAccount.customerId,
      subject: 'Rückfrage',
      body: 'Bitte um Angaben.',
    });

    const gewartet = await post<ServiceRequest>(
      s.team,
      internal(`requests/${anfrage.id}/status`),
      { status: 'waiting_customer', version: anfrage.version },
      200,
    );
    expect(gewartet.status).toBe('waiting_customer');

    const nachAntwort = await post<{ request: ClientRequest }>(
      s.client,
      portal(`requests/${anfrage.id}/comments`),
      { body: 'Hier sind die Angaben.' },
    );

    // Der Statuswechsel passiert in derselben Transaktion wie der Kommentar.
    expect(nachAntwort.request.status).toBe('open');
  });

  it('macht aus einem Kundenkommentar keinen internen, auch wenn er es behauptet', async () => {
    const anfrage = await post<ServiceRequest>(s.team, internal('requests'), {
      customerId: s.clientAccount.customerId,
      subject: 'Rückfrage',
      body: 'Bitte um Angaben.',
    });

    const csrf = await s.client.csrfToken();
    await s.client.request(portal(`requests/${anfrage.id}/comments`), {
      method: 'POST',
      csrf,
      // Die Sichtbarkeit kommt nicht aus dem Request — sie ist immer public.
      body: JSON.stringify({ body: 'Antwort des Kunden', visibility: 'internal' }),
    });

    const intern = await s.team.json<{ data: { visibility: string; body: string }[] }>(
      internal(`requests/${anfrage.id}/comments`),
    );
    const kundenkommentar = intern.data.find((entry) => entry.body === 'Antwort des Kunden');
    expect(kundenkommentar?.visibility).toBe('public');
  });
});

describe('Dokumente im Portal', () => {
  it('zeigt nur freigegebene Dokumente', async () => {
    await uploadPdf({
      customerId: s.clientAccount.customerId,
      filename: 'intern.pdf',
      release: false,
    });
    const frei = await uploadPdf({
      customerId: s.clientAccount.customerId,
      filename: 'freigegeben.pdf',
      release: true,
    });

    const body = await s.client.json<{ data: ClientDocument[] }>(portal('documents'));
    expect(body.data.map((entry) => entry.originalName)).toEqual(['freigegeben.pdf']);
    expect(body.data[0]?.id).toBe(frei.id);
    // Der Objektschlüssel ist ein Speicherdetail und verlässt den Server nicht.
    expect(containsText(body, 's.agency.workspaceId')).toBe(false);
    expect(body.data[0]).not.toHaveProperty('objectKey');
    expect(body.data[0]).not.toHaveProperty('clientVisible');
  });

  it('verweigert den Download eines nicht freigegebenen Dokuments', async () => {
    const intern = await uploadPdf({
      customerId: s.clientAccount.customerId,
      filename: 'intern.pdf',
      release: false,
    });

    const response = await s.client.request(portal(`documents/${intern.id}/download`));
    expect(response.status).toBe(404);
  });

  it('verweigert den Download eines Dokuments eines anderen Kunden', async () => {
    const fremd = await uploadPdf({
      customerId: s.otherCustomer.id,
      filename: 'fremd.pdf',
      release: true,
    });

    const response = await s.client.request(portal(`documents/${fremd.id}/download`));
    expect(response.status).toBe(404);
  });

  it('liefert ein freigegebenes Dokument als Anhang ohne Ausführung', async () => {
    const frei = await uploadPdf({
      customerId: s.clientAccount.customerId,
      filename: 'bericht.pdf',
      release: true,
    });

    const response = await s.client.request(portal(`documents/${frei.id}/download`));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toContain('attachment');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');

    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
  });
});

describe('Übersicht', () => {
  it('nennt Kunde und Agentur und zeigt nur eigene offene Anfragen', async () => {
    await post<ServiceRequest>(s.team, internal('requests'), {
      customerId: s.clientAccount.customerId,
      subject: 'Eigene offene Anfrage',
      body: 'Text.',
    });

    const overview = await s.client.json<PortalOverview>(portal('overview'));
    expect(overview.customerName).toBe('Seeblick Digital');
    expect(overview.workspaceName).toBe('Alpenblick Studio');
    expect(overview.openRequests.map((entry) => entry.subject)).toEqual(['Eigene offene Anfrage']);
    expect(overview.projects.map((entry) => entry.name)).toEqual(['Freigegebenes Projekt']);
  });
});
