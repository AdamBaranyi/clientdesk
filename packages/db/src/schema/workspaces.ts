import { sql } from 'drizzle-orm';
import { boolean, check, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

/** Ein Workspace ist die Agentur, also der Mandant. */
export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    timezone: text('timezone').notNull().default('Europe/Zurich'),
    currency: text('currency').notNull().default('CHF'),
    /** Demo-Workspaces werden nach Ablauf samt Daten und Dateien entfernt. */
    isDemo: boolean('is_demo').notNull().default(false),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('workspaces_demo_expiry_idx').on(table.isDemo, table.expiresAt),
    check('workspaces_currency_chf', sql`${table.currency} = 'CHF'`),
    check(
      'workspaces_demo_has_expiry',
      sql`${table.isDemo} = false OR ${table.expiresAt} IS NOT NULL`,
    ),
    /** Zielpunkt für zusammengesetzte Fremdschlüssel der Kindtabellen. */
    unique('workspaces_id_unique').on(table.id),
  ],
);

export type WorkspaceRow = typeof workspaces.$inferSelect;
export type NewWorkspaceRow = typeof workspaces.$inferInsert;
