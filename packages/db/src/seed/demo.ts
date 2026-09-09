import { hashPassword, normalizeEmail } from '../auth/password.ts';
import { createDatabase, createPool, type Transaction } from '../client.ts';
import { customers } from '../schema/customers.ts';
import { memberships } from '../schema/memberships.ts';
import { milestones, projects } from '../schema/projects.ts';
import { users } from '../schema/users.ts';
import { workspaces } from '../schema/workspaces.ts';
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
): Promise<void> {
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
}

export interface SeedOptions {
  email: string;
  password: string;
  displayName: string;
  /** Bezugsdatum für alle relativen Termine. */
  reference?: Date;
}

export async function seedDemoWorkspace(
  connectionString: string,
  options: SeedOptions,
): Promise<{ workspaceId: string; counts: { customers: number; projects: number } }> {
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

      for (const seed of SEED_CUSTOMERS) {
        await insertCustomer(tx, workspace.id, user.id, reference, seed);
      }

      return {
        workspaceId: workspace.id,
        counts: {
          customers: SEED_CUSTOMERS.length,
          projects: SEED_CUSTOMERS.reduce((sum, c) => sum + c.projects.length, 0),
        },
      };
    });
  } finally {
    await pool.end();
  }
}
