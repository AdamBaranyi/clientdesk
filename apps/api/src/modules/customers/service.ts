import { and, eq, sql } from 'drizzle-orm';
import { customers, type Database } from '@clientdesk/db';
import type {
  ArchiveBlockers,
  Customer,
  CustomerInput,
  CustomerListQuery,
  CustomerUpdate,
  ListResponse,
} from '@clientdesk/contracts';
import { HttpError, notFound, validationFailed } from '../../lib/http-error.ts';
import { recordActivity } from '../../lib/activity.ts';
import type { CustomerRepository } from './repository.ts';

interface Row {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  internalNote: string | null;
  archivedAt: Date | null;
  version: number;
  createdAt: Date;
  activeProjectCount: number;
}

function toDto(row: Row): Customer {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contactName,
    email: row.email,
    phone: row.phone,
    website: row.website,
    internalNote: row.internalNote,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    activeProjectCount: row.activeProjectCount,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Leere Zeichenketten aus Formularen werden zu null, nicht zu ''. */
function blankToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function createCustomerService(db: Database, repository: CustomerRepository) {
  async function requireCustomer(workspaceId: string, customerId: string): Promise<Row> {
    const row = await repository.findById(workspaceId, customerId);
    if (!row) throw notFound('Kunde nicht gefunden.');
    return row as Row;
  }

  return {
    async list(
      workspaceId: string,
      query: CustomerListQuery,
      page: { page: number; pageSize: number },
    ): Promise<ListResponse<Customer>> {
      const offset = (page.page - 1) * page.pageSize;
      const { rows, total } = await repository.list(workspaceId, query, {
        offset,
        limit: page.pageSize,
      });
      return {
        data: (rows as Row[]).map(toDto),
        pagination: {
          page: page.page,
          pageSize: page.pageSize,
          totalItems: total,
          totalPages: Math.max(1, Math.ceil(total / page.pageSize)),
        },
      };
    },

    async get(workspaceId: string, customerId: string): Promise<Customer> {
      return toDto(await requireCustomer(workspaceId, customerId));
    },

    async create(workspaceId: string, actorId: string, input: CustomerInput): Promise<Customer> {
      const id = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(customers)
          .values({
            workspaceId,
            name: input.name.trim(),
            contactName: blankToNull(input.contactName),
            email: blankToNull(input.email),
            phone: blankToNull(input.phone),
            website: blankToNull(input.website),
            internalNote: blankToNull(input.internalNote),
          })
          .returning({ id: customers.id, name: customers.name });

        if (!created) throw new HttpError('INTERNAL', 'Kunde konnte nicht angelegt werden.');

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'customer.created',
          entityType: 'customer',
          entityId: created.id,
          metadata: { name: created.name },
        });
        return created.id;
      });

      return this.get(workspaceId, id);
    },

    /**
     * Die Version wird in der WHERE-Bedingung mitgeprüft. Trifft das Update
     * keine Zeile, hat inzwischen jemand anders gespeichert.
     */
    async update(
      workspaceId: string,
      actorId: string,
      customerId: string,
      input: CustomerUpdate,
    ): Promise<Customer> {
      const { version, ...fields } = input;
      await requireCustomer(workspaceId, customerId);

      const changed = Object.keys(fields).filter(
        (key) => fields[key as keyof typeof fields] !== undefined,
      );
      if (changed.length === 0) return this.get(workspaceId, customerId);

      await db.transaction(async (tx) => {
        const updated = await tx
          .update(customers)
          .set({
            ...(fields.name !== undefined ? { name: fields.name.trim() } : {}),
            ...(fields.contactName !== undefined
              ? { contactName: blankToNull(fields.contactName) }
              : {}),
            ...(fields.email !== undefined ? { email: blankToNull(fields.email) } : {}),
            ...(fields.phone !== undefined ? { phone: blankToNull(fields.phone) } : {}),
            ...(fields.website !== undefined ? { website: blankToNull(fields.website) } : {}),
            ...(fields.internalNote !== undefined
              ? { internalNote: blankToNull(fields.internalNote) }
              : {}),
            version: sql`${customers.version} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(customers.workspaceId, workspaceId),
              eq(customers.id, customerId),
              eq(customers.version, version),
            ),
          )
          .returning({ id: customers.id });

        if (updated.length === 0) {
          throw new HttpError(
            'VERSION_CONFLICT',
            'Der Kunde wurde inzwischen von jemand anderem geändert. Bitte neu laden.',
          );
        }

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'customer.updated',
          entityType: 'customer',
          entityId: customerId,
          metadata: { changedFields: changed },
        });
      });

      return this.get(workspaceId, customerId);
    },

    blockers(workspaceId: string, customerId: string): Promise<ArchiveBlockers> {
      return repository.archiveBlockers(workspaceId, customerId);
    },

    /**
     * Blocker und Archivierung laufen in derselben Transaktion. Sonst könnte
     * zwischen Prüfung und Schreiben ein neues Projekt entstehen und die Regel
     * unterlaufen.
     */
    async archive(workspaceId: string, actorId: string, customerId: string): Promise<Customer> {
      const existing = await requireCustomer(workspaceId, customerId);
      if (existing.archivedAt) return toDto(existing);

      await db.transaction(async (tx) => {
        const blockers = await repository.archiveBlockers(workspaceId, customerId);
        const total = blockers.runningProjects + blockers.activeContracts + blockers.openRequests;
        if (total > 0) {
          throw validationFailed('Der Kunde kann noch nicht archiviert werden.', {
            runningProjects: [String(blockers.runningProjects)],
            activeContracts: [String(blockers.activeContracts)],
            openRequests: [String(blockers.openRequests)],
          });
        }

        await tx
          .update(customers)
          .set({ archivedAt: new Date(), version: sql`${customers.version} + 1` })
          .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)));

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'customer.archived',
          entityType: 'customer',
          entityId: customerId,
          metadata: { name: existing.name },
        });
      });

      return this.get(workspaceId, customerId);
    },

    /** Archivierte Daten bleiben lesbar und können zurückgeholt werden. */
    async restore(workspaceId: string, actorId: string, customerId: string): Promise<Customer> {
      const existing = await requireCustomer(workspaceId, customerId);
      if (!existing.archivedAt) return toDto(existing);

      await db.transaction(async (tx) => {
        await tx
          .update(customers)
          .set({ archivedAt: null, version: sql`${customers.version} + 1` })
          .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)));

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'customer.restored',
          entityType: 'customer',
          entityId: customerId,
          metadata: { name: existing.name },
        });
      });

      return this.get(workspaceId, customerId);
    },
  };
}

export type CustomerService = ReturnType<typeof createCustomerService>;
