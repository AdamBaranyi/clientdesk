import { index, json, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

/**
 * Sitzungstabelle für connect-pg-simple. Das Schema gibt die Bibliothek vor,
 * nicht dieses Projekt — es steht hier nur, damit ein frischer Checkout allein
 * über die Migrationen startet und kein manuelles SQL nötig ist.
 * Diese Tabelle wird nie über Drizzle beschrieben.
 */
export const sessions = pgTable(
  'session',
  {
    sid: varchar('sid').primaryKey(),
    sess: json('sess').notNull(),
    expire: timestamp('expire', { precision: 6, withTimezone: false }).notNull(),
  },
  (table) => [index('IDX_session_expire').on(table.expire)],
);
