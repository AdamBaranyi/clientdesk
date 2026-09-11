import { z } from 'zod';
import { localized } from './i18n.ts';
import { VALIDATION } from './validation-messages.ts';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, localized(VALIDATION.isoDate));

export const dashboardQuerySchema = z.object({
  /** Steuert ausschliesslich die Vertragskennzahlen. */
  contractDate: isoDate.optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

export const monthlyValuePointSchema = z.object({
  /** Datum, zu dem gerechnet wurde: Monatsende, für den laufenden Monat heute. */
  date: z.string(),
  label: z.string(),
  amountMinor: z.number().int(),
  /** Der laufende Monat ist noch nicht abgeschlossen und wird so beschriftet. */
  isCurrentMonth: z.boolean(),
});

export type MonthlyValuePoint = z.infer<typeof monthlyValuePointSchema>;

export const dashboardSchema = z.object({
  /**
   * Kunden- und Projektzahlen sind ausdrücklich „aktuell". Für sie gibt es
   * keine Historie, aus der ein Stichtag rekonstruiert werden könnte — sie
   * aus heutigen Statusfeldern zu erfinden wäre eine Behauptung.
   */
  activeCustomers: z.number().int(),
  runningProjects: z.number().int(),
  pausedProjects: z.number().int(),
  /** Zum gewählten Stichtag. */
  contractDate: z.string(),
  monthlyContractValueMinor: z.number().int(),
  confirmedContracts: z.number().int(),
  history: z.array(monthlyValuePointSchema),
});

export type Dashboard = z.infer<typeof dashboardSchema>;
