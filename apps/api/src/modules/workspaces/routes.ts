import { Router } from 'express';
import type { WorkspaceSummary } from '@tallyroom/contracts';
import type { AuthRepository } from '../auth/repository.ts';
import { getWorkspace, requireAuth, requireWorkspace } from './context.ts';

export function createWorkspaceRouter(repository: AuthRepository): Router {
  const router = Router();

  router.get('/', requireAuth, async (req, res) => {
    const userId = req.session.userId as string;
    const records = await repository.listMemberships(userId);
    const data: WorkspaceSummary[] = records.map((record) => ({
      id: record.workspaceId,
      name: record.workspaceName,
      timezone: record.timezone,
      currency: 'CHF',
      role: record.role,
      isDemo: record.isDemo,
      customerId: record.customerId,
    }));
    res.json({ data });
  });

  router.get('/:workspaceId', requireAuth, requireWorkspace(repository), (req, res) => {
    const context = getWorkspace(req);
    res.json({
      id: context.workspaceId,
      role: context.role,
      customerId: context.customerId,
    });
  });

  return router;
}
