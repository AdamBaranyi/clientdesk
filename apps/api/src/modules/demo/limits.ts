import { and, count, eq } from 'drizzle-orm';
import {
  customers,
  projects,
  serviceContracts,
  serviceRequests,
  workspaces,
  type Database,
} from '@clientdesk/db';
import { DEMO_LIMIT_LABELS, DEMO_LIMITS, type DemoLimitedEntity } from '@clientdesk/contracts';
import { HttpError } from '../../lib/http-error.ts';

const TABLES = {
  customers,
  projects,
  contracts: serviceContracts,
  requests: serviceRequests,
} as const;

/**
 * Grenzen gelten ausschliesslich in Demo-Workspaces. Eine private Installation
 * bleibt unbegrenzt — die Zahlen schützen den öffentlichen Demo-Betrieb, nicht
 * die Anwendung.
 */
export function createDemoLimits(db: Database) {
  async function isDemo(workspaceId: string): Promise<boolean> {
    const [workspace] = await db
      .select({ isDemo: workspaces.isDemo })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    return workspace?.isDemo ?? false;
  }

  return {
    isDemo,

    /**
     * In der Demo werden keine fremden Dateien angenommen. Stattdessen gibt
     * es ein enthaltenes Beispieldokument — der Testupload lässt sich damit
     * zeigen, ohne dass jemand Beliebiges auf den Server legt.
     */
    async assertUploadAllowed(workspaceId: string): Promise<void> {
      if (!(await isDemo(workspaceId))) return;
      throw new HttpError(
        'FORBIDDEN',
        'In der Demo werden keine eigenen Dateien angenommen. Nutzen Sie das enthaltene Beispieldokument.',
      );
    },

    async assertBelowLimit(workspaceId: string, entity: DemoLimitedEntity): Promise<void> {
      if (!(await isDemo(workspaceId))) return;

      const table = TABLES[entity];
      const [row] = await db
        .select({ value: count() })
        .from(table)
        .where(and(eq(table.workspaceId, workspaceId)));

      const limit = DEMO_LIMITS[entity];
      if ((row?.value ?? 0) >= limit) {
        throw new HttpError(
          'VALIDATION_FAILED',
          `In der Demo sind höchstens ${limit} ${DEMO_LIMIT_LABELS[entity]} möglich.`,
          { limit: [`Grenze von ${limit} erreicht`] },
        );
      }
    },
  };
}

export type DemoLimits = ReturnType<typeof createDemoLimits>;
