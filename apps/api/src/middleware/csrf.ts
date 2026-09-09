import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/http-error.ts';
import type { Env } from '../config/env.ts';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const HEADER = 'x-csrf-token';

/** Erzeugt das Token einmal je Sitzung und gibt es zurück. */
export function ensureCsrfToken(req: Request): string {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = randomBytes(32).toString('base64url');
  }
  return req.session.csrfSecret;
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Zwei Prüfungen für jeden schreibenden Request: das Token muss zur Sitzung
 * passen, und der Origin- beziehungsweise Referer-Header muss der erlaubten
 * Herkunft entsprechen. Ein fehlender Origin-Header bei einem schreibenden
 * Request wird abgewiesen, nicht durchgewinkt.
 */
export function csrfProtection(env: Env) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    const origin = req.get('origin') ?? originFromReferer(req.get('referer'));
    if (origin !== env.APP_ORIGIN) {
      next(new HttpError('CSRF_FAILED', 'Herkunft der Anfrage ist nicht erlaubt.'));
      return;
    }

    const provided = req.get(HEADER);
    const expected = req.session.csrfSecret;
    if (!provided || !expected || !constantTimeEquals(provided, expected)) {
      next(new HttpError('CSRF_FAILED', 'CSRF-Token fehlt oder ist ungültig.'));
      return;
    }

    next();
  };
}

function originFromReferer(referer: string | undefined): string | undefined {
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}
