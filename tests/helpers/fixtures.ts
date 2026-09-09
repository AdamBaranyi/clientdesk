import { hashPassword, normalizeEmail } from '@clientdesk/db/auth';
import { customers, memberships, users, workspaces, type Database } from '@clientdesk/db';

export interface SeededWorkspace {
  workspaceId: string;
  userId: string;
  email: string;
  password: string;
}

/**
 * Legt einen Workspace mit genau einem Owner an. Bewusst ohne Umweg über die
 * API, damit der Test die Grenze prüft und nicht sich selbst.
 */
export async function seedWorkspaceWithOwner(
  db: Database,
  options: { workspaceName: string; email: string; password?: string },
): Promise<SeededWorkspace> {
  const password = options.password ?? 'Ein-sicheres-Testpasswort-1';
  const email = normalizeEmail(options.email);
  const passwordHash = await hashPassword(password);

  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ normalizedEmail: email, displayName: email, passwordHash })
      .returning();
    const [workspace] = await tx
      .insert(workspaces)
      .values({ name: options.workspaceName })
      .returning();

    if (!user || !workspace) throw new Error('Testdaten konnten nicht angelegt werden.');

    await tx
      .insert(memberships)
      .values({ workspaceId: workspace.id, userId: user.id, role: 'owner' });

    return { workspaceId: workspace.id, userId: user.id, email, password };
  });
}

/**
 * Legt einen Kundendatensatz und dazu einen angemeldeten Kundenbenutzer an.
 * Die Mitgliedschaft mit Rolle client zeigt auf genau diesen Datensatz.
 */
export async function seedClientUser(
  db: Database,
  options: { workspaceId: string; customerName: string; email: string; password?: string },
): Promise<SeededWorkspace & { customerId: string }> {
  const password = options.password ?? 'Ein-sicheres-Testpasswort-1';
  const email = normalizeEmail(options.email);
  const passwordHash = await hashPassword(password);

  return db.transaction(async (tx) => {
    const [customer] = await tx
      .insert(customers)
      .values({ workspaceId: options.workspaceId, name: options.customerName })
      .returning();
    const [user] = await tx
      .insert(users)
      .values({ normalizedEmail: email, displayName: email, passwordHash })
      .returning();

    if (!customer || !user) throw new Error('Testdaten konnten nicht angelegt werden.');

    await tx.insert(memberships).values({
      workspaceId: options.workspaceId,
      userId: user.id,
      role: 'client',
      customerId: customer.id,
    });

    return {
      workspaceId: options.workspaceId,
      userId: user.id,
      email,
      password,
      customerId: customer.id,
    };
  });
}
