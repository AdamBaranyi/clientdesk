import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { customers } from './customers.ts';
import { documentDeletion } from './enums.ts';
import { projects } from './projects.ts';
import { users } from './users.ts';
import { workspaces } from './workspaces.ts';

/**
 * Dateien liegen nie in einem öffentlichen Bucket. objectKey ist zufällig,
 * der Originalname bleibt reines Metadatum. Downloads laufen über die
 * autorisierte API.
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').notNull(),
    projectId: uuid('project_id'),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    /** Zufälliger interner Schlüssel, nie aus dem Dateinamen abgeleitet. */
    objectKey: text('object_key').notNull().unique(),
    originalName: text('original_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    /** Standardmässig intern. Erst eine bewusste Freigabe zeigt die Datei im Portal. */
    clientVisible: boolean('client_visible').notNull().default(false),
    deletionStatus: documentDeletion('deletion_status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('documents_workspace_customer_idx').on(table.workspaceId, table.customerId),
    index('documents_deletion_idx').on(table.deletionStatus),
    foreignKey({
      name: 'documents_customer_same_workspace_fk',
      columns: [table.customerId, table.workspaceId],
      foreignColumns: [customers.id, customers.workspaceId],
    }).onDelete('cascade'),
    foreignKey({
      name: 'documents_project_same_workspace_fk',
      columns: [table.projectId, table.workspaceId],
      foreignColumns: [projects.id, projects.workspaceId],
    }).onDelete('set null'),
    check('documents_size_positive', sql`${table.sizeBytes} > 0`),
    check('documents_pdf_only', sql`${table.mimeType} = 'application/pdf'`),
  ],
);

export type DocumentRow = typeof documents.$inferSelect;
export type NewDocumentRow = typeof documents.$inferInsert;
