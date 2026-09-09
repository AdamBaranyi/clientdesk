import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { notFound, unauthenticated } from '../../lib/http-error.ts';
import type { AuthRepository } from '../auth/repository.ts';
import type { PortalScope } from './service.ts';

const workspaceIdSchema = z.uuid();

/**
 * Das Portal ist ausschliesslich für Mitgliedschaften der Rolle client, und
 * der Kundenbezug kommt aus der Mitgliedschaft — niemals aus dem Request.
 * Ein internes Konto bekommt hier 404: für interne Rollen gibt es die
 * Teamansicht, das Portal existiert für sie nicht.
 */
export function requirePortalClient(repository: AuthRepository) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const userId = req.session.userId;
    if (!userId) {
      next(unauthenticated());
      return;
    }

    const parsed = workspaceIdSchema.safeParse(req.params.workspaceId);
    if (!parsed.success) {
      next(notFound('Nicht gefunden.'));
      return;
    }

    const membership = await repository.findMembership(userId, parsed.data);
    if (!membership || membership.role !== 'client' || !membership.customerId) {
      next(notFound('Nicht gefunden.'));
      return;
    }

    req.portal = {
      workspaceId: membership.workspaceId,
      workspaceName: membership.workspaceName,
      customerId: membership.customerId,
      userId,
      timezone: membership.timezone,
    };
    next();
  };
}

export function getPortal(req: Request): PortalScope {
  if (!req.portal) throw unauthenticated('Kein Kundenkontext.');
  return req.portal;
}
