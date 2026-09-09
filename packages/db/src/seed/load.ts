import { hashPassword, normalizeEmail } from '../auth/password.ts';
import { createDatabase, createPool, type Transaction } from '../client.ts';
import { contractRates, serviceContracts } from '../schema/service-contracts.ts';
import { customers } from '../schema/customers.ts';
import { memberships } from '../schema/memberships.ts';
import { milestones, projects } from '../schema/projects.ts';
import { serviceRequests } from '../schema/service-requests.ts';
import { users } from '../schema/users.ts';
import { workspaces } from '../schema/workspaces.ts';

/**
 * Lastdaten für die Performance-Messung. Ausdrücklich getrennt vom
 * Vorführ-Seed: mit acht Kunden lässt sich über das Verhalten bei tausend
 * nichts aussagen, und eine Laufzeit ohne solche Daten wäre erfunden.
 *
 * Läuft nur lokal und niemals gegen die Produktionsumgebung.
 */
export interface LoadSeedCounts {
  customers: number;
  projects: number;
  requests: number;
  contracts: number;
}

export const DEFAULT_COUNTS: LoadSeedCounts = {
  customers: 1_000,
  projects: 3_000,
  requests: 10_000,
  contracts: 1_500,
};

const PROJECT_STATUS = ['planned', 'active', 'paused', 'completed'] as const;
const REQUEST_STATUS = ['open', 'in_progress', 'waiting_customer', 'resolved'] as const;

/** Wiederholbar, damit zwei Läufe dieselbe Verteilung erzeugen. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function dayOffset(base: Date, days: number): string {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Fügt in Blöcken ein — eine Zeile je Anweisung wäre um Grössenordnungen langsamer. */
async function insertInChunks<T>(
  rows: T[],
  size: number,
  write: (chunk: T[]) => Promise<unknown>,
): Promise<void> {
  for (let index = 0; index < rows.length; index += size) {
    await write(rows.slice(index, index + size));
  }
}

async function seedCustomers(
  tx: Transaction,
  workspaceId: string,
  count: number,
): Promise<string[]> {
  const rows = Array.from({ length: count }, (_, index) => ({
    workspaceId,
    name: `Lastkunde ${String(index + 1).padStart(4, '0')}`,
    contactName: `Kontakt ${index + 1}`,
    email: `kontakt${index + 1}@lasttest.example`,
  }));

  const ids: string[] = [];
  await insertInChunks(rows, 500, async (chunk) => {
    const inserted = await tx.insert(customers).values(chunk).returning({ id: customers.id });
    ids.push(...inserted.map((row) => row.id));
  });
  return ids;
}

async function seedProjects(
  tx: Transaction,
  workspaceId: string,
  customerIds: string[],
  count: number,
  base: Date,
  random: () => number,
): Promise<string[]> {
  const rows = Array.from({ length: count }, (_, index) => {
    const customerId = customerIds[Math.floor(random() * customerIds.length)];
    if (!customerId) throw new Error('Kein Kunde für das Projekt vorhanden.');
    // Der Zieltermin wird relativ zum Start gerechnet. Absolut gerechnet
    // könnte er vor dem Start liegen, was der Check-Constraint zu Recht ablehnt.
    const startsDaysAgo = Math.floor(random() * 500);
    const startDate = dayOffset(base, -startsDaysAgo);
    return {
      workspaceId,
      customerId,
      name: `Lastprojekt ${index + 1}`,
      status: PROJECT_STATUS[Math.floor(random() * PROJECT_STATUS.length)] ?? 'active',
      startDate,
      targetDate: dayOffset(new Date(startDate), Math.floor(random() * 400) + 30),
    };
  });

  const ids: string[] = [];
  await insertInChunks(rows, 500, async (chunk) => {
    const inserted = await tx.insert(projects).values(chunk).returning({ id: projects.id });
    ids.push(...inserted.map((row) => row.id));
  });
  return ids;
}

async function seedMilestones(
  tx: Transaction,
  workspaceId: string,
  projectIds: string[],
  base: Date,
  random: () => number,
): Promise<void> {
  const rows = projectIds.flatMap((projectId) =>
    Array.from({ length: Math.floor(random() * 5) }, (_, order) => ({
      workspaceId,
      projectId,
      title: `Schritt ${order + 1}`,
      dueDate: dayOffset(base, Math.floor(random() * 240) - 120),
      status: random() > 0.5 ? ('done' as const) : ('open' as const),
      sortOrder: order,
    })),
  );
  await insertInChunks(rows, 1_000, (chunk) => tx.insert(milestones).values(chunk));
}

