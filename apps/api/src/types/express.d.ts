import type { MembershipRole } from '@tallyroom/contracts';
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
        timezone: string;
        role: MembershipRole;
        customerId: string | null;
      };
      /**
       * Nur im Kundenportal gesetzt, ausschliesslich von requirePortalClient
       * und ausschliesslich aus einer Mitgliedschaft mit Rolle client.
       */
      portal?: {
        workspaceId: string;
        workspaceName: string;
        customerId: string;
        userId: string;
        timezone: string;
      };
    }
  }
}

export {};
