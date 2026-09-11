import { Router } from 'express';
import { dashboardQuerySchema } from '@tallyroom/contracts';
import type { AuthRepository } from '../auth/repository.ts';
import {
  getWorkspace,
  requireAuth,
  requireInternal,
  requireWorkspace,
} from '../workspaces/context.ts';
import type { DashboardService } from './service.ts';

export function createDashboardRouter(
  service: DashboardService,
  authRepository: AuthRepository,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireWorkspace(authRepository), requireInternal);

  router.get('/', async (req, res) => {
    const query = dashboardQuerySchema.parse(req.query);
    const { workspaceId, timezone } = getWorkspace(req);
    res.json(await service.load(workspaceId, timezone, query.contractDate));
  });

  return router;
}
