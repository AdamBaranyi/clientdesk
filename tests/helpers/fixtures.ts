import { hashPassword, normalizeEmail } from '@tallyroom/db/auth';
import { customers, memberships, users, workspaces, type Database } from '@tallyroom/db';

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

/** Eine minimale, gültige PDF-Datei für Upload-Tests. */
export function makePdfBytes(marker = 'Testdokument'): Uint8Array {
  const content = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n% ${marker}\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`;
  return new TextEncoder().encode(content);
}

/**
 * Durchsucht eine beliebige API-Antwort rekursiv nach einer Zeichenfolge.
 * Damit lässt sich prüfen, dass ein interner Text nirgends auftaucht — auch
 * nicht in einem verschachtelten Feld, an das beim Schreiben niemand dachte.
 */
export function containsText(value: unknown, needle: string): boolean {
  if (typeof value === 'string') return value.includes(needle);
  if (Array.isArray(value)) return value.some((entry) => containsText(entry, needle));
  if (value && typeof value === 'object') {
    return Object.values(value).some((entry) => containsText(entry, needle));
  }
  return false;
}
