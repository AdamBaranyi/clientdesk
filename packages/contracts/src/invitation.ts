import { z } from 'zod';
import { MEMBERSHIP_ROLES } from './workspace.ts';

/** Einladungen laufen ab. Eine Woche ist lang genug und kurz genug. */
export const INVITATION_TTL_HOURS = 168;

export const invitationInputSchema = z
  .object({
    email: z.email('Keine gültige E-Mail-Adresse').max(320),
    role: z.enum(MEMBERSHIP_ROLES),
    /** Bei Rolle client Pflicht, sonst verboten. */
    customerId: z.uuid().nullish(),
  })
  .refine((value) => (value.role === 'client') === Boolean(value.customerId), {
    message: 'Ein Kundenzugang braucht genau einen zugeordneten Kunden',
    path: ['customerId'],
  });

export type InvitationInput = z.infer<typeof invitationInputSchema>;
export type InvitationFormValues = z.input<typeof invitationInputSchema>;

export const invitationSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  role: z.enum(MEMBERSHIP_ROLES),
  customerId: z.uuid().nullable(),
  customerName: z.string().nullable(),
  expiresAt: z.string(),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type Invitation = z.infer<typeof invitationSchema>;

/**
 * Das Klartext-Token wird ausschliesslich direkt nach dem Anlegen einmal
 * zurückgegeben. Gespeichert ist nur sein Hash — eine spätere Abfrage kann
 * den Link nicht erneut liefern.
 */
export const createdInvitationSchema = invitationSchema.extend({
  inviteUrl: z.string(),
});

export type CreatedInvitation = z.infer<typeof createdInvitationSchema>;

/** Was ein Beitretender über die Einladung erfährt, bevor er annimmt. */
export const invitationPreviewSchema = z.object({
  workspaceName: z.string(),
  email: z.string(),
  role: z.enum(MEMBERSHIP_ROLES),
  /** Ob zu dieser E-Mail bereits ein Konto existiert. */
  accountExists: z.boolean(),
});

export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;

export const acceptInvitationSchema = z.object({
  displayName: z.string().trim().min(1).max(200).optional(),
  password: z.string().min(12, 'Mindestens 12 Zeichen').max(1024),
});

export type AcceptInvitation = z.infer<typeof acceptInvitationSchema>;
