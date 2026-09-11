import { Router } from 'express';
import { changePasswordSchema, loginSchema, type CsrfToken } from '@tallyroom/contracts';
import { normalizeEmail } from '@tallyroom/db/auth';
import { ensureCsrfToken } from '../../middleware/csrf.ts';
import { destroySession, regenerateSession, saveSession } from '../../middleware/session.ts';
import { rateLimit, type RateLimitOptions } from '../../middleware/rate-limit.ts';
import { unauthenticated } from '../../lib/http-error.ts';
import type { AuthService } from './service.ts';

export interface AuthRouterOptions {
  /** Grenzen kommen aus der Konfiguration, damit sie prüfbar bleiben. */
  loginRateLimit: RateLimitOptions;
}

export function createAuthRouter(service: AuthService, options: AuthRouterOptions): Router {
  const router = Router();
  // Der Zähler gehört zu dieser Router-Instanz, nicht zum Modul — sonst würden
  // sich mehrere App-Instanzen im selben Prozess einen Zustand teilen.
  const loginLimiter = rateLimit(options.loginRateLimit);
  // Je Konto, nicht je Adresse: das Raten des bisherigen Passworts bremst
  // auch dann, wenn jemand die Adresse wechselt.
  const passwordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyOf: (req) => req.session.userId ?? req.ip ?? 'unbekannt',
  });

  router.get('/csrf', (req, res) => {
    const body: CsrfToken = { csrfToken: ensureCsrfToken(req) };
    res.json(body);
  });

  router.get('/me', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) throw unauthenticated();
    res.json(await service.buildSessionUser(userId));
  });

  router.post('/login', loginLimiter, async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await service.authenticate(normalizeEmail(input.email), input.password);

    // Sitzungs-ID nach erfolgreicher Anmeldung rotieren (Session Fixation).
    await regenerateSession(req);
    req.session.userId = user.id;
    req.session.loggedInAt = Date.now();
    ensureCsrfToken(req);
    await saveSession(req);

    req.log.info({ userId: user.id }, 'Anmeldung erfolgreich');
    res.json(await service.buildSessionUser(user.id));
  });

  router.post('/password', passwordLimiter, async (req, res) => {
    const userId = req.session.userId;
    if (!userId) throw unauthenticated();
    const input = changePasswordSchema.parse(req.body);
    await service.changePassword(userId, req.sessionID, input);

    // Neue Sitzungs-ID nach einer Änderung an den Zugangsdaten.
    await regenerateSession(req);
    req.session.userId = userId;
    req.session.loggedInAt = Date.now();
    ensureCsrfToken(req);
    await saveSession(req);

    req.log.info({ userId }, 'Passwort geändert');
    res.status(204).end();
  });

  router.post('/logout', async (req, res) => {
    // Serverseitig zerstören, nicht nur das Cookie löschen.
    await destroySession(req);
    res.clearCookie('tallyroom.sid', { path: '/' });
    res.status(204).end();
  });

  return router;
}
