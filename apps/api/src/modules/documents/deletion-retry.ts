import { and, eq } from 'drizzle-orm';
import { documents, type Database } from '@tallyroom/db';
import type { Logger } from '../../lib/logger.ts';
import type { DocumentStorage } from '../../storage/types.ts';

/** Höchstens so viele je Lauf, damit ein grosser Rückstand keinen Lauf blockiert. */
const BATCH_SIZE = 100;
const INTERVAL_MS = 15 * 60 * 1000;

export interface RetryResult {
  attempted: number;
  deleted: number;
}

/**
 * Holt Löschungen nach, die am Objektspeicher gescheitert sind. Solche
 * Dokumente stehen auf pending_deletion: für jeden Zugriff schon weg, die
 * Datei lag aber noch im Speicher. Vorher blieb sie dort für immer.
 *
 * Erst die Datei, dann der Status. Scheitert die Datei wieder, bleibt der
 * Datensatz stehen und kommt beim nächsten Lauf erneut dran.
 */
export async function retryPendingDeletions(
  db: Database,
  storage: DocumentStorage,
  logger?: Logger,
): Promise<RetryResult> {
  const pending = await db
    .select({ id: documents.id, objectKey: documents.objectKey })
    .from(documents)
    .where(eq(documents.deletionStatus, 'pending_deletion'))
    .limit(BATCH_SIZE);

  let deleted = 0;
  for (const row of pending) {
    try {
      await storage.delete(row.objectKey);
      await db
        .update(documents)
        .set({ deletionStatus: 'deleted', updatedAt: new Date() })
        .where(and(eq(documents.id, row.id), eq(documents.deletionStatus, 'pending_deletion')));
      deleted += 1;
    } catch (error) {
      logger?.warn({ err: error, documentId: row.id }, 'Löschung weiterhin nicht möglich');
    }
  }

  if (pending.length > 0) {
    logger?.info({ attempted: pending.length, deleted }, 'Ausstehende Löschungen nachgeholt');
  }
  return { attempted: pending.length, deleted };
}

/** Läuft im API-Prozess, wie der Aufräumlauf der Demo. */
export function startDeletionRetry(
  db: Database,
  storage: DocumentStorage,
  logger: Logger,
): () => void {
  const run = () => {
    retryPendingDeletions(db, storage, logger).catch((error: unknown) => {
      logger.error({ err: error }, 'Wiederholungslauf für Löschungen fehlgeschlagen');
    });
  };
  const timer = setInterval(run, INTERVAL_MS);
  timer.unref();
  return () => clearInterval(timer);
}
