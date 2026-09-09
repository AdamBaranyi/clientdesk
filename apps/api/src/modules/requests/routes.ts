import { Router } from 'express';
import { z } from 'zod';
import {
  commentInputSchema,
  paginationQuerySchema,
  requestInputSchema,
  requestListQuerySchema,
  requestStatusChangeSchema,
  requestUpdateSchema,
} from '@clientdesk/contracts';
import type { AuthRepository } from '../auth/repository.ts';
import {
  getWorkspace,
  requireAuth,
  requireInternal,
  requireWorkspace,
} from '../workspaces/context.ts';
import type { RequestService } from './service.ts';

const idSchema = z.uuid();
const idempotencyKeySchema = z.string().trim().min(8).max(200);

export function createRequestRouter(
  service: RequestService,
  authRepository: AuthRepository,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireWorkspace(authRepository), requireInternal);

  router.get('/', async (req, res) => {
    const query = requestListQuerySchema.parse(req.query);
    const page = paginationQuerySchema.parse(req.query);
    const { workspaceId } = getWorkspace(req);
    res.json(await service.list(workspaceId, query, page));
  });

  router.post('/', async (req, res) => {
    const input = requestInputSchema.parse(req.body);
    const { workspaceId, userId } = getWorkspace(req);
    // Optional: ohne Schlüssel gibt es keinen Doppelklickschutz, aber auch
    // keinen Fehler — der Kopf ist eine Zusicherung des Aufrufers.
    const parsedKey = idempotencyKeySchema.safeParse(req.get('idempotency-key'));
    const created = await service.create(
      workspaceId,
      userId,
      input,
      parsedKey.success ? parsedKey.data : undefined,
    );
    res.status(201).json(created);
  });

  router.get('/:requestId', async (req, res) => {
    const requestId = idSchema.parse(req.params.requestId);
    const { workspaceId } = getWorkspace(req);
    res.json(await service.get(workspaceId, requestId));
  });

  router.patch('/:requestId', async (req, res) => {
    const requestId = idSchema.parse(req.params.requestId);
    const input = requestUpdateSchema.parse(req.body);
    const { workspaceId, userId } = getWorkspace(req);
    res.json(await service.update(workspaceId, userId, requestId, input));
  });

  router.post('/:requestId/status', async (req, res) => {
    const requestId = idSchema.parse(req.params.requestId);
    const { status, version } = requestStatusChangeSchema.parse(req.body);
    const { workspaceId, userId } = getWorkspace(req);
    res.json(await service.changeStatus(workspaceId, userId, requestId, status, version));
  });

  router.get('/:requestId/comments', async (req, res) => {
    const requestId = idSchema.parse(req.params.requestId);
    const { workspaceId } = getWorkspace(req);
    res.json({ data: await service.listComments(workspaceId, requestId) });
  });

  router.post('/:requestId/comments', async (req, res) => {
    const requestId = idSchema.parse(req.params.requestId);
    const input = commentInputSchema.parse(req.body);
    const { workspaceId, userId } = getWorkspace(req);
    res.status(201).json({ data: await service.addComment(workspaceId, userId, requestId, input) });
  });

  return router;
}
