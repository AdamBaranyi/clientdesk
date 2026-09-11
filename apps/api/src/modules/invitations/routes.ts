import { Router } from 'express';
import { z } from 'zod';
import { acceptInvitationSchema, invitationInputSchema } from '@tallyroom/contracts';
import type { AuthRepository } from '../auth/repository.ts';
import { rateLimit } from '../../middleware/rate-limit.ts';
import { regenerateSession, saveSession } from '../../middleware/session.ts';
import {
  getWorkspace,
  requireAuth,
  requireInternal,
  requireOwner,
  requireWorkspace,
} from '../workspaces/context.ts';
import type { InvitationService } from './service.ts';

const idSchema = z.uuid();
const tokenSchema = z.string().trim().min(20).max(200);

/**
 * Einladungen verwalten darf nur ein Owner. requireInternal steht bewusst
 * davor: ein Kundenbenutzer soll 404 bekommen und nicht 403 — ein 403 würde
 * bestätigen, dass es diesen Bereich überhaupt gibt.
 */
export function createInvitationAdminRouter(
  service: InvitationService,
  authRepository: AuthRepository,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireWorkspace(authRepository), requireInternal, requireOwner);

  router.get('/', async (req, res) => {
    const { workspaceId } = getWorkspace(req);
    res.json({ data: await service.list(workspaceId) });
  });

  router.post('/', async (req, res) => {
    const input = invitationInputSchema.parse(req.body);
    const { workspaceId, userId } = getWorkspace(req);
    res.status(201).json(await service.create(workspaceId, userId, input));
  });

  router.delete('/:invitationId', async (req, res) => {
    const invitationId = idSchema.parse(req.params.invitationId);
    const { workspaceId } = getWorkspace(req);
    await service.revoke(workspaceId, invitationId);
    res.status(204).end();
  });

  return router;
}

/**
 * Der öffentliche Teil: Vorschau und Annahme. Beide sind ohne Anmeldung
 * erreichbar, weil ein neu Eingeladener noch kein Konto hat — und beide
 * rate-limitiert, damit sich Token nicht durchprobieren lassen.
 */
export function createInvitationPublicRouter(service: InvitationService): Router {
  const router = Router();
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

  router.get('/:token', limiter, async (req, res) => {
    const token = tokenSchema.parse(req.params.token);
    res.json(await service.preview(token));
  });

  router.post('/:token/accept', limiter, async (req, res) => {
    const token = tokenSchema.parse(req.params.token);
    const input = acceptInvitationSchema.parse(req.body);

    const result = await service.accept(token, input, req.session.userId);

    // Nach der Annahme ist der Beitretende angemeldet — mit frischer
    // Sitzungs-ID, wie nach jeder anderen Anmeldung auch.
    await regenerateSession(req);
    req.session.userId = result.userId;
    req.session.loggedInAt = Date.now();
    await saveSession(req);

    res.status(201).json({ workspaceId: result.workspaceId });
  });

  return router;
}
