import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { Logger } from '../lib/logger.ts';

/**
 * Jede Antwort trägt eine Request-ID, auch im Fehlerfall. Ein Nutzer kann sie
 * melden, ohne dass wir Details in die Fehlermeldung schreiben müssen.
 */
export function requestContext(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = randomUUID();
    req.requestId = requestId;
    req.log = logger.child({ requestId });
    res.setHeader('X-Request-Id', requestId);
    next();
  };
}
