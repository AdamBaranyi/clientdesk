import { z } from 'zod';
import { localized } from './i18n.ts';
import { VALIDATION } from './validation-messages.ts';

export const REQUEST_PRIORITY = ['normal', 'high'] as const;
export type RequestPriority = (typeof REQUEST_PRIORITY)[number];

export const REQUEST_STATUS = ['open', 'in_progress', 'waiting_customer', 'resolved'] as const;
export type RequestStatus = (typeof REQUEST_STATUS)[number];

/** Zählt als offen im Sinne der Kennzahl und der Archivierungsregel. */
export const OPEN_REQUEST_STATUS: readonly RequestStatus[] = [
  'open',
  'in_progress',
  'waiting_customer',
];

/**
 * Erlaubte Statusübergänge. Erneutes Öffnen ist ausdrücklich zulässig —
 * ein erledigter Fall kann wieder auftauchen.
 */
export const ALLOWED_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  open: ['in_progress', 'waiting_customer', 'resolved'],
  in_progress: ['open', 'waiting_customer', 'resolved'],
  waiting_customer: ['open', 'in_progress', 'resolved'],
  resolved: ['open', 'in_progress'],
};

export function isAllowedTransition(from: RequestStatus, to: RequestStatus): boolean {
  return from === to || (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

export const requestInputSchema = z.object({
  customerId: z.uuid(),
  projectId: z.uuid().nullish(),
  subject: z.string().trim().min(1, localized(VALIDATION.subjectRequired)).max(200),
  body: z.string().trim().min(1, localized(VALIDATION.messageRequired)).max(8000),
  priority: z.enum(REQUEST_PRIORITY).default('normal'),
  assignedTo: z.uuid().nullish(),
});

export type RequestInput = z.infer<typeof requestInputSchema>;
export type RequestFormValues = z.input<typeof requestInputSchema>;

/** Was ein Kundenbenutzer beim Erstellen schicken darf — ohne Zuweisung und Priorität. */
export const clientRequestInputSchema = z.object({
  projectId: z.uuid().nullish(),
  subject: z.string().trim().min(1, localized(VALIDATION.subjectRequired)).max(200),
  body: z.string().trim().min(1, localized(VALIDATION.messageRequired)).max(8000),
});

export type ClientRequestInput = z.infer<typeof clientRequestInputSchema>;

export const requestUpdateSchema = z.object({
  priority: z.enum(REQUEST_PRIORITY).optional(),
  assignedTo: z.uuid().nullish(),
  projectId: z.uuid().nullish(),
  version: z.number().int().min(1),
});

export type RequestUpdate = z.infer<typeof requestUpdateSchema>;

export const requestStatusChangeSchema = z.object({
  status: z.enum(REQUEST_STATUS),
  version: z.number().int().min(1),
});

export const COMMENT_VISIBILITY = ['public', 'internal'] as const;
export type CommentVisibility = (typeof COMMENT_VISIBILITY)[number];

export const commentInputSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, localized({ de: 'Kommentar darf nicht leer sein', en: 'A comment cannot be empty' }))
    .max(8000),
  visibility: z.enum(COMMENT_VISIBILITY).default('internal'),
});

export type CommentInput = z.infer<typeof commentInputSchema>;
export type CommentFormValues = z.input<typeof commentInputSchema>;

export const requestCommentSchema = z.object({
  id: z.uuid(),
  authorName: z.string().nullable(),
  visibility: z.enum(COMMENT_VISIBILITY),
  body: z.string(),
  createdAt: z.string(),
});

export type RequestComment = z.infer<typeof requestCommentSchema>;

/**
 * Der öffentliche Kommentar für die Kundenansicht führt das Feld visibility
 * gar nicht — es gibt dort nichts zu unterscheiden, weil interne Kommentare
 * die Servergrenze nie überschreiten.
 */
export const clientCommentSchema = requestCommentSchema.omit({ visibility: true });
export type ClientComment = z.infer<typeof clientCommentSchema>;

export const serviceRequestSchema = z.object({
  id: z.uuid(),
  customerId: z.uuid(),
  customerName: z.string(),
  projectId: z.uuid().nullable(),
  projectName: z.string().nullable(),
  subject: z.string(),
  body: z.string(),
  priority: z.enum(REQUEST_PRIORITY),
  status: z.enum(REQUEST_STATUS),
  assignedTo: z.uuid().nullable(),
  assignedToName: z.string().nullable(),
  createdByName: z.string().nullable(),
  version: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  commentCount: z.number().int(),
});

export type ServiceRequest = z.infer<typeof serviceRequestSchema>;

/** Kundenansicht: ohne Zuweisung, ohne Priorität, ohne interne Zähler. */
export const clientRequestSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid().nullable(),
  projectName: z.string().nullable(),
  subject: z.string(),
  body: z.string(),
  status: z.enum(REQUEST_STATUS),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ClientRequest = z.infer<typeof clientRequestSchema>;

export const REQUEST_SORT_FIELDS = ['updatedAt', 'createdAt', 'subject'] as const;

export const requestListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  customerId: z.uuid().optional(),
  status: z.enum(REQUEST_STATUS).optional(),
  priority: z.enum(REQUEST_PRIORITY).optional(),
  sort: z.enum(REQUEST_SORT_FIELDS).default('updatedAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export type RequestListQuery = z.infer<typeof requestListQuerySchema>;
