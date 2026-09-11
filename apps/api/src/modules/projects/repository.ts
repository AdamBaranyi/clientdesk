import { and, asc, count, desc, eq, ilike, isNotNull, lt, or, sql } from 'drizzle-orm';
import type { Database } from '@tallyroom/db';
import { customers, milestones, projects, users } from '@tallyroom/db';
import type { ProjectListQuery } from '@tallyroom/contracts';

/**
 * Meilensteinzahlen kommen aus Unterabfragen. Ein Join auf milestones würde
 * jedes Projekt je Meilenstein vervielfachen und alle Zählungen verfälschen.
 *
 * db.$count statt eines sql-Templates: in einem rohen Template rendert Drizzle
 * Spalten je nach Abfrageform unqualifiziert, und `WHERE project_id = id`
 * bindet dann beide Namen an die innere Tabelle. Das Ergebnis wäre still null.
 */
export function createProjectRepository(db: Database) {
  const milestoneCount = () => db.$count(milestones, eq(milestones.projectId, projects.id));

  const milestonesDone = () =>
    db.$count(
      milestones,
      and(eq(milestones.projectId, projects.id), eq(milestones.status, 'done')),
    );

  const overdueMilestones = (today: string) =>
    db.$count(
      milestones,
      and(
        eq(milestones.projectId, projects.id),
        eq(milestones.status, 'open'),
        isNotNull(milestones.dueDate),
        lt(milestones.dueDate, today),
      ),
    );

  function columns(today: string) {
    return {
      id: projects.id,
      customerId: projects.customerId,
      customerName: customers.name,
      name: projects.name,
      description: projects.description,
      internalNote: projects.internalNote,
      ownerUserId: projects.ownerUserId,
      ownerName: users.displayName,
      status: projects.status,
      startDate: projects.startDate,
      targetDate: projects.targetDate,
      clientVisible: projects.clientVisible,
      version: projects.version,
      milestoneCount: milestoneCount(),
      milestonesDone: milestonesDone(),
      overdueMilestones: overdueMilestones(today),
    };
  }

  function base(today: string) {
    return db
      .select(columns(today))
      .from(projects)
      .innerJoin(customers, eq(customers.id, projects.customerId))
      .leftJoin(users, eq(users.id, projects.ownerUserId));
  }

  function scope(workspaceId: string, query: ProjectListQuery) {
    const filters = [eq(projects.workspaceId, workspaceId)];
    if (query.customerId) filters.push(eq(projects.customerId, query.customerId));
    if (query.status) filters.push(eq(projects.status, query.status));
    if (query.search) {
      const pattern = `%${query.search}%`;
      const match = or(ilike(projects.name, pattern), ilike(customers.name, pattern));
      if (match) filters.push(match);
    }
    return and(...filters);
  }

  function orderBy(query: ProjectListQuery) {
    const direction = query.direction === 'desc' ? desc : asc;
    const column =
      query.sort === 'targetDate'
        ? projects.targetDate
        : query.sort === 'status'
          ? projects.status
          : query.sort === 'customerName'
            ? customers.name
            : projects.name;
    return [direction(column), asc(projects.id)];
  }

  return {
    async list(
      workspaceId: string,
      query: ProjectListQuery,
      page: { offset: number; limit: number },
      today: string,
    ) {
      const where = scope(workspaceId, query);
      const [rows, [total]] = await Promise.all([
        base(today)
          .where(where)
          .orderBy(...orderBy(query))
          .limit(page.limit)
          .offset(page.offset),
        db
          .select({ value: count() })
          .from(projects)
          .innerJoin(customers, eq(customers.id, projects.customerId))
          .where(where),
      ]);
      return { rows, total: total?.value ?? 0 };
    },

    async findById(workspaceId: string, projectId: string, today: string) {
      const [row] = await base(today)
        .where(and(eq(projects.workspaceId, workspaceId), eq(projects.id, projectId)))
        .limit(1);
      return row;
    },

    /** Bestätigt, dass der Kunde im selben Workspace liegt und nicht archiviert ist. */
    async findAssignableCustomer(workspaceId: string, customerId: string) {
      const [row] = await db
        .select({ id: customers.id, archivedAt: customers.archivedAt })
        .from(customers)
        .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)))
        .limit(1);
      return row;
    },

    async listMilestones(workspaceId: string, projectId: string) {
      return db
        .select({
          id: milestones.id,
          projectId: milestones.projectId,
          title: milestones.title,
          description: milestones.description,
          dueDate: milestones.dueDate,
          status: milestones.status,
          sortOrder: milestones.sortOrder,
        })
        .from(milestones)
        .where(and(eq(milestones.workspaceId, workspaceId), eq(milestones.projectId, projectId)))
        .orderBy(asc(milestones.sortOrder), asc(milestones.id));
    },

    async findMilestone(workspaceId: string, milestoneId: string) {
      const [row] = await db
        .select({
          id: milestones.id,
          projectId: milestones.projectId,
          title: milestones.title,
          status: milestones.status,
          sortOrder: milestones.sortOrder,
        })
        .from(milestones)
        .where(and(eq(milestones.workspaceId, workspaceId), eq(milestones.id, milestoneId)))
        .limit(1);
      return row;
    },

    async openMilestoneCount(workspaceId: string, projectId: string): Promise<number> {
      const [row] = await db
        .select({ value: count() })
        .from(milestones)
        .where(
          and(
            eq(milestones.workspaceId, workspaceId),
            eq(milestones.projectId, projectId),
            eq(milestones.status, 'open'),
          ),
        );
      return row?.value ?? 0;
    },

    async nextSortOrder(workspaceId: string, projectId: string): Promise<number> {
      const [row] = await db
        .select({ value: sql<number>`COALESCE(MAX(${milestones.sortOrder}), -1)::int` })
        .from(milestones)
        .where(and(eq(milestones.workspaceId, workspaceId), eq(milestones.projectId, projectId)));
      return (row?.value ?? -1) + 1;
    },
  };
}

export type ProjectRepository = ReturnType<typeof createProjectRepository>;
