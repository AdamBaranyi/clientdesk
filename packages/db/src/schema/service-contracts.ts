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
import { contractConfirmation } from './enums.ts';
import { workspaces } from './workspaces.ts';

/**
 * Wiederkehrende Dienstleistung. Das Enddatum ist exklusiv: ein Vertrag zählt
 * am Datum D, wenn startDate <= D und endDate leer oder D < endDate ist.
 */
export const serviceContracts = pgTable(
  'service_contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').notNull(),
    name: text('name').notNull(),
    startDate: date('start_date').notNull(),
    /** Exklusiv. Am Enddatum selbst zählt der Vertrag nicht mehr. */
    endDate: date('end_date'),
    confirmationStatus: contractConfirmation('confirmation_status').notNull().default('draft'),
    /** Erscheint im Kundenportal, sobald clientVisible gesetzt ist. */
    publicDescription: text('public_description'),
    internalNote: text('internal_note'),
    clientVisible: boolean('client_visible').notNull().default(false),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('contracts_workspace_customer_idx').on(table.workspaceId, table.customerId),
    index('contracts_workspace_period_idx').on(
      table.workspaceId,
      table.confirmationStatus,
      table.startDate,
      table.endDate,
    ),
    unique('contracts_id_workspace_unique').on(table.id, table.workspaceId),
    foreignKey({
      name: 'contracts_customer_same_workspace_fk',
      columns: [table.customerId, table.workspaceId],
      foreignColumns: [customers.id, customers.workspaceId],
    }).onDelete('cascade'),
    check(
      'contracts_end_after_start',
      sql`${table.endDate} IS NULL OR ${table.endDate} > ${table.startDate}`,
    ),
  ],
);

/**
 * Preisversionen statt Preisänderung: eine Beendigung oder Anpassung darf
 * historische Monatswerte nicht rückwirkend verändern. Für ein Datum D gilt
 * die letzte Version mit effectiveFrom <= D.
 */
export const contractRates = pgTable(
  'contract_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    contractId: uuid('contract_id').notNull(),
    effectiveFrom: date('effective_from').notNull(),
    /** Rappen als Ganzzahl. Geld wird nie mit Gleitkomma gerechnet. */
    monthlyAmountMinor: integer('monthly_amount_minor').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('contract_rates_contract_effective_unique').on(table.contractId, table.effectiveFrom),
    index('contract_rates_lookup_idx').on(table.contractId, table.effectiveFrom),
    foreignKey({
      name: 'contract_rates_contract_same_workspace_fk',
      columns: [table.contractId, table.workspaceId],
      foreignColumns: [serviceContracts.id, serviceContracts.workspaceId],
    }).onDelete('cascade'),
    check('contract_rates_amount_not_negative', sql`${table.monthlyAmountMinor} >= 0`),
  ],
);

export type ServiceContractRow = typeof serviceContracts.$inferSelect;
export type NewServiceContractRow = typeof serviceContracts.$inferInsert;
export type ContractRateRow = typeof contractRates.$inferSelect;
export type NewContractRateRow = typeof contractRates.$inferInsert;
