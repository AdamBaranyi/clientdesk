import { createDatabase, createPool } from '@tallyroom/db';
import { createApp } from './app.ts';
import { loadEnv } from './config/env.ts';
import { createLogger } from './lib/logger.ts';
import { startDemoCleanup } from './modules/demo/cleanup.ts';
import { createDemoRepository } from './modules/demo/repository.ts';
import { startDeletionRetry } from './modules/documents/deletion-retry.ts';
import { createS3Storage } from './storage/s3.ts';

const env = loadEnv();
const logger = createLogger(env);
const pool = createPool({ connectionString: env.DATABASE_URL });
const db = createDatabase(pool);
const storage = createS3Storage({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  bucket: env.S3_BUCKET,
  accessKeyId: env.S3_ACCESS_KEY_ID,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY,
});

const app = createApp({ env, db, pool, logger, storage });

const server = app.listen(env.API_PORT, () => {
  logger.info({ port: env.API_PORT, env: env.NODE_ENV }, 'API bereit');
});

/**
 * Der Aufräumlauf für abgelaufene Demos läuft im API-Prozess. Bei mehreren
 * Instanzen gehörte er in genau eine davon oder in einen eigenen Dienst —
 * vermerkt in docs/ARCHITECTURE.md.
 */
const stopCleanup = env.DEMO_ENABLED
  ? startDemoCleanup(db, createDemoRepository(db), storage, logger)
  : () => {};
const stopDeletionRetry = startDeletionRetry(db, storage, logger);

/** Geordnetes Herunterfahren: laufende Requests beenden, dann den Pool schliessen. */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Beende API');
  stopCleanup();
  stopDeletionRetry();
  server.close(() => {
    void pool.end().then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
