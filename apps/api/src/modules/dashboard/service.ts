import { and, count, eq, isNull } from 'drizzle-orm';
import { customers, projects, type Database } from '@tallyroom/db';
import type { Dashboard, MonthlyValuePoint } from '@tallyroom/contracts';
import { monthEndPoints, todayInTimezone } from '../../lib/workspace-date.ts';
import { monthlyContractValueMinor } from '../contracts/metrics.ts';

const HISTORY_MONTHS = 6;

export function createDashboardService(db: Database) {
  return {
    /**
     * Der Stichtag steuert ausschliesslich die Vertragskennzahlen. Kunden- und
     * Projektzahlen sind ausdrücklich „aktuell": für sie gibt es keine
     * Historie, aus der sich ein früherer Stand rekonstruieren liesse.
     */
    async load(workspaceId: string, timezone: string, contractDate?: string): Promise<Dashboard> {
      const today = todayInTimezone(timezone);
      const onDate = contractDate ?? today;

      const [customerRows, activeRows, pausedRows, contractValue] = await Promise.all([
        db
          .select({ value: count() })
          .from(customers)
          .where(and(eq(customers.workspaceId, workspaceId), isNull(customers.archivedAt))),
        db
          .select({ value: count() })
          .from(projects)
          .where(and(eq(projects.workspaceId, workspaceId), eq(projects.status, 'active'))),
        db
          .select({ value: count() })
          .from(projects)
          .where(and(eq(projects.workspaceId, workspaceId), eq(projects.status, 'paused'))),
        monthlyContractValueMinor(db, workspaceId, onDate),
      ]);

      const points = monthEndPoints(today, HISTORY_MONTHS);
      const history: MonthlyValuePoint[] = await Promise.all(
        points.map(async (point) => ({
          date: point.date,
          label: point.label,
          isCurrentMonth: point.isCurrentMonth,
          amountMinor: (await monthlyContractValueMinor(db, workspaceId, point.date)).amountMinor,
        })),
      );

      return {
        activeCustomers: customerRows[0]?.value ?? 0,
        runningProjects: activeRows[0]?.value ?? 0,
        pausedProjects: pausedRows[0]?.value ?? 0,
        contractDate: onDate,
        monthlyContractValueMinor: contractValue.amountMinor,
        confirmedContracts: contractValue.contractCount,
        history,
      };
    },
  };
}

export type DashboardService = ReturnType<typeof createDashboardService>;
