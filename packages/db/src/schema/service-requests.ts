import {
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { customers } from './customers.ts';
import { commentVisibility, requestPriority, requestStatus } from './enums.ts';
import { projects } from './projects.ts';
import { users } from './users.ts';
import { workspaces } from './workspaces.ts';

/**
 * Kundenanfrage. Ein optional zugeordnetes Projekt muss zum selben Kunden
 * gehören — das prüft der Service, weil Postgres den Dreier-Bezug nicht in
 * einem einzelnen Fremdschlüssel abbilden kann.
 */
export const serviceRequests = pgTable(
  'service_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').notNull(),
    projectId: uuid('project_id'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    /** Nur interne Mitglieder. Clients dürfen die Zuweisung nicht setzen. */
    assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    priority: requestPriority('priority').notNull().default('normal'),
    status: requestStatus('status').notNull().default('open'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('requests_workspace_status_idx').on(table.workspaceId, table.status),
    index('requests_workspace_customer_idx').on(table.workspaceId, table.customerId),
    index('requests_workspace_updated_idx').on(table.workspaceId, table.updatedAt),
    unique('requests_id_workspace_unique').on(table.id, table.workspaceId),
    foreignKey({
      name: 'requests_customer_same_workspace_fk',
      columns: [table.customerId, table.workspaceId],
      foreignColumns: [customers.id, customers.workspaceId],
    }).onDelete('cascade'),
    foreignKey({
      name: 'requests_project_same_workspace_fk',
      columns: [table.projectId, table.workspaceId],
      foreignColumns: [projects.id, projects.workspaceId],
    }).onDelete('set null'),
  ],
);

/**
 * Interne Kommentare dürfen niemals in einer Client-Antwort erscheinen —
 * auch nicht in Suchtreffern, Downloads oder Caches.
 */
export const requestComments = pgTable(
  'request_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    requestId: uuid('request_id').notNull(),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    visibility: commentVisibility('visibility').notNull().default('internal'),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('request_comments_request_created_idx').on(table.requestId, table.createdAt),
    index('request_comments_visibility_idx').on(table.requestId, table.visibility),
    foreignKey({
      name: 'request_comments_request_same_workspace_fk',
      columns: [table.requestId, table.workspaceId],
      foreignColumns: [serviceRequests.id, serviceRequests.workspaceId],
    }).onDelete('cascade'),
  ],
);

export type ServiceRequestRow = typeof serviceRequests.$inferSelect;
export type NewServiceRequestRow = typeof serviceRequests.$inferInsert;
export type RequestCommentRow = typeof requestComments.$inferSelect;
export type NewRequestCommentRow = typeof requestComments.$inferInsert;
