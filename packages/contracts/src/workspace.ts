import { z } from 'zod';

export const MEMBERSHIP_ROLES = ['owner', 'member', 'client'] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

/** Interne Rollen sehen Vertragswerte, Notizen und interne Kommentare. */
export const INTERNAL_ROLES: readonly MembershipRole[] = ['owner', 'member'];

export function isInternalRole(role: MembershipRole): boolean {
  return INTERNAL_ROLES.includes(role);
}

export const workspaceSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  timezone: z.string(),
  currency: z.literal('CHF'),
  role: z.enum(MEMBERSHIP_ROLES),
  isDemo: z.boolean(),
  /** Nur bei Rolle client gesetzt. */
  customerId: z.uuid().nullable(),
});

export type WorkspaceSummary = z.infer<typeof workspaceSummarySchema>;
