import { Router } from 'express';
import { z } from 'zod';
import {
  customerInputSchema,
  customerListQuerySchema,
  customerUpdateSchema,
  paginationQuerySchema,
} from '@tallyroom/contracts';
import type { AuthRepository } from '../auth/repository.ts';
import {
  getWorkspace,
  requireAuth,
  requireInternal,
  requireWorkspace,
} from '../workspaces/context.ts';
import type { CustomerService } from './service.ts';

const idSchema = z.uuid();

/**
 * Alle Routen liegen hinter requireWorkspace und requireInternal. Ein Client
 * bekommt hier 404 — der interne Kundenbereich existiert für ihn nicht.
 */
export function createCustomerRouter(
  service: CustomerService,
  authRepository: AuthRepository,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireWorkspace(authRepository), requireInternal);

  router.get('/', async (req, res) => {
    const query = customerListQuerySchema.parse(req.query);
    const page = paginationQuerySchema.parse(req.query);
    const { workspaceId } = getWorkspace(req);
    res.json(await service.list(workspaceId, query, page));
  });

  router.post('/', async (req, res) => {
    const input = customerInputSchema.parse(req.body);
    const { workspaceId, userId } = getWorkspace(req);
    res.status(201).json(await service.create(workspaceId, userId, input));
  });

  router.get('/:customerId', async (req, res) => {
    const customerId = idSchema.parse(req.params.customerId);
    const { workspaceId } = getWorkspace(req);
    res.json(await service.get(workspaceId, customerId));
  });

  router.patch('/:customerId', async (req, res) => {
    const customerId = idSchema.parse(req.params.customerId);
    const input = customerUpdateSchema.parse(req.body);
    const { workspaceId, userId } = getWorkspace(req);
    res.json(await service.update(workspaceId, userId, customerId, input));
  });

  /** Zeigt vor dem Archivieren, was noch entgegensteht. */
  router.get('/:customerId/archive-blockers', async (req, res) => {
    const customerId = idSchema.parse(req.params.customerId);
    const { workspaceId } = getWorkspace(req);
    res.json(await service.blockers(workspaceId, customerId));
  });

  router.post('/:customerId/archive', async (req, res) => {
    const customerId = idSchema.parse(req.params.customerId);
    const { workspaceId, userId } = getWorkspace(req);
    res.json(await service.archive(workspaceId, userId, customerId));
  });

  router.post('/:customerId/restore', async (req, res) => {
    const customerId = idSchema.parse(req.params.customerId);
    const { workspaceId, userId } = getWorkspace(req);
    res.json(await service.restore(workspaceId, userId, customerId));
  });

  return router;
}
