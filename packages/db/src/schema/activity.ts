import { index, jsonb, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.ts';
import { workspaces } from './workspaces.ts';

/**
 * Aktivitätsprotokoll. Welche Schlüssel je Aktionstyp in metadata landen
 * dürfen, entscheidet eine Whitelist in der Service-Schicht; sie verhindert,
 * dass interne Notizen oder Kommentarinhalte ins Protokoll gelangen.
 */
export const activityEvents = pgTable(
  'activity_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('activity_workspace_created_idx').on(table.workspaceId, table.createdAt),
    index('activity_entity_idx').on(table.workspaceId, table.entityType, table.entityId),
  ],
);

/**
 * Verhindert, dass ein Doppelklick zwei Anfragen erzeugt. Gleicher Schlüssel
 * mit geändertem Inhalt ist ein Konflikt, kein zweiter Versuch.
 */
export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    operation: text('operation').notNull(),
    key: text('key').notNull(),
    /** Hash des Anfrageinhalts, um denselben Schlüssel mit anderem Inhalt zu erkennen. */
    requestHash: text('request_hash').notNull(),
    resultReference: uuid('result_reference'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('idempotency_scope_unique').on(
      table.workspaceId,
      table.userId,
      table.operation,
      table.key,
    ),
    index('idempotency_expiry_idx').on(table.expiresAt),
  ],
);

export type ActivityEventRow = typeof activityEvents.$inferSelect;
export type NewActivityEventRow = typeof activityEvents.$inferInsert;
