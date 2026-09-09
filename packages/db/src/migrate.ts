import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';
import { createDatabase, createPool } from './client.ts';

/**
 * Migrationen laufen als ausdrücklicher Schritt, nicht automatisch beim Start
 * eines Containers — sonst konkurrieren mehrere Instanzen um dieselbe Sperre.
 */
async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL fehlt. Siehe .env.example.');
    process.exit(1);
  }

  const pool = createPool({ connectionString, maxConnections: 1 });
  const db = createDatabase(pool);
  const migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url));

  try {
    await migrate(db, { migrationsFolder });
    console.log('Migrationen angewendet.');
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('Migration fehlgeschlagen:', error);
  process.exit(1);
});
