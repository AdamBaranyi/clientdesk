import { alias } from 'drizzle-orm/pg-core';
import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import type { Database } from '@tallyroom/db';
import { customers, projects, requestComments, serviceRequests, users } from '@tallyroom/db';
import type { RequestListQuery } from '@tallyroom/contracts';

const assignee = alias(users, 'assignee');
const author = alias(users, 'author');

export function createRequestRepository(db: Database) {
  const columns = {
    id: serviceRequests.id,
    customerId: serviceRequests.customerId,
    customerName: customers.name,
    projectId: serviceRequests.projectId,
    projectName: projects.name,
    subject: serviceRequests.subject,
    body: serviceRequests.body,
    priority: serviceRequests.priority,
    status: serviceRequests.status,
    assignedTo: serviceRequests.assignedTo,
    assignedToName: assignee.displayName,
    createdByName: author.displayName,
    version: serviceRequests.version,
    createdAt: serviceRequests.createdAt,
    updatedAt: serviceRequests.updatedAt,
    commentCount: db.$count(requestComments, eq(requestComments.requestId, serviceRequests.id)),
  };

  function base() {
    return db
      .select(columns)
      .from(serviceRequests)
      .innerJoin(customers, eq(customers.id, serviceRequests.customerId))
      .leftJoin(projects, eq(projects.id, serviceRequests.projectId))
      .leftJoin(assignee, eq(assignee.id, serviceRequests.assignedTo))
      .leftJoin(author, eq(author.id, serviceRequests.createdBy));
  }

  function scope(workspaceId: string, query: RequestListQuery) {
    const filters = [eq(serviceRequests.workspaceId, workspaceId)];
    if (query.customerId) filters.push(eq(serviceRequests.customerId, query.customerId));
    if (query.status) filters.push(eq(serviceRequests.status, query.status));
    if (query.priority) filters.push(eq(serviceRequests.priority, query.priority));
    if (query.search) {
      const pattern = `%${query.search}%`;
      const match = or(ilike(serviceRequests.subject, pattern), ilike(customers.name, pattern));
      if (match) filters.push(match);
    }
    return and(...filters);
  }

  function orderBy(query: RequestListQuery) {
    const direction = query.direction === 'desc' ? desc : asc;
    const column =
      query.sort === 'createdAt'
        ? serviceRequests.createdAt
        : query.sort === 'subject'
          ? serviceRequests.subject
          : serviceRequests.updatedAt;
    return [direction(column), asc(serviceRequests.id)];
  }

  return {
    async list(
      workspaceId: string,
      query: RequestListQuery,
      page: { offset: number; limit: number },
    ) {
      const where = scope(workspaceId, query);
      const [rows, [total]] = await Promise.all([
        base()
          .where(where)
          .orderBy(...orderBy(query))
          .limit(page.limit)
          .offset(page.offset),
        db
          .select({ value: count() })
          .from(serviceRequests)
          .innerJoin(customers, eq(customers.id, serviceRequests.customerId))
          .where(where),
      ]);
      return { rows, total: total?.value ?? 0 };
    },

    async findById(workspaceId: string, requestId: string) {
      const [row] = await base()
        .where(and(eq(serviceRequests.workspaceId, workspaceId), eq(serviceRequests.id, requestId)))
        .limit(1);
      return row;
    },

    /**
     * Kommentare einer Anfrage. Der Aufrufer entscheidet, ob nur öffentliche
     * geliefert werden — die Einschränkung gehört in die Abfrage, nicht ins
     * Ausblenden nach dem Laden.
     */
    async listComments(workspaceId: string, requestId: string, onlyPublic: boolean) {
      const filters = [
        eq(requestComments.workspaceId, workspaceId),
        eq(requestComments.requestId, requestId),
      ];
      if (onlyPublic) filters.push(eq(requestComments.visibility, 'public'));

      return db
        .select({
          id: requestComments.id,
          authorName: users.displayName,
          visibility: requestComments.visibility,
          body: requestComments.body,
          createdAt: requestComments.createdAt,
        })
        .from(requestComments)
        .leftJoin(users, eq(users.id, requestComments.authorId))
        .where(and(...filters))
        .orderBy(asc(requestComments.createdAt));
    },

    /** Prüft, dass ein zugeordnetes Projekt zum selben Kunden gehört. */
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

    async customerExists(workspaceId: string, customerId: string) {
      const [row] = await db
        .select({ id: customers.id, archivedAt: customers.archivedAt })
        .from(customers)
        .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)))
        .limit(1);
      return row;
    },
  };
}

export type RequestRepository = ReturnType<typeof createRequestRepository>;
