import { randomBytes } from 'node:crypto';
import { seedDemoWorkspace } from '../seed/demo.ts';

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : undefined;
}

/** Objektspeicher für die Beispieldokumente — lokal MinIO aus dem Compose-File. */
function storageFromEnv() {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('S3-Konfiguration fehlt. Siehe .env.example.');
  }

  const client = new Bun.S3Client({
    endpoint,
    bucket,
    accessKeyId,
    secretAccessKey,
    region: process.env.S3_REGION ?? 'eu-central-1',
  });

  return {
    put: async (objectKey: string, bytes: Uint8Array, contentType: string) => {
      await client.write(objectKey, bytes, { type: contentType });
    },
  };
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL fehlt. Siehe .env.example.');

  const email = argValue('email') ?? 'demo@tallyroom.test';
  const password = argValue('password') ?? randomBytes(9).toString('base64url');
  const displayName = argValue('name') ?? 'Demo-Konto';
  const clientPassword = argValue('client-password') ?? password;

  const result = await seedDemoWorkspace(connectionString, {
    email,
    password,
    displayName,
    clientPassword,
    storage: storageFromEnv(),
  });

  console.log('Vorführdaten angelegt.');
  console.log(`Workspace:  ${result.workspaceId}`);
  console.log(`Kunden:     ${result.counts.customers}`);
  console.log(`Projekte:   ${result.counts.projects}`);
  console.log(`Verträge:   ${result.counts.contracts}`);
  console.log(`Anfragen:   ${result.counts.requests}`);
  console.log(`Dokumente:  ${result.counts.documents}`);
  console.log(`\nTeamansicht:  ${email} / ${password}`);
  for (const login of result.clientLogins) {
    console.log(`Kundenzugang: ${login.email} / ${clientPassword}  (${login.customerName})`);
  }
  console.log('\nAlle Firmen und Personen sind erfunden.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
