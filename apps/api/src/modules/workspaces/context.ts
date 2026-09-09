import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { isInternalRole, type MembershipRole } from '@clientdesk/contracts';
import { forbidden, notFound, unauthenticated } from '../../lib/http-error.ts';
import type { AuthRepository } from '../auth/repository.ts';

export interface WorkspaceContext {
  userId: string;
  workspaceId: string;
  role: MembershipRole;
  /** Nur bei Rolle client gesetzt; begrenzt jeden Zugriff auf diesen Kunden. */
  customerId: string | null;
}

const workspaceIdSchema = z.uuid();

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    next(unauthenticated());
    return;
  }
  next();
}

/**
 * Löst den Workspace-Kontext ausschliesslich aus der Mitgliedschaft in der
 * Datenbank auf. Fehlt sie, ist die Antwort 404 und nicht 403 — sonst wäre
 * erkennbar, dass ein fremder Workspace mit dieser ID existiert.
 */
export function requireWorkspace(repository: AuthRepository) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const userId = req.session.userId;
    if (!userId) {
      next(unauthenticated());
      return;
    }

    const parsed = workspaceIdSchema.safeParse(req.params.workspaceId);
    if (!parsed.success) {
      next(notFound('Workspace nicht gefunden.'));
      return;
    }

    const membership = await repository.findMembership(userId, parsed.data);
    if (!membership) {
      next(notFound('Workspace nicht gefunden.'));
      return;
    }

    req.workspace = {
      userId,
      workspaceId: membership.workspaceId,
      role: membership.role,
      customerId: membership.customerId,
    };
    next();
  };
}

export function getWorkspace(req: Request): WorkspaceContext {
  if (!req.workspace) throw unauthenticated('Kein Workspace-Kontext.');
  return req.workspace;
}

/** Owner und Member. Clients bekommen 404 statt 403 auf internen Routen. */
export function requireInternal(req: Request, _res: Response, next: NextFunction): void {
  const context = getWorkspace(req);
  if (!isInternalRole(context.role)) {
    next(notFound('Nicht gefunden.'));
    return;
  }
  next();
}

export function requireOwner(req: Request, _res: Response, next: NextFunction): void {
  const context = getWorkspace(req);
  if (context.role !== 'owner') {
    next(forbidden('Diese Aktion ist Owner-Konten vorbehalten.'));
    return;
  }
  next();
}
