import { randomBytes, randomUUID } from 'node:crypto';
import { memberships, users, workspaces, type Database } from '@clientdesk/db';
import { hashPassword } from '@clientdesk/db/auth';
import { attachClientAccounts, seedWorkspaceContent } from '@clientdesk/db/seed';
import { DEMO_LIFETIME_MINUTES, type DemoIdentity, type DemoStatus } from '@clientdesk/contracts';
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
        throw new HttpError(
          'RATE_LIMITED',
          'Derzeit laufen zu viele Demos. Bitte in einigen Minuten erneut versuchen.',
        );
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
        if (!workspace) throw new HttpError('INTERNAL', 'Demo konnte nicht angelegt werden.');

        const internalIds: string[] = [];
        for (const identity of INTERNAL_IDENTITIES) {
          const [user] = await tx
            .insert(users)
            .values({
              normalizedEmail: `${identity.name.toLowerCase().replace(/\s+/g, '.')}.${suffix}@demo.clientdesk.invalid`,
              displayName: identity.name,
              passwordHash: unusablePassword,
            })
            .returning({ id: users.id });
          if (!user) throw new HttpError('INTERNAL', 'Demo-Konto konnte nicht angelegt werden.');

          await tx
            .insert(memberships)
            .values({ workspaceId: workspace.id, userId: user.id, role: identity.role });
          internalIds.push(user.id);
        }

        const ownerUserId = internalIds[0];
        if (!ownerUserId) throw new HttpError('INTERNAL', 'Demo-Owner fehlt.');

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
      if (!workspace?.isDemo || !workspace.expiresAt) throw notFound('Keine Demo.');

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
      if (!workspace?.isDemo) throw notFound('Keine Demo.');
      if (workspace.expiresAt && workspace.expiresAt.getTime() < Date.now()) {
        throw notFound('Diese Demo ist abgelaufen.');
      }

      const identities = await repository.identities(workspaceId);
      if (!identities.some((identity) => identity.userId === currentUserId)) {
        throw notFound('Keine Demo.');
      }
      if (!identities.some((identity) => identity.userId === targetUserId)) {
        throw forbidden('Diese Identität gehört nicht zu dieser Demo.');
      }
    },
  };
}

export type DemoService = ReturnType<typeof createDemoService>;
