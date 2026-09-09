import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import type { Database } from '@clientdesk/db';
import { customers, projects, serviceContracts, serviceRequests } from '@clientdesk/db';
import type { CustomerListQuery } from '@clientdesk/contracts';
import { RUNNING_PROJECT_STATUS } from '@clientdesk/contracts';

/**
 * Unterabfrage statt Join: ein Join auf Projekte würde jeden Kunden je Projekt
 * vervielfachen und die Zählung verfälschen.
 *
 * Bewusst über db.$count und nicht über ein sql-Template: in einem rohen
 * Template rendert Drizzle Spalten unqualifiziert. `WHERE customer_id = id`
 * bindet dann beide Namen an die innere Tabelle, die Bedingung ist nie wahr
 * und die Abfrage liefert stillschweigend überall null.
 */
function activeProjectCount(db: Database) {
  return db.$count(
    projects,
    and(eq(projects.customerId, customers.id), eq(projects.status, 'active')),
  );
}

const COLUMNS = {
  id: customers.id,
  name: customers.name,
  contactName: customers.contactName,
  email: customers.email,
  phone: customers.phone,
  website: customers.website,
  internalNote: customers.internalNote,
  archivedAt: customers.archivedAt,
  version: customers.version,
  createdAt: customers.createdAt,
};

export function createCustomerRepository(db: Database) {
  const columns = { ...COLUMNS, activeProjectCount: activeProjectCount(db) };

  function scope(workspaceId: string, query: CustomerListQuery) {
    const filters = [eq(customers.workspaceId, workspaceId)];

    if (query.status === 'active') filters.push(isNull(customers.archivedAt));
    if (query.status === 'archived') filters.push(isNotNull(customers.archivedAt));

    if (query.search) {
      const pattern = `%${query.search}%`;
      const match = or(
        ilike(customers.name, pattern),
        ilike(customers.contactName, pattern),
        ilike(customers.email, pattern),
      );
      if (match) filters.push(match);
    }
    return and(...filters);
  }

  /** Nur erlaubte Sortierfelder, zweite Sortierung nach ID für stabile Seiten. */
  function orderBy(query: CustomerListQuery) {
    const direction = query.direction === 'desc' ? desc : asc;
    const column =
      query.sort === 'createdAt'
        ? customers.createdAt
        : query.sort === 'activeProjectCount'
          ? activeProjectCount(db)
          : customers.name;
    return [direction(column), asc(customers.id)];
  }

  return {
    async list(
      workspaceId: string,
      query: CustomerListQuery,
      page: { offset: number; limit: number },
    ) {
      const where = scope(workspaceId, query);
      const [rows, [total]] = await Promise.all([
        db
          .select(columns)
          .from(customers)
          .where(where)
          .orderBy(...orderBy(query))
          .limit(page.limit)
          .offset(page.offset),
        db.select({ value: count() }).from(customers).where(where),
      ]);
      return { rows, total: total?.value ?? 0 };
    },

    async findById(workspaceId: string, customerId: string) {
      const [row] = await db
        .select(columns)
        .from(customers)
        .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)))
        .limit(1);
      return row;
    },

    /**
     * Zählt in einer Abfrage, was einer Archivierung entgegensteht. Verträge
     * und Anfragen gibt es als Tabellen bereits, auch wenn ihre Oberfläche
     * später kommt — die Regel gilt ab jetzt vollständig.
     */
    async archiveBlockers(workspaceId: string, customerId: string) {
      const scoped = (table: typeof projects | typeof serviceContracts | typeof serviceRequests) =>
        and(eq(table.workspaceId, workspaceId), eq(table.customerId, customerId));

      const [running, contracts, requests] = await Promise.all([
        db
          .select({ value: count() })
          .from(projects)
          .where(and(scoped(projects), inArray(projects.status, [...RUNNING_PROJECT_STATUS]))),
        db
          .select({ value: count() })
          .from(serviceContracts)
          .where(
            and(
              scoped(serviceContracts),
              eq(serviceContracts.confirmationStatus, 'confirmed'),
              or(isNull(serviceContracts.endDate), sql`${serviceContracts.endDate} > CURRENT_DATE`),
            ),
          ),
        db
          .select({ value: count() })
          .from(serviceRequests)
          .where(and(scoped(serviceRequests), ne(serviceRequests.status, 'resolved'))),
      ]);

      return {
        runningProjects: running[0]?.value ?? 0,
        activeContracts: contracts[0]?.value ?? 0,
        openRequests: requests[0]?.value ?? 0,
      };
    },
  };
}

export type CustomerRepository = ReturnType<typeof createCustomerRepository>;
