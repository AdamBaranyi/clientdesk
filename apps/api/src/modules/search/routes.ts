import { Router } from 'express';
import { searchQuerySchema } from '@clientdesk/contracts';
import type { AuthRepository } from '../auth/repository.ts';
import {
  getWorkspace,
  requireAuth,
  requireInternal,
  requireWorkspace,
} from '../workspaces/context.ts';
import type { SearchService } from './service.ts';

export function createSearchRouter(service: SearchService, authRepository: AuthRepository): Router {
  const router = Router({ mergeParams: true });
  // Wie überall: erst Anmeldung, dann Workspace-Zugehörigkeit, dann Rolle.
  // Ein Kundenzugang hat hier nichts zu suchen — die Palette springt in
  // interne Ansichten.
  router.use(requireAuth, requireWorkspace(authRepository), requireInternal);

  router.get('/', async (req, res) => {
    const query = searchQuerySchema.parse(req.query);
    const { workspaceId } = getWorkspace(req);
    res.json(await service.find(workspaceId, query.q));
  });

  return router;
}
