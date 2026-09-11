import { and, eq, lt, sql } from 'drizzle-orm';
import { customers, documents, memberships, users, workspaces, type Database } from '@tallyroom/db';

export function createDemoRepository(db: Database) {
  return {
    /** Wie viele Demos gerade laufen — Grundlage für die Mengenbegrenzung. */
    async activeDemoCount(): Promise<number> {
      const [row] = await db
        .select({ value: sql<number>`COUNT(*)::int` })
        .from(workspaces)
        .where(and(eq(workspaces.isDemo, true), sql`${workspaces.expiresAt} > now()`));
      return row?.value ?? 0;
    },

    async findWorkspace(workspaceId: string) {
      const [row] = await db
        .select({
          id: workspaces.id,
          isDemo: workspaces.isDemo,
          expiresAt: workspaces.expiresAt,
        })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);
      return row;
    },

    /**
     * Die wechselbaren Identitäten eines Demo-Workspace. Die Abfrage ist fest
     * auf diesen einen Workspace beschränkt — es gibt keine Variante, die
     * Konten ausserhalb liefern könnte.
     */
    async identities(workspaceId: string) {
      return db
        .select({
          userId: users.id,
          displayName: users.displayName,
          role: memberships.role,
          customerName: customers.name,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .leftJoin(customers, eq(customers.id, memberships.customerId))
        .where(eq(memberships.workspaceId, workspaceId))
        .orderBy(memberships.role, users.displayName);
    },

    /** Abgelaufene Demos samt ihrer Dateien und Sitzungen. */
    async expiredDemos() {
      return db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(and(eq(workspaces.isDemo, true), lt(workspaces.expiresAt, new Date())));
    },

    async documentKeys(workspaceId: string): Promise<string[]> {
      const rows = await db
        .select({ objectKey: documents.objectKey })
        .from(documents)
        .where(eq(documents.workspaceId, workspaceId));
      return rows.map((row) => row.objectKey);
    },

    async memberUserIds(workspaceId: string): Promise<string[]> {
      const rows = await db
        .select({ userId: memberships.userId })
        .from(memberships)
        .where(eq(memberships.workspaceId, workspaceId));
      return rows.map((row) => row.userId);
    },
  };
}

export type DemoRepository = ReturnType<typeof createDemoRepository>;
