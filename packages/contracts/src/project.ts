import { z } from 'zod';
import { localized } from './i18n.ts';
import { VALIDATION } from './validation-messages.ts';

export const PROJECT_STATUS = ['planned', 'active', 'paused', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];

/** Status, die als „laufend" gelten und eine Archivierung des Kunden blockieren. */
export const RUNNING_PROJECT_STATUS: readonly ProjectStatus[] = ['planned', 'active', 'paused'];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, localized(VALIDATION.isoDate));

export const projectInputSchema = z
  .object({
    customerId: z.uuid(),
    name: z.string().trim().min(1, localized(VALIDATION.nameRequired)).max(200),
    description: z.string().trim().max(4000).nullish(),
    internalNote: z.string().trim().max(4000).nullish(),
    ownerUserId: z.uuid().nullish(),
    startDate: isoDate,
    targetDate: isoDate.nullish(),
    clientVisible: z.boolean().default(false),
  })
  .refine((value) => !value.targetDate || value.targetDate >= value.startDate, {
    ...localized({
      de: 'Zieltermin darf nicht vor dem Start liegen',
      fr: 'La date cible ne peut pas être antérieure au début',
      it: "La data obiettivo non può essere precedente all'inizio",
      en: 'The target date cannot be before the start',
    }),
    path: ['targetDate'],
  });

export type ProjectInput = z.infer<typeof projectInputSchema>;

/**
 * Vor der Validierung: clientVisible hat einen Default und ist deshalb im
 * Eingabetyp optional, im Ergebnis aber gesetzt. Formulare brauchen diese
 * Fassung, sonst passt der Resolver-Typ nicht.
 */
export type ProjectFormValues = z.input<typeof projectInputSchema>;

export const projectUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(4000).nullish(),
  internalNote: z.string().trim().max(4000).nullish(),
  ownerUserId: z.uuid().nullish(),
  startDate: isoDate.optional(),
  targetDate: isoDate.nullish(),
  clientVisible: z.boolean().optional(),
  status: z.enum(PROJECT_STATUS).optional(),
  /** Pflicht, wenn ein Projekt ohne alle erledigten Meilensteine geschlossen wird. */
  completionReason: z.string().trim().min(10).max(1000).optional(),
  version: z.number().int().min(1),
});

export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;

/**
 * Fortschritt wird nicht gespeichert, sondern aus den Meilensteinen berechnet.
 * Bei null Meilensteinen ist er null und nicht 100 Prozent — die Oberfläche
 * zeigt dann „Noch keine Meilensteine".
 */
export const projectSchema = z.object({
  id: z.uuid(),
  customerId: z.uuid(),
  customerName: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  internalNote: z.string().nullable(),
  ownerUserId: z.uuid().nullable(),
  ownerName: z.string().nullable(),
  status: z.enum(PROJECT_STATUS),
  startDate: z.string(),
  targetDate: z.string().nullable(),
  clientVisible: z.boolean(),
  milestoneCount: z.number().int(),
  milestonesDone: z.number().int(),
  progress: z.number().min(0).max(1).nullable(),
  overdueMilestones: z.number().int(),
  version: z.number().int(),
});

export type Project = z.infer<typeof projectSchema>;

export const PROJECT_SORT_FIELDS = ['name', 'targetDate', 'status', 'customerName'] as const;
export type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[number];

export const projectListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  customerId: z.uuid().optional(),
  status: z.enum(PROJECT_STATUS).optional(),
  sort: z.enum(PROJECT_SORT_FIELDS).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;
