import { z } from 'zod';
import {
  ArchiveError,
  decodeArchive,
  encodeArchive,
  sha256,
  splitLines,
} from '../backup/archive.ts';
import { s3Objects } from '../backup/s3-objects.ts';

/**
 * Sichert, prüft und spielt die Dokumente des Objektspeichers zurück.
 * Läuft im Container mit derselben Umgebung wie die API:
 *
 *   … run --rm -T migrate bun apps/api/src/cli/documents-backup.ts export > dokumente.jsonl
 *   … run --rm -T migrate bun apps/api/src/cli/documents-backup.ts verify < dokumente.jsonl
 *   … run --rm -T migrate bun apps/api/src/cli/documents-backup.ts import < dokumente.jsonl
 *   … run --rm -T migrate bun apps/api/src/cli/documents-backup.ts manifest < dokumente.jsonl
 *
 * `manifest` prüft wie `verify` und gibt je Objekt Prüfsumme und Schlüssel
 * aus, sortierbar und mit `diff` vergleichbar. So vergleicht die
 * Probe-Wiederherstellung das Original mit dem, was zurückgespielt ankam.
 *
 * stdout gehört beim Export allein dem Archiv. Alles für Menschen geht nach
 * stderr, sonst stünde es mitten in der Sicherung.
 */
const s3Env = z.object({
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1).default('garage'),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
});

function bucket() {
  const env = s3Env.parse(process.env);
  return s3Objects({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    bucket: env.S3_BUCKET,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  });
}

/** Schreibt eine Zeile und wartet, bis sie abgenommen ist — sonst füllt ein langsamer Empfänger den Speicher. */
function writeLine(line: string): Promise<void> {
  return new Promise((resolve, reject) => {
    process.stdout.write(`${line}\n`, (error) => (error ? reject(error) : resolve()));
  });
}

async function exportArchive(): Promise<void> {
  const lines = encodeArchive(bucket(), new Date());
  let next = await lines.next();
  while (!next.done) {
    await writeLine(next.value);
    next = await lines.next();
  }
  console.error(`Gesichert: ${next.value.count} Objekte, ${next.value.bytes} Bytes`);
}

async function readArchive(write: boolean): Promise<void> {
  const summary = await decodeArchive(splitLines(Bun.stdin.stream()), write ? bucket() : undefined);
  const verb = write ? 'Zurückgespielt' : 'Geprüft';
  console.error(
    `${verb}: ${summary.count} Objekte, ${summary.bytes} Bytes, alle Prüfsummen stimmen`,
  );
}

async function printManifest(): Promise<void> {
  const lines: string[] = [];
  await decodeArchive(splitLines(Bun.stdin.stream()), {
    write: async (entry) => void lines.push(`${sha256(entry.bytes)}  ${entry.key}`),
  });
  for (const line of lines.sort()) await writeLine(line);
}

const command = process.argv[2];
try {
  if (command === 'export') await exportArchive();
  else if (command === 'verify') await readArchive(false);
  else if (command === 'import') await readArchive(true);
  else if (command === 'manifest') await printManifest();
  else {
    console.error('Aufruf: documents-backup.ts export | verify | import | manifest');
    process.exit(2);
  }
} catch (error) {
  console.error(error instanceof ArchiveError ? `Archiv unbrauchbar: ${error.message}` : error);
  process.exit(1);
}
