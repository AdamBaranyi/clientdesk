import { and, desc, eq, ne } from 'drizzle-orm';
import type { Database } from '@tallyroom/db';
import { customers, documents, projects, users } from '@tallyroom/db';

export function createDocumentRepository(db: Database) {
  const columns = {
    id: documents.id,
    customerId: documents.customerId,
    customerName: customers.name,
    projectId: documents.projectId,
    projectName: projects.name,
    objectKey: documents.objectKey,
    originalName: documents.originalName,
    mimeType: documents.mimeType,
    sizeBytes: documents.sizeBytes,
    clientVisible: documents.clientVisible,
    deletionStatus: documents.deletionStatus,
    uploadedByName: users.displayName,
    createdAt: documents.createdAt,
  };

  function base() {
    return db
      .select(columns)
      .from(documents)
      .innerJoin(customers, eq(customers.id, documents.customerId))
      .leftJoin(projects, eq(projects.id, documents.projectId))
      .leftJoin(users, eq(users.id, documents.uploadedBy));
  }

  return {
    /** Gelöschte Dokumente erscheinen in keiner Liste mehr. */
    async list(
      workspaceId: string,
      filters: { customerId?: string | undefined; projectId?: string | undefined },
    ) {
      const conditions = [
        eq(documents.workspaceId, workspaceId),
        ne(documents.deletionStatus, 'deleted'),
      ];
      if (filters.customerId) conditions.push(eq(documents.customerId, filters.customerId));
      if (filters.projectId) conditions.push(eq(documents.projectId, filters.projectId));

      return base()
        .where(and(...conditions))
        .orderBy(desc(documents.createdAt));
    },

    async findById(workspaceId: string, documentId: string) {
      const [row] = await base()
        .where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, documentId)))
        .limit(1);
      return row;
    },

    async customerExists(workspaceId: string, customerId: string) {
      const [row] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)))
        .limit(1);
      return Boolean(row);
    },

    async projectBelongsToCustomer(workspaceId: string, projectId: string, customerId: string) {
      const [row] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(
            eq(projects.workspaceId, workspaceId),
            eq(projects.id, projectId),
            eq(projects.customerId, customerId),
          ),
        )
        .limit(1);
      return Boolean(row);
    },
  };
}

export type DocumentRepository = ReturnType<typeof createDocumentRepository>;
