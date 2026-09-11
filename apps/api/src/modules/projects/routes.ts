import { Router } from 'express';
import { z } from 'zod';
import {
  milestoneInputSchema,
  milestoneUpdateSchema,
  paginationQuerySchema,
  projectInputSchema,
  projectListQuerySchema,
  projectUpdateSchema,
} from '@tallyroom/contracts';
import type { AuthRepository } from '../auth/repository.ts';
import {
  getWorkspace,
  requireAuth,
  requireInternal,
  requireWorkspace,
} from '../workspaces/context.ts';
import type { MilestoneService } from './milestone-service.ts';
import type { ProjectService } from './service.ts';

const idSchema = z.uuid();

export function createProjectRouter(
  projectService: ProjectService,
  milestoneService: MilestoneService,
  authRepository: AuthRepository,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireWorkspace(authRepository), requireInternal);

  router.get('/', async (req, res) => {
    const query = projectListQuerySchema.parse(req.query);
    const page = paginationQuerySchema.parse(req.query);
    const { workspaceId, timezone } = getWorkspace(req);
    res.json(await projectService.list(workspaceId, timezone, query, page));
  });

  router.post('/', async (req, res) => {
    const input = projectInputSchema.parse(req.body);
    const { workspaceId, timezone, userId } = getWorkspace(req);
    res.status(201).json(await projectService.create(workspaceId, timezone, userId, input));
  });

  router.get('/:projectId', async (req, res) => {
    const projectId = idSchema.parse(req.params.projectId);
    const { workspaceId, timezone } = getWorkspace(req);
    res.json(await projectService.get(workspaceId, timezone, projectId));
  });

  router.patch('/:projectId', async (req, res) => {
    const projectId = idSchema.parse(req.params.projectId);
    const input = projectUpdateSchema.parse(req.body);
    const { workspaceId, timezone, userId } = getWorkspace(req);
    res.json(await projectService.update(workspaceId, timezone, userId, projectId, input));
  });

  router.get('/:projectId/milestones', async (req, res) => {
    const projectId = idSchema.parse(req.params.projectId);
    const { workspaceId, timezone } = getWorkspace(req);
    res.json({ data: await milestoneService.list(workspaceId, timezone, projectId) });
  });

  router.post('/:projectId/milestones', async (req, res) => {
    const projectId = idSchema.parse(req.params.projectId);
    const input = milestoneInputSchema.parse(req.body);
    const { workspaceId, timezone, userId } = getWorkspace(req);
    res
      .status(201)
      .json({ data: await milestoneService.add(workspaceId, timezone, userId, projectId, input) });
  });

  router.patch('/milestones/:milestoneId', async (req, res) => {
    const milestoneId = idSchema.parse(req.params.milestoneId);
    const input = milestoneUpdateSchema.parse(req.body);
    const { workspaceId, timezone, userId } = getWorkspace(req);
    res.json({
      data: await milestoneService.update(workspaceId, timezone, userId, milestoneId, input),
    });
  });

  return router;
}
