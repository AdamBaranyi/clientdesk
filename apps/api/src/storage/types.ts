/**
 * Speicher-Schnittstelle für Dokumente. Die Anwendung kennt nur diese
 * Schnittstelle, nicht S3 — dadurch laufen die Tests ohne laufenden
 * Objektspeicher, und ein Wechsel des Anbieters bleibt eine Datei.
 */
export interface StoredObject {
  bytes: Uint8Array;
  contentType: string;
}

export interface DocumentStorage {
  put: (objectKey: string, bytes: Uint8Array, contentType: string) => Promise<void>;
  get: (objectKey: string) => Promise<StoredObject | null>;
  delete: (objectKey: string) => Promise<void>;
}
