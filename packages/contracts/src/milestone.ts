import { z } from 'zod';
import { localized } from './i18n.ts';
import { VALIDATION } from './validation-messages.ts';

export const MILESTONE_STATUS = ['open', 'done'] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUS)[number];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, localized(VALIDATION.isoDate));

export const milestoneInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(
      1,
      localized({
        de: 'Titel ist erforderlich',
        fr: 'Le titre est obligatoire',
        it: 'Il titolo è obbligatorio',
        en: 'Title is required',
      }),
    )
    .max(200),
  description: z.string().trim().max(2000).nullish(),
  dueDate: isoDate.nullish(),
});

export type MilestoneInput = z.infer<typeof milestoneInputSchema>;

export const milestoneUpdateSchema = milestoneInputSchema.partial().extend({
  status: z.enum(MILESTONE_STATUS).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type MilestoneUpdate = z.infer<typeof milestoneUpdateSchema>;

export const milestoneSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  dueDate: z.string().nullable(),
  status: z.enum(MILESTONE_STATUS),
  sortOrder: z.number().int(),
  /** Fällig vor dem heutigen Workspace-Datum und noch offen. */
  overdue: z.boolean(),
});

export type Milestone = z.infer<typeof milestoneSchema>;
