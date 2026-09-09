import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MAX_DOCUMENT_BYTES, type ClientDeskDocument } from '@clientdesk/contracts';
import { makePdfBytes } from '../helpers/fixtures.ts';
import { buildScenario, type Scenario } from '../helpers/scenario.ts';
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

async function upload(options: {
  bytes: Uint8Array;
  contentType?: string;
  filename?: string;
  customerId?: string;
  projectId?: string;
}) {
  const csrf = await s.team.csrfToken();
  const params = new URLSearchParams({
    customerId: options.customerId ?? s.clientAccount.customerId,
    filename: options.filename ?? 'bericht.pdf',
  });
  if (options.projectId) params.set('projectId', options.projectId);

  return s.team.request(internal(`documents?${params.toString()}`), {
    method: 'POST',
    csrf,
    headers: { 'content-type': options.contentType ?? 'application/pdf' },
    body: options.bytes,
  });
}

describe('Was beim Hochladen abgewiesen wird', () => {
  it('nimmt eine gültige PDF-Datei an', async () => {
    const response = await upload({ bytes: makePdfBytes() });
    expect(response.status).toBe(201);

    const created = (await response.json()) as ClientDeskDocument;
    expect(created.mimeType).toBe('application/pdf');
    // Standardmässig intern. Freigabe ist eine eigene Handlung.
    expect(created.clientVisible).toBe(false);
  });

  it('weist einen fremden Content-Type ab', async () => {
    const response = await upload({ bytes: makePdfBytes(), contentType: 'image/png' });
    expect([415, 422]).toContain(response.status);
  });

  it('weist eine Datei ab, die als PDF deklariert ist, aber keines ist', async () => {
    // Der deklarierte Typ allein ist keine Aussage über den Inhalt.
    const response = await upload({
      bytes: new TextEncoder().encode('<html><script>alert(1)</script></html>'),
    });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'VALIDATION_FAILED' },
    });
  });

  it('weist eine leere Datei ab', async () => {
    const response = await upload({ bytes: new Uint8Array() });
    expect(response.status).toBe(422);
  });

  it('weist eine zu grosse Datei ab', async () => {
    const zuGross = new Uint8Array(MAX_DOCUMENT_BYTES + 1024);
    zuGross.set(makePdfBytes(), 0);
    const response = await upload({ bytes: zuGross });
    // Express bricht bereits an der Grössengrenze ab.
    expect([413, 422]).toContain(response.status);
  });

  it('weist einen Kunden eines fremden Workspace ab', async () => {
    const response = await upload({
      bytes: makePdfBytes(),
      customerId: '00000000-0000-4000-8000-000000000000',
    });
    expect(response.status).toBe(422);
  });

  it('weist ein Projekt ab, das nicht zu diesem Kunden gehört', async () => {
    const response = await upload({
      bytes: makePdfBytes(),
      customerId: s.otherCustomer.id,
      projectId: s.visibleProject.id,
    });
    expect(response.status).toBe(422);
  });

  it('macht aus dem Dateinamen keinen Speicherort und entfernt Pfadanteile', async () => {
    const response = await upload({
      bytes: makePdfBytes(),
      filename: '../../etc/passwd.pdf',
    });
    expect(response.status).toBe(201);

    const created = (await response.json()) as ClientDeskDocument;
    expect(created.originalName).toBe('passwd.pdf');
    expect(created).not.toHaveProperty('objectKey');
  });
});

describe('Download und Löschen', () => {
  async function uploadOne(): Promise<ClientDeskDocument> {
    const response = await upload({ bytes: makePdfBytes() });
    return (await response.json()) as ClientDeskDocument;
  }

  it('liefert das Dokument als Anhang mit Ausführungssperre', async () => {
    const created = await uploadOne();
    const response = await s.team.request(internal(`documents/${created.id}/download`));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toContain('attachment');
    expect(response.headers.get('content-security-policy')).toContain('sandbox');
  });

  it('verweigert den Download einer fremden Objekt-ID', async () => {
    const response = await s.team.request(
      internal('documents/00000000-0000-4000-8000-000000000000/download'),
    );
    expect(response.status).toBe(404);
  });

  it('verweigert einem Kundenbenutzer den internen Download', async () => {
    const created = await uploadOne();
    const response = await s.client.request(internal(`documents/${created.id}/download`));
    expect(response.status).toBe(404);
  });

  it('entfernt die Datei aus dem Speicher und aus der Liste', async () => {
    const created = await uploadOne();
    expect(server.storage.size()).toBe(1);

    const csrf = await s.team.csrfToken();
    const deleted = await s.team.request(internal(`documents/${created.id}`), {
      method: 'DELETE',
      csrf,
    });
    expect(deleted.status).toBe(204);
    expect(server.storage.size()).toBe(0);

    const liste = await s.team.json<{ data: ClientDeskDocument[] }>(internal('documents'));
    expect(liste.data).toHaveLength(0);

    const nachher = await s.team.request(internal(`documents/${created.id}/download`));
    expect(nachher.status).toBe(404);
  });

  it('nimmt die Sichtbarkeit auch dann, wenn der Speicher nicht löschen kann', async () => {
    const created = await uploadOne();

    // Der Speicher scheitert: die Sichtbarkeit ist trotzdem sofort weg, und
    // der Datensatz bleibt für einen Wiederholungslauf stehen.
    const original = server.storage.delete;
    server.storage.delete = async () => {
      throw new Error('Speicher nicht erreichbar');
    };

    const csrf = await s.team.csrfToken();
    const response = await s.team.request(internal(`documents/${created.id}`), {
      method: 'DELETE',
      csrf,
    });
    server.storage.delete = original;

    expect(response.status).toBe(204);
    const nachher = await s.team.request(internal(`documents/${created.id}/download`));
    expect(nachher.status).toBe(404);

    const [row] = await server.db
      .execute<{ deletion_status: string }>(
        `SELECT deletion_status FROM documents WHERE id = '${created.id}'` as never,
      )
      .then((result) => result.rows);
    expect(row?.deletion_status).toBe('pending_deletion');
  });
});
