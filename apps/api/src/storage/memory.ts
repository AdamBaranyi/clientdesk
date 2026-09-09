import type { DocumentStorage, StoredObject } from './types.ts';

/**
 * Speicher im Prozess, ausschliesslich für Tests. Er verhält sich wie der
 * echte Speicher, damit die Tests die Regeln prüfen und nicht die Anbindung.
 */
export function createMemoryStorage(): DocumentStorage & { size: () => number; clear: () => void } {
  const objects = new Map<string, StoredObject>();

  return {
    async put(objectKey, bytes, contentType) {
      objects.set(objectKey, { bytes: new Uint8Array(bytes), contentType });
    },
    async get(objectKey) {
      return objects.get(objectKey) ?? null;
    },
    async delete(objectKey) {
      objects.delete(objectKey);
    },
    size: () => objects.size,
    clear: () => objects.clear(),
  };
}
