import type { Transaction } from '../client.ts';
import { customers } from '../schema/customers.ts';
import { milestones, projects } from '../schema/projects.ts';
import { contractRates, serviceContracts } from '../schema/service-contracts.ts';
import { insertDocuments, insertRequests, type SeedStorage } from './attachments.ts';
import { SEED_CONTRACTS } from './contract-data.ts';
import { SEED_CUSTOMERS, type SeedCustomer } from './data.ts';

/**
 * Der gemeinsame Inhalt eines Vorführ-Workspace. Beide Wege benutzen ihn: der
 * lokale Seed-Befehl und die Demo, die ein Besucher startet. Zwei Kopien
 * derselben Beispieldaten würden sonst auseinanderlaufen.
 */
export interface WorkspaceContentCounts {
  customers: number;
  projects: number;
  contracts: number;
  requests: number;
  documents: number;
}

export function isoDate(reference: Date, offsetDays: number): string {
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
 * Jeder Vertrag bekommt eine Preisversion ab Vertragsbeginn — ohne sie würde
 * er in der Kennzahl stillschweigend fehlen.
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

export interface ContentOptions {
  workspaceId: string;
  ownerUserId: string;
  /**
   * Wird aufgerufen, sobald die Kunden angelegt sind, und liefert die
   * Kundenzugänge zurück. Die Reihenfolge ist zwingend: ein Kundenzugang
   * braucht seinen Kundendatensatz, und die Anfragen brauchen den Zugang als
   * Verfasser — sonst hätte keine Anfrage einen Kunden als Absender.
   */
  attachClients: (customerIds: Map<string, string>) => Promise<Map<string, string>>;
  reference: Date;
  storage: SeedStorage;
}

export async function seedWorkspaceContent(
  tx: Transaction,
  options: ContentOptions,
): Promise<{ counts: WorkspaceContentCounts; customerIds: Map<string, string> }> {
  const customerIds = new Map<string, string>();
  for (const seed of SEED_CUSTOMERS) {
    const id = await insertCustomer(
      tx,
      options.workspaceId,
      options.ownerUserId,
      options.reference,
      seed,
    );
    customerIds.set(seed.name, id);
  }

  // Zuerst die Kundenzugänge: die Anfragen brauchen sie als Verfasser.
  const clientUserIds = await options.attachClients(customerIds);

  const contracts = await insertContracts(tx, options.workspaceId, options.reference, customerIds);
  const requests = await insertRequests(
    tx,
    options.workspaceId,
    options.ownerUserId,
    clientUserIds,
    customerIds,
  );
  const documentCount = await insertDocuments(
    tx,
    options.workspaceId,
    options.ownerUserId,
    customerIds,
    options.storage,
  );

  return {
    customerIds,
    counts: {
      customers: SEED_CUSTOMERS.length,
      projects: SEED_CUSTOMERS.reduce((sum, entry) => sum + entry.projects.length, 0),
      contracts,
      requests,
      documents: documentCount,
    },
  };
}

export { SEED_CUSTOMERS };
export type { SeedStorage };
