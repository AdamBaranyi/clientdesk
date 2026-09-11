import type { S3Config } from '../storage/s3.ts';
import type { ObjectSink, ObjectSource } from './archive.ts';

/** Der Bucket als Quelle und Ziel einer Sicherung, über Buns eingebauten S3-Client. */
export function s3Objects(config: S3Config): ObjectSource & ObjectSink {
  const client = new Bun.S3Client({
    endpoint: config.endpoint,
    region: config.region,
    bucket: config.bucket,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });

  return {
    // Seitenweise, je höchstens 1000 Schlüssel. Weiter geht es hinter dem letzten.
    async *keys() {
      let startAfter: string | undefined;
      for (;;) {
        const page = await client.list(
          startAfter ? { maxKeys: 1000, startAfter } : { maxKeys: 1000 },
        );
        const contents = page.contents ?? [];
        for (const object of contents) yield object.key;
        const last = contents.at(-1);
        if (!page.isTruncated || !last) return;
        startAfter = last.key;
      }
    },

    async read(key) {
      const file = client.file(key);
      const [bytes, stat] = await Promise.all([file.arrayBuffer(), file.stat()]);
      return {
        bytes: new Uint8Array(bytes),
        contentType: stat.type || 'application/octet-stream',
      };
    },

    async write(entry) {
      await client.write(entry.key, entry.bytes, { type: entry.contentType });
    },
  };
}
