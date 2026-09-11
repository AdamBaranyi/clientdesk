import { randomBytes, randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { documents, type Database } from '@tallyroom/db';
import {
  ALLOWED_DOCUMENT_MIME,
  type TallyroomDocument,
  type DocumentListQuery,
} from '@tallyroom/contracts';
import { HttpError, notFound, validationFailed } from '../../lib/http-error.ts';
import { recordActivity } from '../../lib/activity.ts';
import type { DocumentStorage } from '../../storage/types.ts';
import type { DemoLimits } from '../demo/limits.ts';
import { makeSimplePdf } from '@tallyroom/db/seed';
import { assertAcceptablePdf, sanitizeFileName } from './pdf.ts';
import type { DocumentRepository } from './repository.ts';

interface Row {
  id: string;
  customerId: string;
  customerName: string;
  projectId: string | null;
  projectName: string | null;
  objectKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  clientVisible: boolean;
  deletionStatus: 'active' | 'pending_deletion' | 'deleted';
  uploadedByName: string | null;
  createdAt: Date;
}

function toDto(row: Row): TallyroomDocument {
  // objectKey verlässt den Server nicht — er ist ein Speicherdetail.
  const { objectKey: _objectKey, ...rest } = row;
  return { ...rest, createdAt: row.createdAt.toISOString() };
}

/**
 * Zufälliger Objektschlüssel, nie aus dem Dateinamen abgeleitet. Wer den
 * Namen kennt, kann daraus keinen Speicherort erraten.
 */
function newObjectKey(workspaceId: string): string {
  return `${workspaceId}/${randomUUID()}-${randomBytes(8).toString('hex')}.pdf`;
}

export interface UploadInput {
  customerId: string;
  projectId?: string | undefined;
  fileName: string;
  contentType: string | undefined;
  bytes: Uint8Array;
}

export function createDocumentService(
  db: Database,
  repository: DocumentRepository,
  storage: DocumentStorage,
  demoLimits: DemoLimits,
) {
  /**
   * Nur aktive Dokumente sind erreichbar. Steht eines auf pending_deletion,
   * ist es für jeden Zugriff bereits weg — auch wenn das Löschen im Speicher
   * noch aussteht. Andernfalls bliebe eine gelöschte Datei abrufbar, solange
   * der Objektspeicher klemmt.
   */
  async function require(workspaceId: string, documentId: string): Promise<Row> {
    const row = await repository.findById(workspaceId, documentId);
    if (!row || row.deletionStatus !== 'active')
      throw notFound({ de: 'Dokument nicht gefunden.', en: 'Document not found.' });
    return row as Row;
  }

  return {
    async list(workspaceId: string, query: DocumentListQuery): Promise<TallyroomDocument[]> {
      const rows = await repository.list(workspaceId, query);
      return (rows as Row[]).map(toDto);
    },

    async get(workspaceId: string, documentId: string): Promise<TallyroomDocument> {
      return toDto(await require(workspaceId, documentId));
    },

    async upload(
      workspaceId: string,
      actorId: string,
      input: UploadInput,
    ): Promise<TallyroomDocument> {
      await demoLimits.assertUploadAllowed(workspaceId);
      assertAcceptablePdf(input.bytes, input.contentType);

      if (!(await repository.customerExists(workspaceId, input.customerId))) {
        throw validationFailed(
          {
            de: 'Kunde gehört nicht zu diesem Workspace.',
            en: 'This customer does not belong to this workspace.',
          },
          {
            customerId: [{ de: 'Unbekannter Kunde', en: 'Unknown customer' }],
          },
        );
      }
      if (input.projectId) {
        const matches = await repository.projectBelongsToCustomer(
          workspaceId,
          input.projectId,
          input.customerId,
        );
        if (!matches) {
          throw validationFailed(
            {
              de: 'Das Projekt gehört nicht zu diesem Kunden.',
              en: 'This project does not belong to this customer.',
            },
            {
              projectId: [
                { de: 'Projekt passt nicht zum Kunden', en: 'Project does not match the customer' },
              ],
            },
          );
        }
      }

      const objectKey = newObjectKey(workspaceId);
      // Erst in den Speicher, dann in die Datenbank: ein Datensatz ohne Datei
      // wäre eine Zeile, die nichts liefert.
      await storage.put(objectKey, input.bytes, ALLOWED_DOCUMENT_MIME);

      const id = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(documents)
          .values({
            workspaceId,
            customerId: input.customerId,
            projectId: input.projectId ?? null,
            uploadedBy: actorId,
            objectKey,
            originalName: sanitizeFileName(input.fileName),
            mimeType: ALLOWED_DOCUMENT_MIME,
            sizeBytes: input.bytes.length,
            // Standardmässig intern. Freigabe ist eine eigene Handlung.
            clientVisible: false,
          })
          .returning({ id: documents.id, originalName: documents.originalName });

        if (!created)
          throw new HttpError('INTERNAL', {
            de: 'Dokument konnte nicht angelegt werden.',
            en: 'The document could not be created.',
          });

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'document.uploaded',
          entityType: 'document',
          entityId: created.id,
          metadata: { originalName: created.originalName, customerId: input.customerId },
        });
        return created.id;
      });

      return this.get(workspaceId, id);
    },

    /**
     * Das enthaltene Beispieldokument. Es ist der einzige Weg, in einer Demo
     * eine Datei anzulegen — hochgeladen wird dabei nichts.
     */
    async addSample(
      workspaceId: string,
      actorId: string,
      customerId: string,
    ): Promise<TallyroomDocument> {
      if (!(await repository.customerExists(workspaceId, customerId))) {
        throw validationFailed(
          {
            de: 'Kunde gehört nicht zu diesem Workspace.',
            en: 'This customer does not belong to this workspace.',
          },
          {
            customerId: [{ de: 'Unbekannter Kunde', en: 'Unknown customer' }],
          },
        );
      }

      const bytes = makeSimplePdf('Beispieldokument — erfundener Inhalt zu Vorführzwecken');
      const objectKey = newObjectKey(workspaceId);
      await storage.put(objectKey, bytes, ALLOWED_DOCUMENT_MIME);

      const id = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(documents)
          .values({
            workspaceId,
            customerId,
            uploadedBy: actorId,
            objectKey,
            originalName: 'Beispieldokument.pdf',
            mimeType: ALLOWED_DOCUMENT_MIME,
            sizeBytes: bytes.length,
            clientVisible: false,
          })
          .returning({ id: documents.id });
        if (!created)
          throw new HttpError('INTERNAL', {
            de: 'Dokument konnte nicht angelegt werden.',
            en: 'The document could not be created.',
          });

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'document.uploaded',
          entityType: 'document',
          entityId: created.id,
          metadata: { originalName: 'Beispieldokument.pdf', customerId },
        });
        return created.id;
      });

      return this.get(workspaceId, id);
    },

    /** Liefert die Bytes erst nach bestätigter Berechtigung. */
    async read(workspaceId: string, documentId: string) {
      const row = await require(workspaceId, documentId);
      const object = await storage.get(row.objectKey);
      if (!object)
        throw notFound({
          de: 'Die Datei ist im Speicher nicht mehr vorhanden.',
          en: 'The file is no longer in storage.',
        });
      return { document: toDto(row), bytes: object.bytes };
    },

    async setVisibility(
      workspaceId: string,
      actorId: string,
      documentId: string,
      clientVisible: boolean,
    ): Promise<TallyroomDocument> {
      await require(workspaceId, documentId);

      await db.transaction(async (tx) => {
        await tx
          .update(documents)
          .set({ clientVisible, updatedAt: new Date() })
          .where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, documentId)));

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'document.visibility_changed',
          entityType: 'document',
          entityId: documentId,
          metadata: { clientVisible },
        });
      });

      return this.get(workspaceId, documentId);
    },

    /**
     * Löschen nimmt die Sichtbarkeit sofort — noch bevor der Speicher
     * angefragt wird. Schlägt das Löschen dort fehl, bleibt der Datensatz auf
     * pending_deletion stehen: sichtbar für einen Wiederholungslauf, aber für
     * niemanden mehr abrufbar.
     */
    async remove(workspaceId: string, actorId: string, documentId: string): Promise<void> {
      const row = await require(workspaceId, documentId);

      await db.transaction(async (tx) => {
        await tx
          .update(documents)
          .set({ deletionStatus: 'pending_deletion', clientVisible: false, updatedAt: new Date() })
          .where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, documentId)));

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'document.deleted',
          entityType: 'document',
          entityId: documentId,
          metadata: { originalName: row.originalName },
        });
      });

      try {
        await storage.delete(row.objectKey);
      } catch {
        // Bleibt auf pending_deletion. Kein Fehler nach aussen: für den
        // Aufrufer ist das Dokument weg, und der Rest ist Aufräumarbeit.
        return;
      }

      await db
        .update(documents)
        .set({ deletionStatus: 'deleted', updatedAt: new Date() })
        .where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, documentId)));
    },
  };
}

export type DocumentService = ReturnType<typeof createDocumentService>;
