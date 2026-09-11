import { z } from 'zod';
import { workspaceSummarySchema } from './workspace.ts';
import { localized } from './i18n.ts';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, localized({ de: 'E-Mail ist erforderlich', en: 'Email is required' }))
    .max(320)
    .toLowerCase(),
  password: z
    .string()
    .min(1, localized({ de: 'Passwort ist erforderlich', en: 'Password is required' }))
    .max(1024),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Was ein angemeldeter Nutzer über sich selbst erfährt. Enthält bewusst keine
 * Rolle auf oberster Ebene — Rollen hängen am Workspace, nicht am Konto.
 */
export const sessionUserSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  displayName: z.string(),
  workspaces: z.array(workspaceSummarySchema),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

export const csrfTokenSchema = z.object({ csrfToken: z.string().min(1) });
export type CsrfToken = z.infer<typeof csrfTokenSchema>;

/** Theme-Wahl des Nutzers. „system" folgt der Geräteeinstellung. */
export const THEME_CHOICES = ['system', 'light', 'dark'] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];
