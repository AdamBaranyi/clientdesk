import { z } from 'zod';

/** Nur PDF, höchstens 10 MiB. Beides wird serverseitig geprüft. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOCUMENT_MIME = 'application/pdf';

export const DOCUMENT_DELETION_STATUS = ['active', 'pending_deletion', 'deleted'] as const;
export type DocumentDeletionStatus = (typeof DOCUMENT_DELETION_STATUS)[number];

export const documentSchema = z.object({
  id: z.uuid(),
  customerId: z.uuid(),
  customerName: z.string(),
  projectId: z.uuid().nullable(),
  projectName: z.string().nullable(),
  originalName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  /** Standardmässig aus. Erst eine bewusste Freigabe zeigt die Datei im Portal. */
  clientVisible: z.boolean(),
  deletionStatus: z.enum(DOCUMENT_DELETION_STATUS),
  uploadedByName: z.string().nullable(),
  createdAt: z.string(),
});

export type ClientDeskDocument = z.infer<typeof documentSchema>;

/**
 * Kundenansicht: kein Objektschlüssel, kein Freigabe-Flag, kein Hochladender,
 * kein Löschstatus. Was der Kunde sieht, ist bereits freigegeben — alles
 * andere hat in seiner Antwort nichts zu suchen.
 */
export const clientDocumentSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid().nullable(),
  projectName: z.string().nullable(),
  originalName: z.string(),
  sizeBytes: z.number().int(),
  createdAt: z.string(),
});

export type ClientDocument = z.infer<typeof clientDocumentSchema>;

export const documentListQuerySchema = z.object({
  customerId: z.uuid().optional(),
  projectId: z.uuid().optional(),
});

export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;

export const documentVisibilitySchema = z.object({ clientVisible: z.boolean() });