async function seedContracts(
  tx: Transaction,
  workspaceId: string,
  customerIds: string[],
  count: number,
  base: Date,
  random: () => number,
): Promise<void> {
  const contractRows = Array.from({ length: count }, (_, index) => {
    const customerId = customerIds[Math.floor(random() * customerIds.length)];
    if (!customerId) throw new Error('Kein Kunde für den Vertrag vorhanden.');
    const startDate = dayOffset(base, -Math.floor(random() * 700) - 30);
    return {
      workspaceId,
      customerId,
      name: `Lastvertrag ${index + 1}`,
      startDate,
      // Ebenso beim Vertragsende: exklusiv und immer nach dem Beginn.
      endDate:
        random() > 0.8 ? dayOffset(new Date(startDate), Math.floor(random() * 500) + 60) : null,
      confirmationStatus: random() > 0.15 ? ('confirmed' as const) : ('draft' as const),
    };
  });

  const created: { id: string; startDate: string }[] = [];
  await insertInChunks(contractRows, 500, async (chunk) => {
    const inserted = await tx
      .insert(serviceContracts)
      .values(chunk)
      .returning({ id: serviceContracts.id, startDate: serviceContracts.startDate });
    created.push(...inserted);
  });

  // Jeder Vertrag bekommt eine Preisversion ab Beginn, viele eine zweite später.
  const rateRows = created.flatMap((contract) => {
    const rows = [
      {
        workspaceId,
        contractId: contract.id,
        effectiveFrom: contract.startDate,
        monthlyAmountMinor: (Math.floor(random() * 300) + 50) * 100,
      },
    ];
    if (random() > 0.5) {
      const later = dayOffset(new Date(contract.startDate), Math.floor(random() * 300) + 30);
      if (later > contract.startDate) {
        rows.push({
          workspaceId,
          contractId: contract.id,
          effectiveFrom: later,
          monthlyAmountMinor: (Math.floor(random() * 400) + 60) * 100,
        });
      }
    }
    return rows;
  });
  await insertInChunks(rateRows, 1_000, (chunk) => tx.insert(contractRates).values(chunk));
}

async function seedRequests(
  tx: Transaction,
  workspaceId: string,
  customerIds: string[],
  count: number,
  random: () => number,
): Promise<void> {
  const rows = Array.from({ length: count }, (_, index) => {
    const customerId = customerIds[Math.floor(random() * customerIds.length)];
    if (!customerId) throw new Error('Kein Kunde für die Anfrage vorhanden.');
    return {
      workspaceId,
      customerId,
      subject: `Lastanfrage ${index + 1}`,
      body: 'Automatisch erzeugte Anfrage für die Performance-Messung.',
      status: REQUEST_STATUS[Math.floor(random() * REQUEST_STATUS.length)] ?? 'open',
      priority: random() > 0.85 ? ('high' as const) : ('normal' as const),
    };
  });
  await insertInChunks(rows, 1_000, (chunk) => tx.insert(serviceRequests).values(chunk));
}

export async function seedLoadWorkspace(
  connectionString: string,
  options: { email: string; password: string; counts?: Partial<LoadSeedCounts> },
): Promise<{ workspaceId: string; counts: LoadSeedCounts; durationMs: number }> {
  const counts = { ...DEFAULT_COUNTS, ...options.counts };
  const pool = createPool({ connectionString, maxConnections: 1 });
  const db = createDatabase(pool);
  const random = makeRandom(20_260_909);
  const base = new Date();
  const startedAt = Date.now();

  try {
    const workspaceId = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          normalizedEmail: normalizeEmail(options.email),
          displayName: 'Lastdaten-Konto',
          passwordHash: await hashPassword(options.password),
        })
        .returning({ id: users.id });
      const [workspace] = await tx
        .insert(workspaces)
        .values({ name: 'Lastdaten (nur lokal)' })
        .returning({ id: workspaces.id });

      if (!user || !workspace) throw new Error('Workspace konnte nicht angelegt werden.');
      await tx
        .insert(memberships)
        .values({ workspaceId: workspace.id, userId: user.id, role: 'owner' });

      const customerIds = await seedCustomers(tx, workspace.id, counts.customers);
      const projectIds = await seedProjects(
        tx,
        workspace.id,
        customerIds,
        counts.projects,
        base,
        random,
      );
      await seedMilestones(tx, workspace.id, projectIds, base, random);
      await seedContracts(tx, workspace.id, customerIds, counts.contracts, base, random);
      await seedRequests(tx, workspace.id, customerIds, counts.requests, random);

      return workspace.id;
    });

    return { workspaceId, counts, durationMs: Date.now() - startedAt };
  } finally {
    await pool.end();
  }
}
