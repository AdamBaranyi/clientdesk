import type { Customer, Project, ServiceContract, ServiceRequest } from '@tallyroom/contracts';
import { seedClientUser, seedWorkspaceWithOwner, type SeededWorkspace } from './fixtures.ts';
import type { TestClient, TestServer } from './test-server.ts';

/**
 * Ein vollständiger Aufbau für die Portal-Tests: eine Agentur, zwei Kunden,
 * ein Kundenbenutzer für den ersten. Alles, was hier „intern" heisst, darf in
 * keiner Antwort des Portals auftauchen.
 */
export const INTERNAL_NOTE = 'INTERNER-VERMERK-DARF-NIE-NACH-AUSSEN';
export const INTERNAL_COMMENT = 'INTERNER-KOMMENTAR-DARF-NIE-NACH-AUSSEN';

export interface Scenario {
  agency: SeededWorkspace;
  team: TestClient;
  client: TestClient;
  clientAccount: SeededWorkspace & { customerId: string };
  ownCustomer: Customer;
  otherCustomer: Customer;
  visibleProject: Project;
  hiddenProject: Project;
  otherCustomerRequest: ServiceRequest;
  contract: ServiceContract;
}

export async function login(server: TestServer, account: SeededWorkspace): Promise<TestClient> {
  const session = server.client();
  const csrf = await session.csrfToken();
  const response = await session.request('/api/v1/auth/login', {
    method: 'POST',
    csrf,
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  if (response.status !== 200) throw new Error(`Anmeldung fehlgeschlagen: ${response.status}`);
  return session;
}

export async function post<T>(
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
  if (response.status !== expected) {
    throw new Error(`${path}: erwartet ${expected}, erhalten ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function buildScenario(server: TestServer): Promise<Scenario> {
  const agency = await seedWorkspaceWithOwner(server.db, {
    workspaceName: 'Alpenblick Studio',
    email: 'owner@alpenblick.test',
  });
  const team = await login(server, agency);
  const api = (path: string) => `/api/v1/workspaces/${agency.workspaceId}/${path}`;

  const clientAccount = await seedClientUser(server.db, {
    workspaceId: agency.workspaceId,
    customerName: 'Seeblick Digital',
    email: 'kunde@seeblick.test',
  });

  // Der Kundendatensatz entsteht bereits mit dem Kundenbenutzer.
  const ownCustomer = await team.json<Customer>(api(`customers/${clientAccount.customerId}`));

  const otherCustomer = await post<Customer>(team, api('customers'), {
    name: 'Nordlicht Architektur',
    internalNote: INTERNAL_NOTE,
  });

  const visibleProject = await post<Project>(team, api('projects'), {
    customerId: clientAccount.customerId,
    name: 'Freigegebenes Projekt',
    description: 'Für den Kunden sichtbar.',
    internalNote: INTERNAL_NOTE,
    startDate: '2026-01-15',
    clientVisible: true,
  });

  const hiddenProject = await post<Project>(team, api('projects'), {
    customerId: clientAccount.customerId,
    name: 'Nicht freigegebenes Projekt',
    internalNote: INTERNAL_NOTE,
    startDate: '2026-02-01',
    clientVisible: false,
  });

  const otherCustomerRequest = await post<ServiceRequest>(team, api('requests'), {
    customerId: otherCustomer.id,
    subject: 'Anfrage eines anderen Kunden',
    body: 'Gehört nicht zu Seeblick Digital.',
  });

  const contract = await post<ServiceContract>(team, api('contracts'), {
    customerId: clientAccount.customerId,
    name: 'Betrieb',
    startDate: '2026-01-01',
    confirmationStatus: 'confirmed',
    clientVisible: true,
    publicDescription: 'Betrieb und Wartung.',
    internalNote: INTERNAL_NOTE,
    monthlyAmountMinor: 45_000,
  });

  return {
    agency,
    team,
    client: await login(server, clientAccount),
    clientAccount,
    ownCustomer,
    otherCustomer,
    visibleProject,
    hiddenProject,
    otherCustomerRequest,
    contract,
  };
}
