import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Customer, Dashboard, ServiceContract } from '@clientdesk/contracts';
import { seedWorkspaceWithOwner, type SeededWorkspace } from '../helpers/fixtures.ts';
import { startTestServer, type TestClient, type TestServer } from '../helpers/test-server.ts';

let server: TestServer;
let agentur: SeededWorkspace;
let fremd: SeededWorkspace;
let client: TestClient;
let kunde: Customer;

const CHF = (francs: number) => francs * 100;

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
  fremd = await seedWorkspaceWithOwner(server.db, {
    workspaceName: 'Nordlicht Architektur',
    email: 'owner@nordlicht.test',
  });
  client = await login(agentur);
  kunde = await post<Customer>(client, url('customers'), { name: 'Seeblick Digital' });
});

function url(...segments: string[]): string {
  return `/api/v1/workspaces/${agentur.workspaceId}/${segments.join('/')}`;
}

async function login(account: SeededWorkspace): Promise<TestClient> {
  const session = server.client();
  const csrf = await session.csrfToken();
  await session.request('/api/v1/auth/login', {
    method: 'POST',
    csrf,
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  return session;
}

async function post<T>(
  session: TestClient,
  path: string,
  body: Record<string, unknown>,
  expected = 201,
): Promise<T> {
  const csrf = await session.csrfToken();
  const response = await session.request(path, {
    method: 'POST',
    csrf,
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(expected);
  return (await response.json()) as T;
}

/** Legt einen bestätigten Vertrag mit erster Preisversion ab Beginn an. */
async function contract(options: {
  name: string;
  startDate: string;
  endDate?: string | null;
  francs: number;
  confirmed?: boolean;
  customerId?: string;
}): Promise<ServiceContract> {
  return post<ServiceContract>(client, url('contracts'), {
    customerId: options.customerId ?? kunde.id,
    name: options.name,
    startDate: options.startDate,
    endDate: options.endDate ?? null,
    confirmationStatus: options.confirmed === false ? 'draft' : 'confirmed',
    monthlyAmountMinor: CHF(options.francs),
  });
}

async function valueOn(date: string): Promise<number> {
  const board = await client.json<Dashboard>(`${url('dashboard')}?contractDate=${date}`);
  return board.monthlyContractValueMinor;
}

/**
 * Das verbindliche Beispiel aus der Spezifikation, Zahl für Zahl nachgestellt.
 */
describe('Monatlicher Vertragswert — das vorgegebene Beispiel', () => {
  it('summiert zwei laufende Verträge zu CHF 650', async () => {
    await contract({ name: 'Vertrag A', startDate: '2026-01-01', francs: 250 });
    await contract({ name: 'Vertrag B', startDate: '2026-01-01', francs: 400 });

    expect(await valueOn('2026-06-15')).toBe(CHF(650));
  });

  it('zählt einen erst morgen beginnenden Vertrag heute nicht mit', async () => {
    await contract({ name: 'Vertrag A', startDate: '2026-01-01', francs: 250 });
    await contract({ name: 'Vertrag B', startDate: '2026-06-16', francs: 400 });

    // Heute nur A, morgen beide.
    expect(await valueOn('2026-06-15')).toBe(CHF(250));
    expect(await valueOn('2026-06-16')).toBe(CHF(650));
  });

  it('zählt einen Vertrag an seinem exklusiven Enddatum nicht mehr', async () => {
    await contract({
      name: 'Vertrag A',
      startDate: '2026-01-01',
      endDate: '2026-06-15',
      francs: 250,
    });
    await contract({ name: 'Vertrag B', startDate: '2026-01-01', francs: 400 });

    // Am 14. zählt A noch, am 15. — dem Enddatum selbst — nicht mehr.
    expect(await valueOn('2026-06-14')).toBe(CHF(650));
    expect(await valueOn('2026-06-15')).toBe(CHF(400));
  });

  it('behält für ein früheres Monatsende den damals gültigen Wert', async () => {
    const beendet = await contract({
      name: 'Beendet',
      startDate: '2026-01-01',
      endDate: '2026-05-01',
      francs: 300,
    });
    expect(beendet.endDate).toBe('2026-05-01');

    // Im April lief der Vertrag noch, im Mai nicht mehr.
    expect(await valueOn('2026-04-30')).toBe(CHF(300));
    expect(await valueOn('2026-05-31')).toBe(0);
  });
});

describe('Preisversionen', () => {
  it('verwendet die letzte Version mit Wirksamkeit bis zum Stichtag', async () => {
    const vertrag = await contract({ name: 'Hosting', startDate: '2026-01-01', francs: 250 });
    await post(client, url('contracts', vertrag.id, 'rates'), {
      effectiveFrom: '2026-07-01',
      monthlyAmountMinor: CHF(320),
    });

    expect(await valueOn('2026-06-30')).toBe(CHF(250));
    expect(await valueOn('2026-07-01')).toBe(CHF(320));
  });

  it('verändert vergangene Monatswerte durch eine Preisänderung nicht', async () => {
    const vertrag = await contract({ name: 'Hosting', startDate: '2026-01-01', francs: 250 });
    const vorher = await valueOn('2026-03-31');

    await post(client, url('contracts', vertrag.id, 'rates'), {
      effectiveFrom: '2026-08-01',
      monthlyAmountMinor: CHF(500),
    });

    // Der März kennt die Erhöhung vom August nicht.
    expect(await valueOn('2026-03-31')).toBe(vorher);
    expect(await valueOn('2026-08-01')).toBe(CHF(500));
  });

  it('zählt einen Vertrag mit mehreren Preisversionen nur einmal', async () => {
    const vertrag = await contract({ name: 'Hosting', startDate: '2026-01-01', francs: 250 });
    for (const [datum, betrag] of [
      ['2026-02-01', 260],
      ['2026-03-01', 270],
      ['2026-04-01', 280],
    ] as const) {
      await post(client, url('contracts', vertrag.id, 'rates'), {
        effectiveFrom: datum,
        monthlyAmountMinor: CHF(betrag),
      });
    }

    // Vier Preisversionen, aber nur ein Vertrag: kein Aufsummieren durch Join.
    const board = await client.json<Dashboard>(`${url('dashboard')}?contractDate=2026-06-15`);
    expect(board.monthlyContractValueMinor).toBe(CHF(280));
    expect(board.confirmedContracts).toBe(1);
  });

  it('weist ein bereits belegtes Wirksamkeitsdatum ab', async () => {
    const vertrag = await contract({ name: 'Hosting', startDate: '2026-01-01', francs: 250 });
    const csrf = await client.csrfToken();
    const response = await client.request(url('contracts', vertrag.id, 'rates'), {
      method: 'POST',
      csrf,
      body: JSON.stringify({ effectiveFrom: '2026-01-01', monthlyAmountMinor: CHF(300) }),
    });
    expect(response.status).toBe(422);
  });

  it('weist eine Preisversion vor dem Vertragsbeginn ab', async () => {
    const vertrag = await contract({ name: 'Hosting', startDate: '2026-03-01', francs: 250 });
    const csrf = await client.csrfToken();
    const response = await client.request(url('contracts', vertrag.id, 'rates'), {
      method: 'POST',
      csrf,
      body: JSON.stringify({ effectiveFrom: '2026-02-01', monthlyAmountMinor: CHF(300) }),
    });
    expect(response.status).toBe(422);
  });
});

describe('Was nicht in die Kennzahl gehört', () => {
  it('zählt Entwürfe nicht mit', async () => {
    await contract({ name: 'Entwurf', startDate: '2026-01-01', francs: 900, confirmed: false });
    await contract({ name: 'Bestätigt', startDate: '2026-01-01', francs: 250 });

    expect(await valueOn('2026-06-15')).toBe(CHF(250));
  });

  it('lässt Verträge fremder Mandanten aussen vor', async () => {
    await contract({ name: 'Eigener', startDate: '2026-01-01', francs: 250 });

    const fremdClient = await login(fremd);
    const fremdKunde = await post<Customer>(
      fremdClient,
      `/api/v1/workspaces/${fremd.workspaceId}/customers`,
      { name: 'Fremdkunde' },
    );
    await post(fremdClient, `/api/v1/workspaces/${fremd.workspaceId}/contracts`, {
      customerId: fremdKunde.id,
      name: 'Fremder Vertrag',
      startDate: '2026-01-01',
      confirmationStatus: 'confirmed',
      monthlyAmountMinor: CHF(9999),
    });

    expect(await valueOn('2026-06-15')).toBe(CHF(250));
  });

  it('zählt einen Vertrag nicht mehrfach, wenn der Kunde mehrere Projekte hat', async () => {
    await contract({ name: 'Hosting', startDate: '2026-01-01', francs: 250 });
    for (const name of ['Projekt eins', 'Projekt zwei', 'Projekt drei']) {
      await post(client, url('projects'), {
        customerId: kunde.id,
        name,
        startDate: '2026-01-15',
      });
    }

    expect(await valueOn('2026-06-15')).toBe(CHF(250));
  });

  it('erlaubt kostenlose Verträge und zählt sie mit null', async () => {
    await contract({ name: 'Kulanz', startDate: '2026-01-01', francs: 0 });
    const board = await client.json<Dashboard>(`${url('dashboard')}?contractDate=2026-06-15`);

    expect(board.monthlyContractValueMinor).toBe(0);
    // Er zählt als Vertrag, auch wenn er nichts kostet.
    expect(board.confirmedContracts).toBe(1);
  });

  it('weist einen negativen Betrag ab', async () => {
    const csrf = await client.csrfToken();
    const response = await client.request(url('contracts'), {
      method: 'POST',
      csrf,
      body: JSON.stringify({
        customerId: kunde.id,
        name: 'Gutschrift',
        startDate: '2026-01-01',
        monthlyAmountMinor: -100,
      }),
    });
    expect(response.status).toBe(422);
  });
});

describe('Verlauf der letzten sechs Monate', () => {
  it('liefert sechs Punkte und markiert den laufenden Monat', async () => {
    const board = await client.json<Dashboard>(url('dashboard'));
    expect(board.history).toHaveLength(6);
    expect(board.history.at(-1)?.isCurrentMonth).toBe(true);
    expect(board.history.slice(0, -1).every((point) => !point.isCurrentMonth)).toBe(true);
  });

  it('lässt Kunden- und Projektzahlen vom Stichtag unberührt', async () => {
    await post(client, url('projects'), {
      customerId: kunde.id,
      name: 'Laufendes Projekt',
      startDate: '2026-01-15',
    });

    const heute = await client.json<Dashboard>(url('dashboard'));
    const frueher = await client.json<Dashboard>(`${url('dashboard')}?contractDate=2020-01-01`);

    // Für Kunden und Projekte gibt es keine Historie — sie sind ausdrücklich aktuell.
    expect(frueher.activeCustomers).toBe(heute.activeCustomers);
    expect(frueher.runningProjects).toBe(heute.runningProjects);
    expect(frueher.contractDate).toBe('2020-01-01');
  });
});
