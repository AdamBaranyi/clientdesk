import { z } from 'zod';
import { clientDocumentSchema } from './document.ts';
import { clientRequestSchema } from './service-request.ts';

/** Was ein Kundenbenutzer über sein Projekt sieht — ohne interne Notiz. */
export const clientProjectSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(['planned', 'active', 'paused', 'completed', 'archived']),
  startDate: z.string(),
  targetDate: z.string().nullable(),
  milestoneCount: z.number().int(),
  milestonesDone: z.number().int(),
  progress: z.number().min(0).max(1).nullable(),
  nextMilestone: z
    .object({ title: z.string(), dueDate: z.string().nullable(), overdue: z.boolean() })
    .nullable(),
});

export type ClientProject = z.infer<typeof clientProjectSchema>;

/** Vertrag in der Kundenansicht: Leistungsbeschreibung, kein interner Vermerk. */
export const clientContractSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  publicDescription: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  monthlyAmountMinor: z.number().int().nullable(),
  active: z.boolean(),
});

export type ClientContract = z.infer<typeof clientContractSchema>;

export const portalOverviewSchema = z.object({
  workspaceName: z.string(),
  customerName: z.string(),
  projects: z.array(clientProjectSchema),
  openRequests: z.array(clientRequestSchema),
  documents: z.array(clientDocumentSchema),
});

export type PortalOverview = z.infer<typeof portalOverviewSchema>;
