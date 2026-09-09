import { hashPassword, normalizeEmail } from '../auth/password.ts';
import { createDatabase, createPool, type Transaction } from '../client.ts';
import { customers } from '../schema/customers.ts';
import { memberships } from '../schema/memberships.ts';
import { milestones, projects } from '../schema/projects.ts';
import { users } from '../schema/users.ts';
import { workspaces } from '../schema/workspaces.ts';
import { contractRates, serviceContracts } from '../schema/service-contracts.ts';
import { insertDocuments, insertRequests, type SeedStorage } from './attachments.ts';
import { SEED_CONTRACTS } from './contract-data.ts';
import { SEED_CUSTOMERS, type SeedCustomer } from './data.ts';

/**
 * Erzeugt einen vorführbaren Workspace. Alle Termine liegen relativ zu einem
 * dokumentierten Bezugsdatum — standardmässig heute —, damit Fristen auch in
 * einem halben Jahr noch sinnvoll aussehen.
 *
 * Aufruf:
 *   bun run seed:demo -- --email demo@clientdesk.test --password Demo-2026!
 */
const WORKSPACE_NAME = 'Baranyi Studio (Demo)';

function isoDate(reference: Date, offsetDays: number): string {
  const date = new Date(reference);
  date.setDate(date.getDate() + offsetDays);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

async function insertCustomer(
  tx: Transaction,
  workspaceId: string,
  ownerUserId: string,
  reference: Date,
  seed: SeedCustomer,
): Promise<string> {
  const [customer] = await tx
    .insert(customers)
    .values({
      workspaceId,
      name: seed.name,
      contactName: seed.contactName,
      email: seed.email,
      phone: seed.phone,
      website: seed.website,
      internalNote: seed.internalNote,
      archivedAt: seed.archived ? new Date() : null,
    })
    .returning({ id: customers.id });

  if (!customer) throw new Error(`Kunde ${seed.name} konnte nicht angelegt werden.`);

  for (const seedProject of seed.projects) {
    const [project] = await tx
      .insert(projects)
      .values({
        workspaceId,
        customerId: customer.id,
        ownerUserId,
        name: seedProject.name,
        description: seedProject.description,
        internalNote: seedProject.internalNote,
        status: seedProject.status,
        startDate: isoDate(reference, seedProject.startsInDays),
        targetDate:
          seedProject.targetInDays === null ? null : isoDate(reference, seedProject.targetInDays),
        clientVisible: seedProject.clientVisible,
      })
      .returning({ id: projects.id });

    if (!project) throw new Error(`Projekt ${seedProject.name} konnte nicht angelegt werden.`);

    let sortOrder = 0;
    for (const seedMilestone of seedProject.milestones) {
      await tx.insert(milestones).values({
        workspaceId,
        projectId: project.id,
        title: seedMilestone.title,
        dueDate:
          seedMilestone.dueInDays === null ? null : isoDate(reference, seedMilestone.dueInDays),
        status: seedMilestone.done ? 'done' : 'open',
        sortOrder,
      });
      sortOrder += 1;
    }
  }

  return customer.id;
}

/**
 * Verträge werden nach dem Anlegen der Kunden eingefügt, weil sie über den
 * Kundennamen zugeordnet sind. Jeder Vertrag bekommt eine Preisversion ab
 * Vertragsbeginn — ohne sie würde er in der Kennzahl stillschweigend fehlen.
 */
async function insertContracts(
  tx: Transaction,
  workspaceId: string,
  reference: Date,
  customerIds: Map<string, string>,
): Promise<number> {
  let count = 0;
  for (const seed of SEED_CONTRACTS) {
    const customerId = customerIds.get(seed.customerName);
    if (!customerId) throw new Error(`Kunde ${seed.customerName} fehlt für den Vertrag.`);

    const startDate = isoDate(reference, seed.startsInDays);
    const [contract] = await tx
      .insert(serviceContracts)
      .values({
        workspaceId,
        customerId,
        name: seed.name,
        startDate,
        endDate: seed.endsInDays === null ? null : isoDate(reference, seed.endsInDays),
        confirmationStatus: seed.confirmed ? 'confirmed' : 'draft',
        publicDescription: seed.publicDescription,
        internalNote: seed.internalNote,
        clientVisible: seed.clientVisible,
      })
      .returning({ id: serviceContracts.id });

    if (!contract) throw new Error(`Vertrag ${seed.name} konnte nicht angelegt werden.`);

    await tx.insert(contractRates).values({
      workspaceId,
      contractId: contract.id,
      effectiveFrom: startDate,
      monthlyAmountMinor: seed.amountMinor,
    });

    for (const rate of seed.laterRates) {
      await tx.insert(contractRates).values({
        workspaceId,
        contractId: contract.id,
        effectiveFrom: isoDate(reference, rate.effectiveInDays),
        monthlyAmountMinor: rate.amountMinor,
      });
    }
    count += 1;
  }
  return count;
}

/**
 * Zwei Kundenzugänge, damit sich das Portal vorführen lässt und sichtbar
 * wird, dass jeder nur seinen eigenen Kunden sieht.
 */
const CLIENT_ACCOUNTS = [
  { customerName: 'Alpenblick Studio', email: 'rahel@alpenblick.example', name: 'Rahel Steiner' },
  { customerName: 'Seeblick Digital', email: 'marina@seeblick.example', name: 'Marina Hug' },
] as const;

export interface SeedOptions {
  email: string;
  password: string;
  displayName: string;
  /** Passwort der beiden Kundenzugänge. */
  clientPassword: string;
  /** Bezugsdatum für alle relativen Termine. */
  reference?: Date;
  /** Objektspeicher für die Beispieldokumente. */
  storage: SeedStorage;
}

export async function seedDemoWorkspace(
  connectionString: string,
  options: SeedOptions,
): Promise<{
  workspaceId: string;
  counts: {
    customers: number;
    projects: number;
    contracts: number;
    requests: number;
    documents: number;
  };
  clientLogins: { email: string; customerName: string }[];
}> {
  const pool = createPool({ connectionString, maxConnections: 1 });
  const db = createDatabase(pool);
  const reference = options.reference ?? new Date();
  const email = normalizeEmail(options.email);

  try {
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          normalizedEmail: email,
          displayName: options.displayName,
          passwordHash: await hashPassword(options.password),
        })
        .returning({ id: users.id });

      const [workspace] = await tx
        .insert(workspaces)
        .values({ name: WORKSPACE_NAME })
        .returning({ id: workspaces.id });

      if (!user || !workspace) throw new Error('Workspace konnte nicht angelegt werden.');

      await tx
        .insert(memberships)
        .values({ workspaceId: workspace.id, userId: user.id, role: 'owner' });

      const customerIds = new Map<string, string>();
      for (const seed of SEED_CUSTOMERS) {
        const id = await insertCustomer(tx, workspace.id, user.id, reference, seed);
        customerIds.set(seed.name, id);
      }

      const contracts = await insertContracts(tx, workspace.id, reference, customerIds);

      // Kundenzugänge: eine Mitgliedschaft mit Rolle client, fest an genau
      // einen Kundendatensatz gebunden.
      const clientUserIds = new Map<string, string>();
      const clientPasswordHash = await hashPassword(options.clientPassword);
      for (const account of CLIENT_ACCOUNTS) {
        const customerId = customerIds.get(account.customerName);
        if (!customerId) throw new Error(`Kunde ${account.customerName} fehlt für den Zugang.`);

        const [clientUser] = await tx
          .insert(users)
          .values({
            normalizedEmail: normalizeEmail(account.email),
            displayName: account.name,
            passwordHash: clientPasswordHash,
          })
          .returning({ id: users.id });
        if (!clientUser) throw new Error('Kundenzugang konnte nicht angelegt werden.');

        await tx.insert(memberships).values({
          workspaceId: workspace.id,
          userId: clientUser.id,
          role: 'client',
          customerId,
        });
        clientUserIds.set(account.customerName, clientUser.id);
      }

      const requests = await insertRequests(tx, workspace.id, user.id, clientUserIds, customerIds);
      const documentCount = await insertDocuments(
        tx,
        workspace.id,
        user.id,
        customerIds,
        options.storage,
      );

      return {
        workspaceId: workspace.id,
        counts: {
          customers: SEED_CUSTOMERS.length,
          projects: SEED_CUSTOMERS.reduce((sum, c) => sum + c.projects.length, 0),
          contracts,
          requests,
          documents: documentCount,
        },
        clientLogins: CLIENT_ACCOUNTS.map((account) => ({
          email: account.email,
          customerName: account.customerName,
        })),
      };
    });
  } finally {
    await pool.end();
  }
}
