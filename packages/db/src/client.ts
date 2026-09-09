import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.ts';

export type Database = ReturnType<typeof createDatabase>;

/**
 * Postgres liefert numeric-Werte als String zurück. Das Projekt rechnet Geld
 * in Rappen als Ganzzahl, deshalb wird der Zähltyp bigint auf number gestellt.
 */
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => Number.parseInt(value, 10));

export interface DatabaseOptions {
  connectionString: string;
  maxConnections?: number;
}

export function createPool(options: DatabaseOptions): pg.Pool {
  return new pg.Pool({
    connectionString: options.connectionString,
    max: options.maxConnections ?? 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

export function createDatabase(pool: pg.Pool) {
  return drizzle(pool, { schema, casing: 'snake_case' });
}

export { schema };
export type Pool = pg.Pool;
