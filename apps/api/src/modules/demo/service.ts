import { randomBytes, randomUUID } from 'node:crypto';
import { memberships, users, workspaces, type Database } from '@tallyroom/db';
import { hashPassword } from '@tallyroom/db/auth';
import { attachClientAccounts, seedWorkspaceContent } from '@tallyroom/db/seed';
import { DEMO_LIFETIME_MINUTES, type DemoIdentity, type DemoStatus } from '@tallyroom/contracts';
import { forbidden, HttpError, notFound } from '../../lib/http-error.ts';
import type { DocumentStorage } from '../../storage/types.ts';
import type { DemoRepository } from './repository.ts';

/** Höchstzahl gleichzeitig laufender Demos. Schutz vor massenhaftem Anlegen. */
const MAX_ACTIVE_DEMOS = 50;

/**
 * Drei interne Identitäten wie im Auftrag vorgesehen. Sie bekommen zufällige
 * Passwörter: anmelden kann sich damit niemand, erreichbar sind sie nur über
 * den Rollenwechsel innerhalb derselben Demo.
 */
const INTERNAL_IDENTITIES = [
  { name: 'Ádám Baranyi', role: 'owner' as const },
  { name: 'Lena Frei', role: 'member' as const },
  { name: 'Jonas Widmer', role: 'member' as const },
];

