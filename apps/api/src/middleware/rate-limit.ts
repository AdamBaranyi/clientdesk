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

/**
 * Bewusst im Prozessspeicher: bei einer einzelnen API-Instanz reicht das und
 * spart eine weitere Abhängigkeit. Bei mehreren Instanzen gehört der Zähler in
 * einen gemeinsamen Speicher — vermerkt in docs/ARCHITECTURE.md.
 */
export function rateLimit(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();
  const keyOf = options.keyOf ?? ((req: Request) => req.ip ?? 'unbekannt');

  return (req: Request, res: Response, next: NextFunction): void => {
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

    // Abgelaufene Einträge gelegentlich aufräumen, damit die Map nicht wächst.
    if (buckets.size > 5_000) {
      for (const [entryKey, entry] of buckets) {
        if (entry.resetAt <= now) buckets.delete(entryKey);
      }
    }

    next();
  };
}
