import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { idempotencyKeys, type Executor } from '@tallyroom/db';
import { HttpError } from './http-error.ts';

/** Ein Schlüssel gilt einen Tag; danach ist derselbe Wert wieder frei. */
const TTL_MS = 24 * 60 * 60 * 1000;

export function hashRequest(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export interface IdempotencyScope {
  workspaceId: string;
  userId: string;
  operation: string;
  key: string;
  requestHash: string;
}

/**
 * Sucht einen bereits verwendeten Schlüssel.
 *
 * Gleicher Schlüssel und gleicher Inhalt: der frühere Datensatz wird
 * zurückgegeben, es entsteht nichts Zweites — das ist der Doppelklick.
 * Gleicher Schlüssel, anderer Inhalt: das ist kein Wiederholungsversuch,
 * sondern ein Konflikt, und wird als solcher gemeldet.
 */
export async function findExistingResult(
  executor: Executor,
  scope: IdempotencyScope,
): Promise<string | null> {
  const [existing] = await executor
    .select({
      requestHash: idempotencyKeys.requestHash,
      resultReference: idempotencyKeys.resultReference,
      expiresAt: idempotencyKeys.expiresAt,
    })
    .from(idempotencyKeys)
    .where(
      and(
        eq(idempotencyKeys.workspaceId, scope.workspaceId),
        eq(idempotencyKeys.userId, scope.userId),
        eq(idempotencyKeys.operation, scope.operation),
        eq(idempotencyKeys.key, scope.key),
      ),
    )
    .limit(1);

  if (!existing) return null;
  if (existing.expiresAt.getTime() < Date.now()) return null;

  if (existing.requestHash !== scope.requestHash) {
    throw new HttpError(
      'IDEMPOTENCY_CONFLICT',
      'Derselbe Idempotency-Key wurde bereits mit anderem Inhalt verwendet.',
    );
  }
  return existing.resultReference;
}

export async function recordResult(
  executor: Executor,
  scope: IdempotencyScope,
  resultReference: string,
): Promise<void> {
  await executor.insert(idempotencyKeys).values({
    workspaceId: scope.workspaceId,
    userId: scope.userId,
    operation: scope.operation,
    key: scope.key,
    requestHash: scope.requestHash,
    resultReference,
    expiresAt: new Date(Date.now() + TTL_MS),
  });
}
