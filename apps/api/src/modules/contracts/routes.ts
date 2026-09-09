import { Router } from 'express';
import { z } from 'zod';
import {
  contractInputSchema,
  contractListQuerySchema,
  contractUpdateSchema,
  paginationQuerySchema,
  rateInputSchema,
} from '@clientdesk/contracts';
import type { AuthRepository } from '../auth/repository.ts';
import {
  getWorkspace,
  requireAuth,
  requireInternal,
  requireWorkspace,
} from '../workspaces/context.ts';
import type { ContractService } from './service.ts';

const idSchema = z.uuid();

export function createContractRouter(
  service: ContractService,
  authRepository: AuthRepository,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireWorkspace(authRepository), requireInternal);

  router.get('/', async (req, res) => {
    const query = contractListQuerySchema.parse(req.query);
    const page = paginationQuerySchema.parse(req.query);
    const { workspaceId, timezone } = getWorkspace(req);
    res.json(await service.list(workspaceId, timezone, query, page));
  });

  router.post('/', async (req, res) => {
    const input = contractInputSchema.parse(req.body);
    const { workspaceId, timezone, userId } = getWorkspace(req);
    res.status(201).json(await service.create(workspaceId, timezone, userId, input));
  });

  router.get('/:contractId', async (req, res) => {
    const contractId = idSchema.parse(req.params.contractId);
    const query = contractListQuerySchema.pick({ onDate: true }).parse(req.query);
    const { workspaceId, timezone } = getWorkspace(req);
    res.json(await service.get(workspaceId, timezone, contractId, query.onDate));
  });

  router.patch('/:contractId', async (req, res) => {
    const contractId = idSchema.parse(req.params.contractId);
    const input = contractUpdateSchema.parse(req.body);
    const { workspaceId, timezone, userId } = getWorkspace(req);
    res.json(await service.update(workspaceId, timezone, userId, contractId, input));
  });

  router.get('/:contractId/rates', async (req, res) => {
    const contractId = idSchema.parse(req.params.contractId);
    const { workspaceId } = getWorkspace(req);
    res.json({ data: await service.listRates(workspaceId, contractId) });
  });

  router.post('/:contractId/rates', async (req, res) => {
    const contractId = idSchema.parse(req.params.contractId);
    const input = rateInputSchema.parse(req.body);
    const { workspaceId, userId } = getWorkspace(req);
    res.status(201).json({ data: await service.addRate(workspaceId, userId, contractId, input) });
  });

  return router;
}
