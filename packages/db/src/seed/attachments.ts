import { randomUUID } from 'node:crypto';
import type { Transaction } from '../client.ts';
import { documents } from '../schema/documents.ts';
import { requestComments, serviceRequests } from '../schema/service-requests.ts';
import { makeSimplePdf } from './pdf.ts';
import { SEED_DOCUMENTS, SEED_REQUESTS } from './request-data.ts';

export interface SeedStorage {
  put: (objectKey: string, bytes: Uint8Array, contentType: string) => Promise<void>;
}

export async function insertRequests(
  tx: Transaction,
  workspaceId: string,
  teamUserId: string,
  clientUserIds: Map<string, string>,
  customerIds: Map<string, string>,
): Promise<number> {
  let count = 0;
  for (const seed of SEED_REQUESTS) {
    const customerId = customerIds.get(seed.customerName);
    if (!customerId) throw new Error(`Kunde ${seed.customerName} fehlt für die Anfrage.`);
    const clientUserId = clientUserIds.get(seed.customerName);

    const [request] = await tx
      .insert(serviceRequests)
      .values({
        workspaceId,
        customerId,
        createdBy: clientUserId ?? teamUserId,
        assignedTo: seed.assigned ? teamUserId : null,
        subject: seed.subject,
        body: seed.body,
        priority: seed.priority,
        status: seed.status,
      })
      .returning({ id: serviceRequests.id });

    if (!request) throw new Error(`Anfrage ${seed.subject} konnte nicht angelegt werden.`);

    for (const comment of seed.comments) {
      await tx.insert(requestComments).values({
        workspaceId,
        requestId: request.id,
        authorId: comment.fromTeam ? teamUserId : (clientUserId ?? teamUserId),
        visibility: comment.visibility,
        body: comment.body,
      });
    }
    count += 1;
  }
  return count;
}

/**
 * Legt die Dateien im Objektspeicher ab und schreibt danach die Metadaten.
 * Ein Datensatz ohne Datei wäre eine Zeile, die nichts liefert.
 */
export async function insertDocuments(
  tx: Transaction,
  workspaceId: string,
  teamUserId: string,
  customerIds: Map<string, string>,
  storage: SeedStorage,
): Promise<number> {
  let count = 0;
  for (const seed of SEED_DOCUMENTS) {
    const customerId = customerIds.get(seed.customerName);
    if (!customerId) throw new Error(`Kunde ${seed.customerName} fehlt für das Dokument.`);

    const bytes = makeSimplePdf(seed.title);
    const objectKey = `${workspaceId}/${randomUUID()}.pdf`;
    await storage.put(objectKey, bytes, 'application/pdf');

    await tx.insert(documents).values({
      workspaceId,
      customerId,
      uploadedBy: teamUserId,
      objectKey,
      originalName: seed.fileName,
      mimeType: 'application/pdf',
      sizeBytes: bytes.length,
      clientVisible: seed.clientVisible,
    });
    count += 1;
  }
  return count;
}
