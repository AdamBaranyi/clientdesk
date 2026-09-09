import { inArray, sql } from 'drizzle-orm';
import { sessions, users, workspaces, type Database } from '@clientdesk/db';
import type { Logger } from '../../lib/logger.ts';
import type { DocumentStorage } from '../../storage/types.ts';
import type { DemoRepository } from './repository.ts';

export interface CleanupResult {
  workspaces: number;
  documents: number;
  users: number;
}

/**
 * Entfernt abgelaufene Demos vollständig: Daten, Sitzungen und die Dateien im
 * Objektspeicher. Ein Workspace, dessen Zeilen verschwinden, aber dessen
 * Dateien liegen bleiben, wäre kein Aufräumen, sondern ein Leck.
 */
export async function cleanupExpiredDemos(
  db: Database,
  repository: DemoRepository,
  storage: DocumentStorage,
  logger?: Logger,
): Promise<CleanupResult> {
  const expired = await repository.expiredDemos();
  if (expired.length === 0) return { workspaces: 0, documents: 0, users: 0 };

  let removedDocuments = 0;
  let removedUsers = 0;

  for (const workspace of expired) {
    const [objectKeys, userIds] = await Promise.all([
      repository.documentKeys(workspace.id),
      repository.memberUserIds(workspace.id),
    ]);

    for (const objectKey of objectKeys) {
      try {
        await storage.delete(objectKey);
        removedDocuments += 1;
      } catch (error) {
        // Eine nicht löschbare Datei darf den Rest nicht aufhalten.
        logger?.warn({ err: error, objectKey }, 'Demo-Datei konnte nicht gelöscht werden');
      }
    }

    await db.transaction(async (tx) => {
      // Sitzungen zuerst: sonst bliebe ein Cookie gültig, dessen Konto es
      // gleich nicht mehr gibt.
      if (userIds.length > 0) {
        // inArray statt ANY: Drizzle bindet eine JS-Liste als einzelne
        // Parameter, nicht als Postgres-Array — ANY erwartet aber ein Array.
        await tx.delete(sessions).where(inArray(sql`${sessions.sess}->>'userId'`, userIds));
      }
      // Die Kindtabellen hängen über ON DELETE CASCADE am Workspace.
      await tx.delete(workspaces).where(inArray(workspaces.id, [workspace.id]));
      if (userIds.length > 0) {
        const deleted = await tx
          .delete(users)
          .where(inArray(users.id, userIds))
          .returning({ id: users.id });
        removedUsers += deleted.length;
      }
    });
  }

  logger?.info(
    { workspaces: expired.length, documents: removedDocuments, users: removedUsers },
    'Abgelaufene Demos entfernt',
  );
  return { workspaces: expired.length, documents: removedDocuments, users: removedUsers };
}

/**
 * Startet den wiederkehrenden Lauf. unref, damit ein Herunterfahren nicht auf
 * den nächsten Durchlauf wartet.
 */
export function startDemoCleanup(
  db: Database,
  repository: DemoRepository,
  storage: DocumentStorage,
  logger: Logger,
  intervalMs = 5 * 60 * 1000,
): () => void {
  const run = () => {
    void cleanupExpiredDemos(db, repository, storage, logger).catch((error: unknown) => {
      logger.error({ err: error }, 'Demo-Aufräumlauf fehlgeschlagen');
    });
  };

  const timer = setInterval(run, intervalMs);
  timer.unref();
  run();
  return () => clearInterval(timer);
}
