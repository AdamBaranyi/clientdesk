import { createHash } from 'node:crypto';
import { z } from 'zod';

/**
 * Sicherung der Dokumente als Textstrom: eine JSON-Zeile je Objekt.
 *
 * Logisch über die S3-Schnittstelle statt einer Kopie der Garage-Ordner.
 * So lässt sich die Sicherung in jeden S3-Speicher zurückspielen, nicht nur
 * in dieselbe Garage-Version. Ein Strom statt eines Verzeichnisses, damit
 * der Container nichts auf den Server schreiben muss: die Sicherung geht
 * über stdout hinaus und beim Wiederherstellen über stdin hinein.
 *
 * Kopfzeile, Einträge, Schlusszeile. Fehlt die Schlusszeile, ist das Archiv
 * abgeschnitten — etwa weil die Platte voll war — und gilt als unbrauchbar.
 */
export const ARCHIVE_FORMAT = 'tallyroom-documents';
export const ARCHIVE_VERSION = 1;

export interface StoredEntry {
  key: string;
  contentType: string;
  bytes: Uint8Array;
}

/** Was die Sicherung vom Speicher braucht. */
export interface ObjectSource {
  keys(): AsyncIterable<string>;
  read(key: string): Promise<Omit<StoredEntry, 'key'>>;
}

/** Was die Wiederherstellung vom Speicher braucht. */
export interface ObjectSink {
  write(entry: StoredEntry): Promise<void>;
}

const headerSchema = z.object({
  format: z.literal(ARCHIVE_FORMAT),
  version: z.literal(ARCHIVE_VERSION),
  createdAt: z.string(),
});

const entrySchema = z.object({
  key: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  data: z.string(),
});

const trailerSchema = z.object({
  end: z.literal(true),
  count: z.number().int().nonnegative(),
  bytes: z.number().int().nonnegative(),
});

export interface ArchiveSummary {
  count: number;
  bytes: number;
}

export function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Liefert das Archiv Zeile für Zeile, jede ohne Zeilenumbruch. */
export async function* encodeArchive(
  source: ObjectSource,
  createdAt: Date,
): AsyncGenerator<string, ArchiveSummary> {
  yield JSON.stringify({
    format: ARCHIVE_FORMAT,
    version: ARCHIVE_VERSION,
    createdAt: createdAt.toISOString(),
  });

  let count = 0;
  let bytes = 0;
  for await (const key of source.keys()) {
    const object = await source.read(key);
    yield JSON.stringify({
      key,
      contentType: object.contentType,
      size: object.bytes.byteLength,
      sha256: sha256(object.bytes),
      data: Buffer.from(object.bytes).toString('base64'),
    });
    count += 1;
    bytes += object.bytes.byteLength;
  }

  yield JSON.stringify({ end: true, count, bytes });
  return { count, bytes };
}

export class ArchiveError extends Error {}

function parseLine<T>(schema: z.ZodType<T>, line: string, where: string): T {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    throw new ArchiveError(`${where}: keine gültige JSON-Zeile`);
  }
  const result = schema.safeParse(value);
  if (!result.success) throw new ArchiveError(`${where}: unerwarteter Aufbau`);
  return result.data;
}

/**
 * Liest ein Archiv, prüft jede Prüfsumme und die Schlusszeile und reicht
 * jeden Eintrag an `sink` weiter. Ohne `sink` wird nur geprüft.
 *
 * Geschrieben wird erst nach der Prüfung des jeweiligen Eintrags. Ein
 * beschädigter Eintrag bricht ab, bevor er im Speicher landet.
 */
export async function decodeArchive(
  lines: AsyncIterable<string>,
  sink?: ObjectSink,
): Promise<ArchiveSummary> {
  let header = false;
  let trailer: z.infer<typeof trailerSchema> | null = null;
  let count = 0;
  let bytes = 0;

  for await (const line of lines) {
    if (line.length === 0) continue;
    if (trailer) throw new ArchiveError('Daten nach der Schlusszeile');

    if (!header) {
      parseLine(headerSchema, line, 'Kopfzeile');
      header = true;
      continue;
    }

    if (line.startsWith('{"end":')) {
      trailer = parseLine(trailerSchema, line, 'Schlusszeile');
      continue;
    }

    const entry = parseLine(entrySchema, line, `Eintrag ${count + 1}`);
    const data = new Uint8Array(Buffer.from(entry.data, 'base64'));
    if (data.byteLength !== entry.size || sha256(data) !== entry.sha256) {
      throw new ArchiveError(`Eintrag ${count + 1} (${entry.key}): Prüfsumme stimmt nicht`);
    }
    if (sink) await sink.write({ key: entry.key, contentType: entry.contentType, bytes: data });
    count += 1;
    bytes += data.byteLength;
  }

  if (!header) throw new ArchiveError('Leeres Archiv');
  if (!trailer) throw new ArchiveError('Schlusszeile fehlt, das Archiv ist abgeschnitten');
  if (trailer.count !== count || trailer.bytes !== bytes) {
    throw new ArchiveError(
      `Schlusszeile nennt ${trailer.count} Objekte und ${trailer.bytes} Bytes, gelesen wurden ${count} und ${bytes}`,
    );
  }
  return { count, bytes };
}

/**
 * Zerlegt einen Byte-Strom in Zeilen. Eine Zeile trägt ein ganzes PDF und
 * geht über Hunderte Blöcke; gesucht wird deshalb nur im neuen Block, nicht
 * jedes Mal im ganzen bisherigen Rest.
 */
export async function* splitLines(stream: AsyncIterable<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let rest = '';
  for await (const chunk of stream) {
    const text = decoder.decode(chunk, { stream: true });
    let start = 0;
    let newline = text.indexOf('\n');
    while (newline !== -1) {
      yield rest + text.slice(start, newline);
      rest = '';
      start = newline + 1;
      newline = text.indexOf('\n', start);
    }
    rest += text.slice(start);
  }
  rest += decoder.decode();
  if (rest.length > 0) yield rest;
}
