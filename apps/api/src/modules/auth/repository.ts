import { and, eq, ne, sql } from 'drizzle-orm';
import type { Database } from '@tallyroom/db';
import { memberships, sessions, users, workspaces } from '@tallyroom/db';

export interface AuthRepository {
  findUserByEmail: (normalizedEmail: string) => Promise<UserRecord | undefined>;
  findUserById: (userId: string) => Promise<UserRecord | undefined>;
  listMemberships: (userId: string) => Promise<MembershipRecord[]>;
  findMembership: (userId: string, workspaceId: string) => Promise<MembershipRecord | undefined>;
  isDemoAccount: (userId: string) => Promise<boolean>;
  updatePasswordHash: (userId: string, passwordHash: string) => Promise<void>;
  endOtherSessions: (userId: string, keepSessionId: string) => Promise<number>;
}

export interface UserRecord {
  id: string;
  normalizedEmail: string;
  displayName: string;
  passwordHash: string;
}

export interface MembershipRecord {
  workspaceId: string;
  workspaceName: string;
  timezone: string;
  role: 'owner' | 'member' | 'client';
  customerId: string | null;
  isDemo: boolean;
}

export function createAuthRepository(db: Database): AuthRepository {
  const membershipColumns = {
    workspaceId: workspaces.id,
    workspaceName: workspaces.name,
    timezone: workspaces.timezone,
    role: memberships.role,
    customerId: memberships.customerId,
    isDemo: workspaces.isDemo,
  };

  return {
    async findUserByEmail(normalizedEmail) {
      const [row] = await db
        .select({
          id: users.id,
          normalizedEmail: users.normalizedEmail,
          displayName: users.displayName,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.normalizedEmail, normalizedEmail))
        .limit(1);
      return row;
    },

    async findUserById(userId) {
      const [row] = await db
        .select({
          id: users.id,
          normalizedEmail: users.normalizedEmail,
          displayName: users.displayName,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return row;
    },

    async listMemberships(userId) {
      return db
        .select(membershipColumns)
        .from(memberships)
        .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
        .where(eq(memberships.userId, userId))
        .orderBy(workspaces.name);
    },

    /**
     * Einzige Stelle, an der eine Workspace-Zugehörigkeit entsteht. Eine
     * workspaceId aus der URL ist nur eine Auswahl, keine Berechtigung.
     */
    async findMembership(userId, workspaceId) {
      const [row] = await db
        .select(membershipColumns)
        .from(memberships)
        .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
        .where(and(eq(memberships.userId, userId), eq(memberships.workspaceId, workspaceId)))
        .limit(1);
      return row;
    },

    async isDemoAccount(userId) {
      const [row] = await db
        .select({ id: workspaces.id })
        .from(memberships)
        .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
        .where(and(eq(memberships.userId, userId), eq(workspaces.isDemo, true)))
        .limit(1);
      return row !== undefined;
    },

    async updatePasswordHash(userId, passwordHash) {
      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));
    },

    /** Die Kennung des Kontos steckt im gespeicherten JSON der Sitzung. */
    async endOtherSessions(userId, keepSessionId) {
      const ended = await db
        .delete(sessions)
        .where(and(eq(sql`${sessions.sess}->>'userId'`, userId), ne(sessions.sid, keepSessionId)))
        .returning({ sid: sessions.sid });
      return ended.length;
    },
  };
}
