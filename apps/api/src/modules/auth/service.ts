import { hashPassword, verifyPassword } from '@tallyroom/db/auth';
import type { ChangePasswordInput, SessionUser, WorkspaceSummary } from '@tallyroom/contracts';
import { forbidden, unauthenticated, validationFailed } from '../../lib/http-error.ts';
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
  changePassword: (userId: string, sessionId: string, input: ChangePasswordInput) => Promise<void>;
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
        throw unauthenticated({
          de: 'E-Mail oder Passwort ist falsch.',
          en: 'Email or password is incorrect.',
        });
      }
      return user;
    },

    async buildSessionUser(userId) {
      const user = await repository.findUserById(userId);
      if (!user)
        throw unauthenticated({
          de: 'Konto existiert nicht mehr.',
          en: 'This account no longer exists.',
        });

      const records = await repository.listMemberships(userId);
      return {
        id: user.id,
        email: user.normalizedEmail,
        displayName: user.displayName,
        workspaces: records.map(toSummary),
      };
    },

    /**
     * Das bisherige Passwort ist der Nachweis, nicht die Sitzung allein: wer
     * einen fremden, offenen Browser erwischt, soll das Konto nicht übernehmen
     * können. Danach enden alle anderen Sitzungen dieses Kontos.
     *
     * Ein falsches bisheriges Passwort ist ein Eingabefehler (422), keine
     * fehlende Anmeldung (401) — die Oberfläche beendet bei 401 die Sitzung.
     */
    async changePassword(userId, sessionId, input) {
      if (await repository.isDemoAccount(userId)) {
        throw forbidden({
          de: 'In der Demo lässt sich das Passwort nicht ändern.',
          en: 'The password cannot be changed in the demo.',
        });
      }

      const user = await repository.findUserById(userId);
      if (!user) throw unauthenticated();

      if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
        throw validationFailed(
          { de: 'Das Passwort wurde nicht geändert.', en: 'The password was not changed.' },
          { currentPassword: [{ de: 'Stimmt nicht', en: 'Incorrect' }] },
        );
      }

      await repository.updatePasswordHash(userId, await hashPassword(input.newPassword));
      await repository.endOtherSessions(userId, sessionId);
    },
  };
}
