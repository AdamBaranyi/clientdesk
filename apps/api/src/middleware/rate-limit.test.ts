import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rateLimit } from './rate-limit.ts';

function requestFrom(ip: string): Request {
  return { ip } as Request;
}

const response = { setHeader: () => undefined } as unknown as Response;
const next: NextFunction = () => undefined;

describe('Aufbewahrung im Rate-Limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hält eine Adresse, solange ihr Zeitfenster läuft', () => {
    const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
    limiter(requestFrom('203.0.113.9'), response, next);

    vi.advanceTimersByTime(14 * 60 * 1000);

    expect(limiter.trackedKeys()).toBe(1);
  });

  it('verwirft sie spätestens eine Minute nach Ablauf des Fensters, auch ohne weitere Anfrage', () => {
    const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
    limiter(requestFrom('203.0.113.9'), response, next);
    limiter(requestFrom('198.51.100.4'), response, next);

    vi.advanceTimersByTime(16 * 60 * 1000);

    expect(limiter.trackedKeys()).toBe(0);
  });
});