export function createDemoService(
  db: Database,
  repository: DemoRepository,
  storage: DocumentStorage,
) {
  function toIdentity(
    row: {
      userId: string;
      displayName: string;
      role: DemoIdentity['role'];
      customerName: string | null;
    },
    currentUserId: string,
  ): DemoIdentity {
    return { ...row, current: row.userId === currentUserId };
  }

  return {
    /**
     * Erzeugt eine eigene, vollständige Datenkopie je Besucher. Es gibt
     * bewusst keine gemeinsam beschreibbare Demo: zwei Besucher dürfen sich
     * nicht gegenseitig die Daten verändern.
     */
    async createSession(): Promise<{ workspaceId: string; ownerUserId: string; expiresAt: Date }> {
      const active = await repository.activeDemoCount();
      if (active >= MAX_ACTIVE_DEMOS) {
        throw new HttpError('RATE_LIMITED', {
          de: 'Derzeit laufen zu viele Demos. Bitte in einigen Minuten erneut versuchen.',
          fr: 'Trop de démos sont en cours. Veuillez réessayer dans quelques minutes.',
          it: 'Al momento sono attive troppe demo. Riprovi tra qualche minuto.',
          en: 'Too many demos are running right now. Please try again in a few minutes.',
        });
      }

      const suffix = randomUUID().slice(0, 8);
      const expiresAt = new Date(Date.now() + DEMO_LIFETIME_MINUTES * 60 * 1000);
      // Ein Passwort, das niemand kennt: die Konten sind nur über den
      // Rollenwechsel erreichbar, nicht über das Anmeldeformular.
      const unusablePassword = await hashPassword(randomBytes(24).toString('base64url'));

      return db.transaction(async (tx) => {
        const [workspace] = await tx
          .insert(workspaces)
          .values({ name: 'Alpenblick & Partner (Demo)', isDemo: true, expiresAt })
          .returning({ id: workspaces.id });
        if (!workspace)
          throw new HttpError('INTERNAL', {
            de: 'Demo konnte nicht angelegt werden.',
            fr: "La démo n'a pas pu être créée.",
            it: 'Non è stato possibile creare la demo.',
            en: 'The demo could not be created.',
          });

        const internalIds: string[] = [];
        for (const identity of INTERNAL_IDENTITIES) {
          const [user] = await tx
            .insert(users)
            .values({
              normalizedEmail: `${identity.name.toLowerCase().replace(/\s+/g, '.')}.${suffix}@demo.tallyroom.invalid`,
              displayName: identity.name,
              passwordHash: unusablePassword,
            })
            .returning({ id: users.id });
          if (!user)
            throw new HttpError('INTERNAL', {
              de: 'Demo-Konto konnte nicht angelegt werden.',
              fr: "Le compte de démo n'a pas pu être créé.",
              it: "Non è stato possibile creare l'account demo.",
              en: 'The demo account could not be created.',
            });

          await tx
            .insert(memberships)
            .values({ workspaceId: workspace.id, userId: user.id, role: identity.role });
          internalIds.push(user.id);
        }

        const ownerUserId = internalIds[0];
        if (!ownerUserId)
          throw new HttpError('INTERNAL', {
            de: 'Demo-Owner fehlt.',
            fr: 'Le propriétaire de la démo est manquant.',
            it: 'Manca il proprietario della demo.',
            en: 'The demo owner is missing.',
          });

        await seedWorkspaceContent(tx, {
          workspaceId: workspace.id,
          ownerUserId,
          attachClients: (customerIds) =>
            attachClientAccounts(
              tx,
              workspace.id,
              customerIds,
              unusablePassword,
              // Eindeutige Adressen je Demo — sonst kollidierten zwei Demos.
              (email) => email.replace('@', `.${suffix}@`),
            ),
          reference: new Date(),
          storage,
        });

        return { workspaceId: workspace.id, ownerUserId, expiresAt };
      });
    },

    async status(workspaceId: string, currentUserId: string): Promise<DemoStatus> {
      const workspace = await repository.findWorkspace(workspaceId);
      if (!workspace?.isDemo || !workspace.expiresAt)
        throw notFound({
          de: 'Keine Demo.',
          fr: "Ce n'est pas une démo.",
          it: 'Non è una demo.',
          en: 'Not a demo.',
        });

      const rows = await repository.identities(workspaceId);
      return {
        isDemo: true,
        expiresAt: workspace.expiresAt.toISOString(),
        minutesLeft: Math.max(0, Math.round((workspace.expiresAt.getTime() - Date.now()) / 60_000)),
        identities: rows.map((row) => toIdentity(row, currentUserId)),
      };
    },

    /**
     * Der Wechsel bleibt auf den eigenen Demo-Workspace beschränkt: die
     * Zielidentität muss Mitglied desselben Workspace sein, in dem der
     * Aufrufer gerade ist. Für normale Konten gibt es diesen Weg nicht —
     * er verlangt einen Workspace mit is_demo.
     */
    async assertSwitchAllowed(
      workspaceId: string,
      currentUserId: string,
      targetUserId: string,
    ): Promise<void> {
      const workspace = await repository.findWorkspace(workspaceId);
      if (!workspace?.isDemo)
        throw notFound({
          de: 'Keine Demo.',
          fr: "Ce n'est pas une démo.",
          it: 'Non è una demo.',
          en: 'Not a demo.',
        });
      if (workspace.expiresAt && workspace.expiresAt.getTime() < Date.now()) {
        throw notFound({
          de: 'Diese Demo ist abgelaufen.',
          fr: 'Cette démo a expiré.',
          it: 'Questa demo è scaduta.',
          en: 'This demo has expired.',
        });
      }

      const identities = await repository.identities(workspaceId);
      if (!identities.some((identity) => identity.userId === currentUserId)) {
        throw notFound({
          de: 'Keine Demo.',
          fr: "Ce n'est pas une démo.",
          it: 'Non è una demo.',
          en: 'Not a demo.',
        });
      }
      if (!identities.some((identity) => identity.userId === targetUserId)) {
        throw forbidden({
          de: 'Diese Identität gehört nicht zu dieser Demo.',
          fr: "Cette identité n'appartient pas à cette démo.",
          it: 'Questa identità non appartiene a questa demo.',
          en: 'This identity does not belong to this demo.',
        });
      }
    },
  };
}

export type DemoService = ReturnType<typeof createDemoService>;
