import type { MembershipRole } from '@clientdesk/contracts';
import type { Logger } from '../lib/logger.ts';

declare module 'express-session' {
  interface SessionData {
    /** Einzige Vertrauensquelle für die Identität. Rollen hängen am Workspace. */
    userId?: string;
    /** An die Sitzung gebundenes CSRF-Token. */
    csrfSecret?: string;
    /** Zeitpunkt der Anmeldung, für die absolute Sitzungsdauer. */
    loggedInAt?: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: Logger;
      /**
       * Wird ausschliesslich von requireWorkspace gesetzt, nachdem die
       * Mitgliedschaft in der Datenbank bestätigt wurde. Niemals aus der
       * Anfrage übernehmen.
       */
      workspace?: {
        userId: string;
        workspaceId: string;
        role: MembershipRole;
        customerId: string | null;
      };
    }
  }
}

export {};
