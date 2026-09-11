import { resetPassword } from '../auth/reset-password.ts';
import { createDatabase, createPool } from '../client.ts';

/**
 * Setzt das Passwort eines bestehenden Kontos neu. Aufruf:
 *
 *   bun run admin:reset-password -- --email a@b.ch
 *
 * Auf dem Server im Container:
 *
 *   docker compose … --profile tools run --rm migrate \
 *     bun packages/db/src/cli/reset-password.ts --email a@b.ch
 *
 * Das neue Passwort wird einmalig ausgegeben.
 */
function emailArgument(argv: string[]): string {
  const index = argv.indexOf('--email');
  const email = index === -1 ? undefined : argv[index + 1];
  if (!email || email.startsWith('--')) throw new Error('Pflichtangabe fehlt: --email.');
  return email;
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL fehlt. Siehe .env.example.');

  const email = emailArgument(process.argv.slice(2));
  const pool = createPool({ connectionString, maxConnections: 1 });
  try {
    const result = await resetPassword(createDatabase(pool), email);
    console.log(`Passwort neu gesetzt für ${email}`);
    console.log(`Neues Passwort:   ${result.password}`);
    console.log(`Beendete Sitzungen: ${result.endedSessions}`);
    console.log('\nPasswort jetzt weitergeben — es wird nicht erneut angezeigt.');
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
