import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { customers } from './customers.ts';
import { membershipRole } from './enums.ts';
import { users } from './users.ts';
import { workspaces } from './workspaces.ts';

/**
 * Die Mitgliedschaft trägt die Rolle. customerId ist bei client Pflicht und
 * bei internen Rollen leer — das erzwingt ein Check-Constraint, nicht nur die
 * Anwendungsschicht. Der zusammengesetzte Fremdschlüssel stellt sicher, dass
 * der zugeordnete Kunde im selben Workspace liegt.
 */
export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: membershipRole('role').notNull(),
    customerId: uuid('customer_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('memberships_workspace_user_unique').on(table.workspaceId, table.userId),
    index('memberships_workspace_role_idx').on(table.workspaceId, table.role),
    index('memberships_user_idx').on(table.userId),
    foreignKey({
      name: 'memberships_customer_same_workspace_fk',
      columns: [table.customerId, table.workspaceId],
      foreignColumns: [customers.id, customers.workspaceId],
    }).onDelete('cascade'),
    check(
      'memberships_client_needs_customer',
      sql`(${table.role} = 'client') = (${table.customerId} IS NOT NULL)`,
    ),
  ],
);

/**
 * Einladungen speichern nur den Hash des Tokens. Rolle und Kundenbezug hängen
 * an der Einladung, nicht am Request des Beitretenden.
 */
export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    normalizedEmail: text('normalized_email').notNull(),
    role: membershipRole('role').notNull(),
    customerId: uuid('customer_id'),
    tokenHash: text('token_hash').notNull().unique(),
    invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('invitations_workspace_email_idx').on(table.workspaceId, table.normalizedEmail),
    index('invitations_expiry_idx').on(table.expiresAt),
    foreignKey({
      name: 'invitations_customer_same_workspace_fk',
      columns: [table.customerId, table.workspaceId],
      foreignColumns: [customers.id, customers.workspaceId],
    }).onDelete('cascade'),
    check(
      'invitations_client_needs_customer',
      sql`(${table.role} = 'client') = (${table.customerId} IS NOT NULL)`,
    ),
  ],
);

export type MembershipRow = typeof memberships.$inferSelect;
export type NewMembershipRow = typeof memberships.$inferInsert;
export type InvitationRow = typeof invitations.$inferSelect;
