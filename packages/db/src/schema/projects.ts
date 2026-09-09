import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
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
import { milestoneStatus, projectStatus } from './enums.ts';
import { users } from './users.ts';
import { workspaces } from './workspaces.ts';

/** Ein Projekt gehört zu genau einem Kunden desselben Workspace. */
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').notNull(),
    /** Verantwortliches internes Mitglied. Die Mitgliedschaft prüft der Service. */
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    /** Kundenfreundlich formuliert, erscheint im Portal. */
    description: text('description'),
    /** Niemals in einem Client-DTO ausliefern. */
    internalNote: text('internal_note'),
    status: projectStatus('status').notNull().default('planned'),
    startDate: date('start_date').notNull(),
    targetDate: date('target_date'),
    clientVisible: boolean('client_visible').notNull().default(false),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('projects_workspace_status_idx').on(table.workspaceId, table.status),
    index('projects_workspace_customer_idx').on(table.workspaceId, table.customerId),
    index('projects_target_date_idx').on(table.workspaceId, table.targetDate),
    unique('projects_id_workspace_unique').on(table.id, table.workspaceId),
    foreignKey({
      name: 'projects_customer_same_workspace_fk',
      columns: [table.customerId, table.workspaceId],
      foreignColumns: [customers.id, customers.workspaceId],
    }).onDelete('cascade'),
    check(
      'projects_target_after_start',
      sql`${table.targetDate} IS NULL OR ${table.targetDate} >= ${table.startDate}`,
    ),
  ],
);

/**
 * Fortschritt = erledigte Meilensteine geteilt durch alle. Bei null Meilensteinen
 * zeigt die Oberfläche „Noch keine Meilensteine" statt irreführender 100 Prozent.
 */
export const milestones = pgTable(
  'milestones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    dueDate: date('due_date'),
    status: milestoneStatus('status').notNull().default('open'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('milestones_project_order_idx').on(table.projectId, table.sortOrder),
    index('milestones_workspace_due_idx').on(table.workspaceId, table.status, table.dueDate),
    foreignKey({
      name: 'milestones_project_same_workspace_fk',
      columns: [table.projectId, table.workspaceId],
      foreignColumns: [projects.id, projects.workspaceId],
    }).onDelete('cascade'),
  ],
);

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
export type MilestoneRow = typeof milestones.$inferSelect;
export type NewMilestoneRow = typeof milestones.$inferInsert;
