import { hashPassword, normalizeEmail } from '@clientdesk/db/auth';
import { memberships, users, workspaces, type Database } from '@clientdesk/db';

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
