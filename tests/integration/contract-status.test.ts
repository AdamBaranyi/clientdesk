import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  CONTRACT_VISIBLE_STATUS,
  type ContractVisibleStatus,
  type Customer,
  type ListResponse,
  type ServiceContract,
} from '@tallyroom/contracts';
import { seedWorkspaceWithOwner, type SeededWorkspace } from '../helpers/fixtures.ts';
import { startTestServer, type TestClient, type TestServer } from '../helpers/test-server.ts';

let server: TestServer;
let agentur: SeededWorkspace;
let client: TestClient;
let kunde: Customer;

const ON_DATE = '2026-06-15';

beforeAll(async () => {
  server = await startTestServer();
}, 60_000);

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  await server.reset();
  agentur = await seedWorkspaceWithOwner(server.db, {
    workspaceName: 'Alpenblick Studio',
    email: 'owner@alpenblick.test',
  });

  const session = server.client();
  const csrf = await session.csrfToken();
  await session.request('/api/v1/auth/login', {
    method: 'POST',
    csrf,
    body: JSON.stringify({ email: agentur.email, password: agentur.password }),
  });
  client = session;
  kunde = await create<Customer>('customers', { name: 'Seeblick Digital' });
});

function url(...segments: string[]): string {
  return `/api/v1/workspaces/${agentur.workspaceId}/${segments.join('/')}`;
}

async function create<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const csrf = await client.csrfToken();
  const response = await client.request(url(path), {
    method: 'POST',
    csrf,
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(201);
  return (await response.json()) as T;
}

/** Ein Vertrag je erwartetem Zustand, alle zum selben Stichtag bewertet. */
async function seedAllStates(): Promise<Map<string, ContractVisibleStatus>> {
  const erwartet = new Map<string, ContractVisibleStatus>();

  const entwurf = await create<ServiceContract>('contracts', {
    customerId: kunde.id,
    name: 'Noch nicht bestätigt',
    startDate: '2026-01-01',
    confirmationStatus: 'draft',
    monthlyAmountMinor: 25_000,
  });
  erwartet.set(entwurf.id, 'draft');

  const geplant = await create<ServiceContract>('contracts', {
    customerId: kunde.id,
    name: 'Beginnt später',
    startDate: '2026-09-01',
    confirmationStatus: 'confirmed',
    monthlyAmountMinor: 25_000,
  });
  erwartet.set(geplant.id, 'planned');

  const aktiv = await create<ServiceContract>('contracts', {
    customerId: kunde.id,
    name: 'Läuft',
    startDate: '2026-01-01',
    confirmationStatus: 'confirmed',
    monthlyAmountMinor: 25_000,
  });
  erwartet.set(aktiv.id, 'active');

  const beendet = await create<ServiceContract>('contracts', {
    customerId: kunde.id,
    name: 'Ausgelaufen',
    startDate: '2026-01-01',
    // Enddatum exklusiv und vor dem Stichtag.
    endDate: '2026-05-01',
    confirmationStatus: 'confirmed',
    monthlyAmountMinor: 25_000,
  });
  erwartet.set(beendet.id, 'ended');

  const endetAmStichtag = await create<ServiceContract>('contracts', {
    customerId: kunde.id,
    name: 'Endet genau heute',
    startDate: '2026-01-01',
    endDate: ON_DATE,
    confirmationStatus: 'confirmed',
    monthlyAmountMinor: 25_000,
  });
  // Exklusives Enddatum: am Enddatum selbst gilt der Vertrag als beendet.
  erwartet.set(endetAmStichtag.id, 'ended');

  return erwartet;
}

describe('Abgeleiteter Vertragszustand', () => {
  it('leitet jeden Zustand am Stichtag korrekt ab', async () => {
    const erwartet = await seedAllStates();
    const liste = await client.json<ListResponse<ServiceContract>>(
      `${url('contracts')}?onDate=${ON_DATE}&pageSize=50`,
    );

    for (const vertrag of liste.data) {
      expect(vertrag.visibleStatus).toBe(erwartet.get(vertrag.id));
    }
    expect(liste.data).toHaveLength(erwartet.size);
  });

  /**
   * Der Filter läuft in SQL, die Anzeige über deriveVisibleStatus. Zwei Orte,
   * eine Regel — dieser Test hält sie zusammen. Läuft einer davon weg, zeigt
   * die gefilterte Liste einen anderen Zustand an als den, nach dem gefiltert
   * wurde.
   */
  it('filtert in SQL nach demselben Zustand, den die Anzeige nennt', async () => {
    const erwartet = await seedAllStates();

    for (const status of CONTRACT_VISIBLE_STATUS) {
      const gefiltert = await client.json<ListResponse<ServiceContract>>(
        `${url('contracts')}?onDate=${ON_DATE}&status=${status}&pageSize=50`,
      );

      const ausSql = new Set(gefiltert.data.map((entry) => entry.id));
      const ausRegel = new Set(
        [...erwartet.entries()].filter(([, value]) => value === status).map(([id]) => id),
      );

      expect(ausSql).toEqual(ausRegel);
      // Jeder gelieferte Vertrag trägt auch den Zustand, nach dem gefiltert wurde.
      expect(gefiltert.data.every((entry) => entry.visibleStatus === status)).toBe(true);
      // Und die Seitenzahlen passen zur gefilterten Menge.
      expect(gefiltert.pagination.totalItems).toBe(ausRegel.size);
    }
  });

  it('bewertet denselben Vertrag zu verschiedenen Stichtagen verschieden', async () => {
    const vertrag = await create<ServiceContract>('contracts', {
      customerId: kunde.id,
      name: 'Wandert durch die Zustände',
      startDate: '2026-03-01',
      endDate: '2026-08-01',
      confirmationStatus: 'confirmed',
      monthlyAmountMinor: 25_000,
    });

    const zustandAm = async (datum: string) =>
      (await client.json<ServiceContract>(`${url('contracts', vertrag.id)}?onDate=${datum}`))
        .visibleStatus;

    expect(await zustandAm('2026-02-28')).toBe('planned');
    expect(await zustandAm('2026-03-01')).toBe('active');
    expect(await zustandAm('2026-07-31')).toBe('active');
    expect(await zustandAm('2026-08-01')).toBe('ended');
  });
});
