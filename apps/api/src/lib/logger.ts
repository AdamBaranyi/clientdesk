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

/**
 * Was von einem Request ins Log kommt: Kennung, Methode, Pfad und Status —
 * die Laufzeit ergänzt pino-http selbst. Keine Header, also weder die
 * Client-Adresse aus `X-Forwarded-For` noch die Browserkennung, und keine
 * Query: ein Suchbegriff ist oft ein Kundenname. Was hier fehlt, muss die
 * Datenschutzerklärung nicht erklären.
 */
export const requestLogSerializers = {
  req: (req: { id?: unknown; method?: string; url?: string }) => ({
    id: req.id,
    method: req.method,
    path: req.url?.split('?')[0],
  }),
  res: (res: { statusCode?: number }) => ({ statusCode: res.statusCode }),
};
