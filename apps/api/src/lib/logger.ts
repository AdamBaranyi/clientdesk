import { pino } from 'pino';
import type { Env } from '../config/env.ts';

/**
 * Logs enthalten Request-ID, Route, Status und Laufzeit — aber keine
 * Passwörter, Cookies, Tokens oder vollständigen Kundeninhalte.
 */
export function createLogger(env: Env) {
  return pino({
    level: env.NODE_ENV === 'test' ? 'silent' : 'info',
    redact: {
      paths: [
        'req.headers.cookie',
        'req.headers.authorization',
        'req.headers["x-csrf-token"]',
        'res.headers["set-cookie"]',
        'password',
        '*.password',
      ],
      remove: true,
    },
    ...(env.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
      : {}),
  });
}

export type Logger = ReturnType<typeof createLogger>;
