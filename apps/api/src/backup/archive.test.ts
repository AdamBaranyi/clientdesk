import { describe, expect, it } from 'vitest';
import {
  ArchiveError,
  decodeArchive,
  encodeArchive,
  splitLines,
  type ObjectSource,
  type StoredEntry,
} from './archive.ts';

const pdf = (text: string) => new TextEncoder().encode(`%PDF-1.7 ${text}`);

function memoryBucket(entries: StoredEntry[] = []) {
  const objects = new Map(entries.map((entry) => [entry.key, entry]));
  const source: ObjectSource = {
    async *keys() {
      yield* objects.keys();
    },
    async read(key) {
      const entry = objects.get(key);
      if (!entry) throw new Error(`fehlt: ${key}`);
      return { bytes: entry.bytes, contentType: entry.contentType };
    },
  };
  return {
    source,
    objects,
    sink: { write: async (entry: StoredEntry) => void objects.set(entry.key, entry) },
  };
}

async function collect(lines: AsyncIterable<string>): Promise<string[]> {
  const result: string[] = [];
  for await (const line of lines) result.push(line);
  return result;
}

async function* from(lines: string[]) {
  yield* lines;
}

const original = [
  { key: 'ws-1/a.pdf', contentType: 'application/pdf', bytes: pdf('Offerte') },
  { key: 'ws-1/b.pdf', contentType: 'application/pdf', bytes: pdf('Vertrag') },
  { key: 'ws-2/c.pdf', contentType: 'application/pdf', bytes: new Uint8Array(0) },
];

describe('Dokumentarchiv', () => {
  it('spielt alles zurück, Byte für Byte und mit Inhaltstyp', async () => {
    const lines = await collect(encodeArchive(memoryBucket(original).source, new Date()));
    const target = memoryBucket();

    const summary = await decodeArchive(from(lines), target.sink);

    expect(summary).toEqual({ count: 3, bytes: pdf('Offerte').length + pdf('Vertrag').length });
    for (const entry of original) {
      expect(target.objects.get(entry.key)).toEqual(entry);
    }
  });

  it('prüft ohne zu schreiben, wenn kein Ziel angegeben ist', async () => {
    const lines = await collect(encodeArchive(memoryBucket(original).source, new Date()));
    await expect(decodeArchive(from(lines))).resolves.toMatchObject({ count: 3 });
  });

  it('bricht bei einer falschen Prüfsumme ab, bevor der Eintrag geschrieben wird', async () => {
    const lines = await collect(encodeArchive(memoryBucket(original).source, new Date()));
    const entry = JSON.parse(lines[2]!) as { data: string };
    entry.data = Buffer.from(pdf('Vertrag, verändert')).toString('base64');
    lines[2] = JSON.stringify(entry);
    const target = memoryBucket();

    await expect(decodeArchive(from(lines), target.sink)).rejects.toThrow(/Prüfsumme/);
    expect([...target.objects.keys()]).toEqual(['ws-1/a.pdf']);
  });

  it('erkennt ein abgeschnittenes Archiv an der fehlenden Schlusszeile', async () => {
    const lines = await collect(encodeArchive(memoryBucket(original).source, new Date()));
    await expect(decodeArchive(from(lines.slice(0, -1)))).rejects.toThrow(/abgeschnitten/);
  });

  it('erkennt, wenn Einträge fehlen, die Schlusszeile aber da ist', async () => {
    const lines = await collect(encodeArchive(memoryBucket(original).source, new Date()));
    lines.splice(1, 1);
    await expect(decodeArchive(from(lines))).rejects.toThrow(/Schlusszeile nennt 3 Objekte/);
  });

  it('lehnt eine fremde Datei ab', async () => {
    await expect(decodeArchive(from(['{"hallo":"welt"}']))).rejects.toBeInstanceOf(ArchiveError);
    await expect(decodeArchive(from([]))).rejects.toThrow(/Leeres Archiv/);
  });

  it('ein leerer Bucket ergibt ein gültiges Archiv', async () => {
    const lines = await collect(encodeArchive(memoryBucket().source, new Date()));
    await expect(decodeArchive(from(lines))).resolves.toEqual({ count: 0, bytes: 0 });
  });
});

describe('splitLines', () => {
  it('setzt Zeilen zusammen, die über Blockgrenzen gehen', async () => {
    const text = 'erste Zeile\nzweite, lange Zeile\ndritte ohne Umbruch';
    const bytes = new TextEncoder().encode(text);
    async function* chunks() {
      for (let i = 0; i < bytes.length; i += 3) yield bytes.subarray(i, i + 3);
    }
    await expect(collect(splitLines(chunks()))).resolves.toEqual([
      'erste Zeile',
      'zweite, lange Zeile',
      'dritte ohne Umbruch',
    ]);
  });

  it('trennt kein Umlaut-Zeichen, das auf zwei Blöcke fällt', async () => {
    const bytes = new TextEncoder().encode('Grüsse\n');
    async function* chunks() {
      yield bytes.subarray(0, 3);
      yield bytes.subarray(3);
    }
    await expect(collect(splitLines(chunks()))).resolves.toEqual(['Grüsse']);
  });
});
