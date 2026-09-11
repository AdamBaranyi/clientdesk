import { z } from 'zod';
import { workspaceSummarySchema } from './workspace.ts';
import { localized } from './i18n.ts';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(
      1,
      localized({
        de: 'E-Mail ist erforderlich',
        fr: "L'adresse e-mail est obligatoire",
        it: "L'indirizzo e-mail è obbligatorio",
        en: 'Email is required',
      }),
    )
    .max(320)
    .toLowerCase(),
  password: z
    .string()
    .min(
      1,
      localized({
        de: 'Passwort ist erforderlich',
        fr: 'Le mot de passe est obligatoire',
        it: 'La password è obbligatoria',
        en: 'Password is required',
      }),
    )
    .max(1024),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Passwort ändern, mit dem bisherigen als Nachweis. */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(
        1,
        localized({
          de: 'Bisheriges Passwort ist erforderlich',
          fr: 'Le mot de passe actuel est obligatoire',
          it: 'La password attuale è obbligatoria',
          en: 'Current password is required',
        }),
      )
      .max(1024),
    newPassword: z
      .string()
      .min(
        12,
        localized({
          de: 'Mindestens 12 Zeichen',
          fr: 'Au moins 12 caractères',
          it: 'Almeno 12 caratteri',
          en: 'At least 12 characters',
        }),
      )
      .max(1024),
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    ...localized({
      de: 'Das neue Passwort muss sich vom bisherigen unterscheiden',
      fr: "Le nouveau mot de passe doit être différent de l'actuel",
      it: 'La nuova password deve essere diversa da quella attuale',
      en: 'The new password must differ from the current one',
    }),
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

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
