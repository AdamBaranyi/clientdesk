import { createDatabase, createPool } from '@clientdesk/db';
import { createApp } from './app.ts';
import { loadEnv } from './config/env.ts';
import { createLogger } from './lib/logger.ts';

const env = loadEnv();
const logger = createLogger(env);
const pool = createPool({ connectionString: env.DATABASE_URL });
const db = createDatabase(pool);
const app = createApp({ env, db, pool, logger });

const server = app.listen(env.API_PORT, () => {
  logger.info({ port: env.API_PORT, env: env.NODE_ENV }, 'API bereit');
});

/** Geordnetes Herunterfahren: laufende Requests beenden, dann den Pool schliessen. */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Beende API');
  server.close(() => {
    void pool.end().then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
