import { Router } from 'express';
import type { Pool } from '@tallyroom/db';

/**
 * Liveness prüft nur, ob der Prozess antwortet. Readiness prüft zusätzlich die
 * benötigten Dienste — ein Container ohne Datenbank ist nicht bereit.
 */
export function createHealthRouter(pool: Pool): Router {
  const router = Router();

  router.get('/live', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.get('/ready', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', database: 'ok' });
    } catch {
      res.status(503).json({ status: 'unavailable', database: 'unavailable' });
    }
  });

  return router;
}
