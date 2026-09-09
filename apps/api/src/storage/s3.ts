import type { DocumentStorage, StoredObject } from './types.ts';

export interface S3Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Nutzt den in Bun eingebauten S3-Client statt eines zusätzlichen SDK.
 * Der Bucket ist privat: es entstehen keine öffentlichen URLs und keine
 * vorsignierten Links — jeder Download läuft über die autorisierte API.
 */
export function createS3Storage(config: S3Config): DocumentStorage {
  const client = new Bun.S3Client({
    endpoint: config.endpoint,
    region: config.region,
    bucket: config.bucket,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });

  return {
    async put(objectKey, bytes, contentType) {
      await client.write(objectKey, bytes, { type: contentType });
    },

    async get(objectKey): Promise<StoredObject | null> {
      const file = client.file(objectKey);
      if (!(await file.exists())) return null;
      return {
        bytes: new Uint8Array(await file.arrayBuffer()),
        contentType: file.type || 'application/octet-stream',
      };
    },

    async delete(objectKey) {
      await client.delete(objectKey);
    },
  };
}
