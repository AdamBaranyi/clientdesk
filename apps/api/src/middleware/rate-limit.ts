import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/http-error.ts';

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** Schlüssel je Anfrage. Standard ist die Client-IP. */
  keyOf?: (req: Request) => string;
}

/** So oft fliegen abgelaufene Einträge aus dem Speicher. */
const SWEEP_INTERVAL_MS = 60_000;

/**
 * Bewusst im Prozessspeicher: bei einer einzelnen API-Instanz reicht das und
 * spart eine weitere Abhängigkeit. Bei mehreren Instanzen gehört der Zähler in
 * einen gemeinsamen Speicher — vermerkt in docs/ARCHITECTURE.md.
 *
 * Der Schlüssel ist meist eine IP-Adresse. Sie bleibt nur so lange im
 * Speicher, wie ihr Zeitfenster läuft, und höchstens eine Minute darüber —
 * so steht es in der Datenschutzerklärung. Vorher wurde erst ab 5'000
 * Einträgen aufgeräumt; auf einer ruhigen Seite blieb eine Adresse damit
 * beliebig lange liegen.
 */
export function rateLimit(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();
  const keyOf = options.keyOf ?? ((req: Request) => req.ip ?? 'unbekannt');

  // unref: der Takt allein hält den Prozess nicht am Leben.
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, SWEEP_INTERVAL_MS).unref();

  const middleware = (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = keyOf(req);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      next(new HttpError('RATE_LIMITED', 'Zu viele Versuche. Bitte später erneut probieren.'));
      return;
    }

    next();
  };

  /** Wie viele Schlüssel gerade im Speicher liegen. Für den Test der Aufbewahrung. */
  return Object.assign(middleware, { trackedKeys: () => buckets.size });
}
