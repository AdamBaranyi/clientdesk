import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import type { Database } from '@clientdesk/db';
import {
  customers,
  documents,
  milestones,
  projects,
  requestComments,
  serviceContracts,
  serviceRequests,
  users,
} from '@clientdesk/db';

/**
 * Alle Abfragen dieser Schicht sind fest auf einen Workspace und einen Kunden
 * eingeschränkt und liefern nur freigegebene Inhalte. Es gibt hier keine
 * Abfrage ohne diese beiden Bedingungen — die Einschränkung ist nicht
 * optional und wird nicht vom Aufrufer mitgegeben.
 */
export function createPortalRepository(db: Database) {
  return {
    async customer(workspaceId: string, customerId: string) {
      const [row] = await db
        .select({ id: customers.id, name: customers.name })
        .from(customers)
        .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)))
        .limit(1);
      return row;
    },

    /** Nur freigegebene Projekte. Interne Notizen kommen gar nicht erst mit. */
    async projects(workspaceId: string, customerId: string) {
      return db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status,
          startDate: projects.startDate,
          targetDate: projects.targetDate,
          milestoneCount: db.$count(milestones, eq(milestones.projectId, projects.id)),
          milestonesDone: db.$count(
            milestones,
            and(eq(milestones.projectId, projects.id), eq(milestones.status, 'done')),
          ),
        })
        .from(projects)
        .where(
          and(
            eq(projects.workspaceId, workspaceId),
            eq(projects.customerId, customerId),
            eq(projects.clientVisible, true),
            ne(projects.status, 'archived'),
          ),
        )
        .orderBy(asc(projects.name));
    },

    async nextMilestones(workspaceId: string, projectIds: string[]) {
      if (projectIds.length === 0) return [];
      return db
        .select({
          projectId: milestones.projectId,
          title: milestones.title,
          dueDate: milestones.dueDate,
        })
        .from(milestones)
        .where(
          and(
            eq(milestones.workspaceId, workspaceId),
            inArray(milestones.projectId, projectIds),
            eq(milestones.status, 'open'),
          ),
        )
        .orderBy(asc(milestones.dueDate), asc(milestones.sortOrder));
    },

    /** Nur freigegebene und bestätigte Verträge. */
    async contracts(workspaceId: string, customerId: string, onDate: string) {
      return db
        .select({
          id: serviceContracts.id,
          name: serviceContracts.name,
          publicDescription: serviceContracts.publicDescription,
          startDate: serviceContracts.startDate,
          endDate: serviceContracts.endDate,
          monthlyAmountMinor: sql<number | null>`(
            SELECT r.monthly_amount_minor
            FROM contract_rates AS r
            WHERE r.contract_id = "service_contracts"."id"
              AND r.effective_from <= ${onDate}::date
            ORDER BY r.effective_from DESC
            LIMIT 1
          )`,
        })
        .from(serviceContracts)
        .where(
          and(
            eq(serviceContracts.workspaceId, workspaceId),
            eq(serviceContracts.customerId, customerId),
            eq(serviceContracts.clientVisible, true),
            eq(serviceContracts.confirmationStatus, 'confirmed'),
          ),
        )
        .orderBy(asc(serviceContracts.name));
    },

    async requests(workspaceId: string, customerId: string) {
      return db
        .select({
          id: serviceRequests.id,
          projectId: serviceRequests.projectId,
          projectName: projects.name,
          subject: serviceRequests.subject,
          body: serviceRequests.body,
          status: serviceRequests.status,
          createdAt: serviceRequests.createdAt,
          updatedAt: serviceRequests.updatedAt,
        })
        .from(serviceRequests)
        .leftJoin(projects, eq(projects.id, serviceRequests.projectId))
        .where(
          and(
            eq(serviceRequests.workspaceId, workspaceId),
            eq(serviceRequests.customerId, customerId),
          ),
        )
        .orderBy(desc(serviceRequests.updatedAt));
    },

    async request(workspaceId: string, customerId: string, requestId: string) {
      const [row] = await db
        .select({
          id: serviceRequests.id,
          projectId: serviceRequests.projectId,
          projectName: projects.name,
          subject: serviceRequests.subject,
          body: serviceRequests.body,
          status: serviceRequests.status,
          version: serviceRequests.version,
          createdAt: serviceRequests.createdAt,
          updatedAt: serviceRequests.updatedAt,
        })
        .from(serviceRequests)
        .leftJoin(projects, eq(projects.id, serviceRequests.projectId))
        .where(
          and(
            eq(serviceRequests.workspaceId, workspaceId),
            eq(serviceRequests.customerId, customerId),
            eq(serviceRequests.id, requestId),
          ),
        )
        .limit(1);
      return row;
    },

    /** Ausschliesslich öffentliche Kommentare — die Bedingung steht im SQL. */
    async publicComments(workspaceId: string, requestId: string) {
      return db
        .select({
          id: requestComments.id,
          authorName: users.displayName,
          body: requestComments.body,
          createdAt: requestComments.createdAt,
        })
        .from(requestComments)
        .leftJoin(users, eq(users.id, requestComments.authorId))
        .where(
          and(
            eq(requestComments.workspaceId, workspaceId),
            eq(requestComments.requestId, requestId),
            eq(requestComments.visibility, 'public'),
          ),
        )
        .orderBy(asc(requestComments.createdAt));
    },

    /** Nur freigegebene, nicht gelöschte Dokumente. */
    async documents(workspaceId: string, customerId: string) {
      return db
        .select({
          id: documents.id,
          projectId: documents.projectId,
          projectName: projects.name,
          objectKey: documents.objectKey,
          originalName: documents.originalName,
          sizeBytes: documents.sizeBytes,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .leftJoin(projects, eq(projects.id, documents.projectId))
        .where(
          and(
            eq(documents.workspaceId, workspaceId),
            eq(documents.customerId, customerId),
            eq(documents.clientVisible, true),
            eq(documents.deletionStatus, 'active'),
          ),
        )
        .orderBy(desc(documents.createdAt));
    },

    /** Projekte, die dieser Kunde einer neuen Anfrage zuordnen darf. */
    async assignableProjects(workspaceId: string, customerId: string) {
      return db
        .select({ id: projects.id, name: projects.name })
        .from(projects)
        .where(
          and(
            eq(projects.workspaceId, workspaceId),
            eq(projects.customerId, customerId),
            eq(projects.clientVisible, true),
          ),
        )
        .orderBy(asc(projects.name));
    },
  };
}

export type PortalRepository = ReturnType<typeof createPortalRepository>;
