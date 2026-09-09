import { randomBytes } from 'node:crypto';
import { seedDemoWorkspace } from '../seed/demo.ts';

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : undefined;
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL fehlt. Siehe .env.example.');

  const email = argValue('email') ?? 'demo@clientdesk.test';
  const password = argValue('password') ?? randomBytes(9).toString('base64url');
  const displayName = argValue('name') ?? 'Demo-Konto';

  const result = await seedDemoWorkspace(connectionString, { email, password, displayName });

  console.log('Vorführdaten angelegt.');
  console.log(`Workspace:  ${result.workspaceId}`);
  console.log(`Kunden:     ${result.counts.customers}`);
  console.log(`Projekte:   ${result.counts.projects}`);
  console.log(`\nAnmeldung:  ${email}`);
  console.log(`Passwort:   ${password}`);
  console.log('\nAlle Firmen und Personen sind erfunden.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
