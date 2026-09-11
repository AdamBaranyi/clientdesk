import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { UPLOADS_PER_WINDOW } from '../../apps/api/src/modules/documents/routes.ts';
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

describe('Uploads werden je Konto gebremst', () => {
  it('lässt die erlaubte Zahl durch und bremst die nächste mit Retry-After', async () => {
    const csrf = await s.team.csrfToken();
    const url = `/api/v1/workspaces/${s.agency.workspaceId}/documents?customerId=${s.clientAccount.customerId}&filename=bericht.pdf`;
    const upload = () =>
      s.team.request(url, {
        method: 'POST',
        csrf,
        headers: { 'content-type': 'application/pdf' },
        body: makePdfBytes(),
      });

    for (let index = 0; index < UPLOADS_PER_WINDOW; index += 1) {
      expect((await upload()).status).toBe(201);
    }

    const blocked = await upload();
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
  });
});
