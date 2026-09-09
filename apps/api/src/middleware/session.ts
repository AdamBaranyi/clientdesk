import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import type { RequestHandler } from 'express';
import type { Pool } from '@clientdesk/db';
import { isProduction, type Env } from '../config/env.ts';

/** Absolute Obergrenze einer Sitzung, unabhängig von Aktivität. */
export const ABSOLUTE_SESSION_MS = 12 * 60 * 60 * 1000;
/** Sitzung ohne Aktivität. Das Cookie rollt bei jedem Request nach. */
export const IDLE_SESSION_MS = 2 * 60 * 60 * 1000;

export function createSessionMiddleware(env: Env, pool: Pool): RequestHandler {
  const PgStore = connectPgSimple(session);

  return session({
    name: 'clientdesk.sid',
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new PgStore({
      pool,
      tableName: 'session',
      createTableIfMissing: false,
      pruneSessionInterval: 60 * 15,
    }),
    proxy: env.TRUST_PROXY_HOPS > 0,
    cookie: {
      httpOnly: true,
      // Secure nur unter HTTPS — lokal würde das Cookie sonst nie gesetzt.
      secure: isProduction(env),
      sameSite: 'lax',
      maxAge: IDLE_SESSION_MS,
      path: '/',
    },
  });
}

/**
 * Die Bibliothek erneuert die Sitzungs-ID nicht von selbst. Nach erfolgreicher
 * Anmeldung muss sie rotiert werden, sonst bleibt eine vorher untergeschobene
 * ID gültig (Session Fixation).
 */
export function regenerateSession(req: {
  session: { regenerate: (cb: (err?: unknown) => void) => void };
}): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

export function destroySession(req: {
  session: { destroy: (cb: (err?: unknown) => void) => void };
}): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}

export function saveSession(req: {
  session: { save: (cb: (err?: unknown) => void) => void };
}): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}
