import { index, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.ts';

/**
 * Ein Kunde ist ein Datensatz innerhalb einer Agentur — nicht zu verwechseln
 * mit einem angemeldeten Kundenbenutzer, der über eine Mitgliedschaft mit
 * Rolle client auf genau einen dieser Datensätze zugreift.
 */
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    contactName: text('contact_name'),
    email: text('email'),
    phone: text('phone'),
    website: text('website'),
    /** Niemals in einem Client-DTO ausliefern. */
    internalNote: text('internal_note'),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    /** Optimistic Locking: eine veraltete Version liefert 409. */
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('customers_workspace_name_idx').on(table.workspaceId, table.name),
    index('customers_workspace_archived_idx').on(table.workspaceId, table.archivedAt),
    /** Erlaubt Kindtabellen den zusammengesetzten Fremdschlüssel auf denselben Workspace. */
    unique('customers_id_workspace_unique').on(table.id, table.workspaceId),
  ],
);

export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;
