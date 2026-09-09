import { z } from 'zod';
import { MEMBERSHIP_ROLES } from './workspace.ts';

/**
 * Grenzen einer Demo. Sie schützen den Server vor einer Demo, die jemand als
 * Datenablage benutzt — und halten die Vorführdaten überschaubar.
 */
export const DEMO_LIMITS = {
  customers: 30,
  projects: 50,
  contracts: 50,
  requests: 100,
} as const;

export type DemoLimitedEntity = keyof typeof DEMO_LIMITS;

export const DEMO_LIMIT_LABELS: Record<DemoLimitedEntity, string> = {
  customers: 'Kunden',
  projects: 'Projekte',
  contracts: 'Verträge',
  requests: 'Anfragen',
};

/** Lebensdauer einer Demo. Danach räumt ein Lauf sie samt Dateien weg. */
export const DEMO_LIFETIME_MINUTES = 60;

/**
 * Wechselbare Identitäten innerhalb der eigenen Demo. Es gibt bewusst keinen
 * frei wählbaren Impersonation-Endpunkt: die Auswahl beschränkt sich auf
 * Konten dieses einen Demo-Workspace.
 */
export const demoIdentitySchema = z.object({
  userId: z.uuid(),
  displayName: z.string(),
  role: z.enum(MEMBERSHIP_ROLES),
  /** Bei Rolle client der zugeordnete Kunde. */
  customerName: z.string().nullable(),
  /** Ob diese Identität gerade angemeldet ist. */
  current: z.boolean(),
});

export type DemoIdentity = z.infer<typeof demoIdentitySchema>;

export const demoSessionSchema = z.object({
  workspaceId: z.uuid(),
  expiresAt: z.string(),
  identities: z.array(demoIdentitySchema),
});

export type DemoSession = z.infer<typeof demoSessionSchema>;

export const demoSwitchSchema = z.object({ userId: z.uuid() });

/** Zustand einer laufenden Demo, für Banner und Rollenwechsel. */
export const demoStatusSchema = z.object({
  isDemo: z.literal(true),
  expiresAt: z.string(),
  minutesLeft: z.number().int(),
  identities: z.array(demoIdentitySchema),
});

export type DemoStatus = z.infer<typeof demoStatusSchema>;
