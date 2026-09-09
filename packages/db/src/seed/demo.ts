import { hashPassword, normalizeEmail } from '../auth/password.ts';
import { createDatabase, createPool, type Transaction } from '../client.ts';
import { memberships } from '../schema/memberships.ts';
import { users } from '../schema/users.ts';
import { workspaces } from '../schema/workspaces.ts';
import { seedWorkspaceContent, type SeedStorage, type WorkspaceContentCounts } from './content.ts';

/**
 * Zwei Kundenzugänge, damit sich das Portal vorführen lässt und sichtbar
 * wird, dass jeder nur seinen eigenen Kunden sieht.
 */
export const CLIENT_ACCOUNTS = [
  { customerName: 'Alpenblick Studio', email: 'rahel@alpenblick.example', name: 'Rahel Steiner' },
  { customerName: 'Seeblick Digital', email: 'marina@seeblick.example', name: 'Marina Hug' },
] as const;

const WORKSPACE_NAME = 'Baranyi Studio (Demo)';

export interface SeedOptions {
  email: string;
  password: string;
  displayName: string;
  /** Passwort der beiden Kundenzugänge. */
  clientPassword: string;
  /** Bezugsdatum für alle relativen Termine. */
  reference?: Date;
  storage: SeedStorage;
}

/**
 * Legt Kundenzugänge an und ordnet sie ihrem Kundendatensatz zu. Die
 * Zuordnung entsteht ausschliesslich über die Mitgliedschaft.
 */
export async function attachClientAccounts(
  tx: Transaction,
  workspaceId: string,
  customerIds: Map<string, string>,
  passwordHash: string,
  emailFor: (email: string) => string = (email) => email,
): Promise<Map<string, string>> {
  const clientUserIds = new Map<string, string>();

  for (const account of CLIENT_ACCOUNTS) {
    const customerId = customerIds.get(account.customerName);
    if (!customerId) throw new Error(`Kunde ${account.customerName} fehlt für den Zugang.`);

    const [clientUser] = await tx
      .insert(users)
      .values({
        normalizedEmail: normalizeEmail(emailFor(account.email)),
        displayName: account.name,
        passwordHash,
      })
      .returning({ id: users.id });
    if (!clientUser) throw new Error('Kundenzugang konnte nicht angelegt werden.');

    await tx.insert(memberships).values({
      workspaceId,
      userId: clientUser.id,
      role: 'client',
      customerId,
    });
    clientUserIds.set(account.customerName, clientUser.id);
  }

  return clientUserIds;
}

export async function seedDemoWorkspace(
  connectionString: string,
  options: SeedOptions,
): Promise<{
  workspaceId: string;
  counts: WorkspaceContentCounts;
  clientLogins: { email: string; customerName: string }[];
}> {
  const pool = createPool({ connectionString, maxConnections: 1 });
  const db = createDatabase(pool);
  const reference = options.reference ?? new Date();

  try {
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          normalizedEmail: normalizeEmail(options.email),
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

      const clientPasswordHash = await hashPassword(options.clientPassword);
      const content = await seedWorkspaceContent(tx, {
        workspaceId: workspace.id,
        ownerUserId: user.id,
        attachClients: (customerIds) =>
          attachClientAccounts(tx, workspace.id, customerIds, clientPasswordHash),
        reference,
        storage: options.storage,
      });

      return {
        workspaceId: workspace.id,
        counts: content.counts,
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
