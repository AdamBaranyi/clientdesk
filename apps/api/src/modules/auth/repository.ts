import { and, eq } from 'drizzle-orm';
import type { Database } from '@clientdesk/db';
import { memberships, users, workspaces } from '@clientdesk/db';

export interface AuthRepository {
  findUserByEmail: (normalizedEmail: string) => Promise<UserRecord | undefined>;
  findUserById: (userId: string) => Promise<UserRecord | undefined>;
  listMemberships: (userId: string) => Promise<MembershipRecord[]>;
  findMembership: (userId: string, workspaceId: string) => Promise<MembershipRecord | undefined>;
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
  };
}
