import { hashPassword, verifyPassword } from '@tallyroom/db/auth';
import type { SessionUser, WorkspaceSummary } from '@tallyroom/contracts';
import { unauthenticated } from '../../lib/http-error.ts';
import type { AuthRepository, MembershipRecord, UserRecord } from './repository.ts';

/**
 * Dummy-Hash für den Fall „E-Mail unbekannt". Ohne ihn wäre die Antwortzeit
 * bei unbekannten Konten messbar kürzer und würde verraten, welche
 * E-Mail-Adressen existieren.
 */
let dummyHashPromise: Promise<string> | undefined;

function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword('ungueltiges-platzhalter-passwort');
  return dummyHashPromise;
}

export interface AuthService {
  authenticate: (email: string, password: string) => Promise<UserRecord>;
  buildSessionUser: (userId: string) => Promise<SessionUser>;
}

function toSummary(record: MembershipRecord): WorkspaceSummary {
  return {
    id: record.workspaceId,
    name: record.workspaceName,
    timezone: record.timezone,
    currency: 'CHF',
    role: record.role,
    isDemo: record.isDemo,
    customerId: record.customerId,
  };
}

export function createAuthService(repository: AuthRepository): AuthService {
  return {
    /**
     * Gibt bei falscher E-Mail und bei falschem Passwort dieselbe allgemeine
     * Meldung zurück. Alles andere hilft beim Durchprobieren von Konten.
     */
    async authenticate(email, password) {
      const user = await repository.findUserByEmail(email);
      const storedHash = user?.passwordHash ?? (await getDummyHash());
      const matches = await verifyPassword(storedHash, password);

      if (!user || !matches) {
        throw unauthenticated('E-Mail oder Passwort ist falsch.');
      }
      return user;
    },

    async buildSessionUser(userId) {
      const user = await repository.findUserById(userId);
      if (!user) throw unauthenticated('Konto existiert nicht mehr.');

      const records = await repository.listMemberships(userId);
      return {
        id: user.id,
        email: user.normalizedEmail,
        displayName: user.displayName,
        workspaces: records.map(toSummary),
      };
    },
  };
}
