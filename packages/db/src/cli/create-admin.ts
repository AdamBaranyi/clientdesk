import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { hashPassword, normalizeEmail } from '../auth/password.ts';
import { createDatabase, createPool } from '../client.ts';
import { memberships } from '../schema/memberships.ts';
import { users } from '../schema/users.ts';
import { workspaces } from '../schema/workspaces.ts';

/**
 * Interne Konten entstehen über diesen dokumentierten lokalen Befehl, nicht
 * über eine öffentliche Registrierung. Aufruf:
 *
 *   bun run admin:create -- --email a@b.ch --name "Vorname Nachname" --workspace "Agentur"
 *
 * Ohne --password wird ein zufälliges Passwort erzeugt und einmalig ausgegeben.
 */
interface Args {
  email: string;
  name: string;
  workspace: string;
  password: string;
}

function parseArgs(argv: string[]): Args {
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === undefined || !token.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) continue;
    values.set(token.slice(2), next);
    i += 1;
  }

  const email = values.get('email');
  const name = values.get('name');
  if (!email || !name) {
    throw new Error('Pflichtangaben fehlen: --email und --name.');
  }

  return {
    email: normalizeEmail(email),
    name,
    workspace: values.get('workspace') ?? 'Mein Workspace',
    password: values.get('password') ?? randomBytes(12).toString('base64url'),
  };
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL fehlt. Siehe .env.example.');

  const args = parseArgs(process.argv.slice(2));
  const pool = createPool({ connectionString, maxConnections: 1 });
  const db = createDatabase(pool);

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.normalizedEmail, args.email),
    });
    if (existing) throw new Error(`Konto ${args.email} existiert bereits.`);

    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          normalizedEmail: args.email,
          displayName: args.name,
          passwordHash: await hashPassword(args.password),
        })
        .returning();

      const [workspace] = await tx.insert(workspaces).values({ name: args.workspace }).returning();

      if (!user || !workspace) throw new Error('Anlegen fehlgeschlagen.');

      await tx.insert(memberships).values({
        workspaceId: workspace.id,
        userId: user.id,
        role: 'owner',
      });
    });

    console.log(`Konto angelegt: ${args.email}`);
    console.log(`Workspace:      ${args.workspace}`);
    console.log(`Passwort:       ${args.password}`);
    console.log('\nPasswort jetzt notieren — es wird nicht erneut angezeigt.');
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
