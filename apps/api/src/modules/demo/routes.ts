import { Router } from 'express';
import { z } from 'zod';
import { demoSwitchSchema } from '@clientdesk/contracts';
import type { Env } from '../../config/env.ts';
import { notFound } from '../../lib/http-error.ts';
import { rateLimit } from '../../middleware/rate-limit.ts';
import { regenerateSession, saveSession } from '../../middleware/session.ts';
import { ensureCsrfToken } from '../../middleware/csrf.ts';
import { requireAuth } from '../workspaces/context.ts';
import type { DemoService } from './service.ts';

const workspaceIdSchema = z.uuid();

export function createDemoRouter(service: DemoService, env: Env): Router {
  const router = Router();

  /** Ohne DEMO_ENABLED existiert der ganze Bereich nicht. */
  router.use((_req, _res, next) => {
    next(env.DEMO_ENABLED ? undefined : notFound('Nicht gefunden.'));
  });

  // Eine Demo ist teuer: sie legt einen vollständigen Datenbestand samt
  // Dateien an. Die Grenze kommt aus der Konfiguration, damit sie prüfbar ist.
  const createLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: env.DEMO_RATE_LIMIT_MAX });

  router.post('/sessions', createLimiter, async (req, res) => {
    const session = await service.createSession();

    // Der Besucher ist danach als Demo-Owner angemeldet — mit frischer
    // Sitzungs-ID, wie nach jeder anderen Anmeldung.
    await regenerateSession(req);
    req.session.userId = session.ownerUserId;
    req.session.loggedInAt = Date.now();
    ensureCsrfToken(req);
    await saveSession(req);

    res.status(201).json({
      workspaceId: session.workspaceId,
      expiresAt: session.expiresAt.toISOString(),
    });
  });

  router.get('/:workspaceId/status', requireAuth, async (req, res) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    res.json(await service.status(workspaceId, req.session.userId as string));
  });

  /**
   * Rollenwechsel innerhalb der eigenen Demo. Der alte Berechtigungskontext
   * wird verworfen: die Sitzung wird neu erzeugt, nicht nur umgeschrieben.
   */
  router.post('/:workspaceId/switch', requireAuth, async (req, res) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const { userId } = demoSwitchSchema.parse(req.body);
    const currentUserId = req.session.userId as string;

    await service.assertSwitchAllowed(workspaceId, currentUserId, userId);

    await regenerateSession(req);
    req.session.userId = userId;
    req.session.loggedInAt = Date.now();
    ensureCsrfToken(req);
    await saveSession(req);

    res.status(200).json(await service.status(workspaceId, userId));
  });

  return router;
}
