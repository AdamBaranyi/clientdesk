import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Ein Konto ist workspace-übergreifend. Die Zugehörigkeit zu einer Agentur
 * entsteht ausschliesslich über memberships.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Kleingeschrieben und getrimmt. Einzige Grundlage für Anmeldung und Einladung. */
    normalizedEmail: text('normalized_email').notNull().unique(),
    displayName: text('display_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('users_created_at_idx').on(table.createdAt)],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
