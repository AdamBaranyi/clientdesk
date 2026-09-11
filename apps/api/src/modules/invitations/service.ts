import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { customers, invitations, memberships, users, workspaces } from '@tallyroom/db';
import type { Database } from '@tallyroom/db';
import { hashPassword, normalizeEmail } from '@tallyroom/db/auth';
import {
  INVITATION_TTL_HOURS,
  type AcceptInvitation,
  type CreatedInvitation,
  type Invitation,
  type InvitationInput,
  type InvitationPreview,
} from '@tallyroom/contracts';
import { forbidden, HttpError, notFound, validationFailed } from '../../lib/http-error.ts';
import { recordActivity } from '../../lib/activity.ts';

/**
 * Gespeichert wird nur der Hash. Wer die Datenbank liest, kann daraus keinen
 * gültigen Link bauen — und ein zweites Anzeigen des Links ist unmöglich.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createInvitationService(db: Database, appOrigin: string) {
  return {
    async list(workspaceId: string): Promise<Invitation[]> {
      const rows = await db
        .select({
          id: invitations.id,
          email: invitations.normalizedEmail,
          role: invitations.role,
          customerId: invitations.customerId,
          customerName: customers.name,
          expiresAt: invitations.expiresAt,
          acceptedAt: invitations.acceptedAt,
          createdAt: invitations.createdAt,
        })
        .from(invitations)
        .leftJoin(customers, eq(customers.id, invitations.customerId))
        .where(eq(invitations.workspaceId, workspaceId));

      return rows.map((row) => ({
        ...row,
        expiresAt: row.expiresAt.toISOString(),
        acceptedAt: row.acceptedAt ? row.acceptedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      }));
    },

    /**
     * Rolle und Kundenbezug hängen an der Einladung, nicht am Request des
     * Beitretenden. Wer den Link annimmt, kann daran nichts verändern.
     */
    async create(
      workspaceId: string,
      actorId: string,
      input: InvitationInput,
    ): Promise<CreatedInvitation> {
      const email = normalizeEmail(input.email);

      if (input.customerId) {
        const [customer] = await db
          .select({ id: customers.id })
          .from(customers)
          .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, input.customerId)))
          .limit(1);
        if (!customer) {
          throw validationFailed(
            {
              de: 'Kunde gehört nicht zu diesem Workspace.',
              fr: "Ce client n'appartient pas à cet espace de travail.",
              it: "Questo cliente non appartiene a quest'area di lavoro.",
              en: 'This customer does not belong to this workspace.',
            },
            {
              customerId: [
                {
                  de: 'Unbekannter Kunde',
                  fr: 'Client inconnu',
                  it: 'Cliente sconosciuto',
                  en: 'Unknown customer',
                },
              ],
            },
          );
        }
      }

      const [alreadyMember] = await db
        .select({ id: memberships.id })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(and(eq(memberships.workspaceId, workspaceId), eq(users.normalizedEmail, email)))
        .limit(1);
      if (alreadyMember) {
        throw validationFailed(
          {
            de: 'Dieses Konto ist bereits Mitglied dieses Workspace.',
            fr: 'Ce compte est déjà membre de cet espace de travail.',
            it: "Questo account è già membro di quest'area di lavoro.",
            en: 'This account is already a member of this workspace.',
          },
          {
            email: [
              {
                de: 'Bereits Mitglied',
                fr: 'Déjà membre',
                it: 'Già membro',
                en: 'Already a member',
              },
            ],
          },
        );
      }

      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000);

      const id = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(invitations)
          .values({
            workspaceId,
            normalizedEmail: email,
            role: input.role,
            customerId: input.customerId ?? null,
            tokenHash: hashToken(token),
            invitedBy: actorId,
            expiresAt,
          })
          .returning({ id: invitations.id, createdAt: invitations.createdAt });

        if (!created)
          throw new HttpError('INTERNAL', {
            de: 'Einladung konnte nicht angelegt werden.',
            fr: "L'invitation n'a pas pu être créée.",
            it: "Non è stato possibile creare l'invito.",
            en: 'The invitation could not be created.',
          });

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'invitation.created',
          entityType: 'invitation',
          entityId: created.id,
          metadata: { role: input.role },
        });
        return created.id;
      });

      const entry = (await this.list(workspaceId)).find((item) => item.id === id);
      if (!entry)
        throw new HttpError('INTERNAL', {
          de: 'Einladung nicht auffindbar.',
          fr: "L'invitation est introuvable.",
          it: "L'invito non è reperibile.",
          en: 'The invitation cannot be found.',
        });

      // Das Klartext-Token verlässt den Server genau hier, ein einziges Mal.
      return { ...entry, inviteUrl: `${appOrigin}/join/${token}` };
    },

    async revoke(workspaceId: string, invitationId: string): Promise<void> {
      const deleted = await db
        .delete(invitations)
        .where(
          and(
            eq(invitations.workspaceId, workspaceId),
            eq(invitations.id, invitationId),
            isNull(invitations.acceptedAt),
          ),
        )
        .returning({ id: invitations.id });
      if (deleted.length === 0)
        throw notFound({
          de: 'Einladung nicht gefunden.',
          fr: 'Invitation introuvable.',
          it: 'Invito non trovato.',
          en: 'Invitation not found.',
        });
    },

    async preview(token: string): Promise<InvitationPreview> {
      const record = await this.findValid(token);
      const [account] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.normalizedEmail, record.normalizedEmail))
        .limit(1);

      return {
        workspaceName: record.workspaceName,
        email: record.normalizedEmail,
        role: record.role,
        accountExists: Boolean(account),
      };
    },

    async findValid(token: string) {
      const [record] = await db
        .select({
          id: invitations.id,
          workspaceId: invitations.workspaceId,
          workspaceName: workspaces.name,
          normalizedEmail: invitations.normalizedEmail,
          role: invitations.role,
          customerId: invitations.customerId,
          expiresAt: invitations.expiresAt,
          acceptedAt: invitations.acceptedAt,
        })
        .from(invitations)
        .innerJoin(workspaces, eq(workspaces.id, invitations.workspaceId))
        .where(eq(invitations.tokenHash, hashToken(token)))
        .limit(1);

      // Unbekannt, verbraucht und abgelaufen sind für den Aufrufer dasselbe.
      if (!record || record.acceptedAt !== null || record.expiresAt.getTime() < Date.now()) {
        throw notFound({
          de: 'Diese Einladung ist ungültig oder abgelaufen.',
          fr: "Cette invitation n'est pas valide ou a expiré.",
          it: 'Questo invito non è valido o è scaduto.',
          en: 'This invitation is invalid or has expired.',
        });
      }
      return record;
    },

    /**
     * Annehmen ist atomar: die Einladung wird im selben Schritt entwertet, in
     * dem die Mitgliedschaft entsteht. Ein zweiter Versuch mit demselben Link
     * findet keine offene Einladung mehr.
     */
    async accept(
      token: string,
      input: AcceptInvitation,
      sessionUserId: string | undefined,
    ): Promise<{ userId: string; workspaceId: string }> {
      const record = await this.findValid(token);

      const [existingAccount] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.normalizedEmail, record.normalizedEmail))
        .limit(1);

      // Bei einem bestehenden Konto muss die Identität zur eingeladenen
      // Adresse passen — sonst könnte ein fremder Link ein anderes Konto in
      // den Workspace holen.
      if (existingAccount && sessionUserId !== existingAccount.id) {
        throw forbidden({
          de: 'Zu dieser E-Mail gibt es bereits ein Konto. Bitte zuerst damit anmelden und den Link erneut öffnen.',
          fr: "Un compte existe déjà pour cette adresse e-mail. Veuillez d'abord vous connecter avec ce compte, puis rouvrir le lien.",
          it: 'Esiste già un account per questo indirizzo e-mail. Acceda prima con questo account, poi riapra il link.',
          en: 'An account already exists for this email. Sign in with it first, then open the link again.',
        });
      }

      return db.transaction(async (tx) => {
        const consumed = await tx
          .update(invitations)
          .set({ acceptedAt: new Date() })
          .where(and(eq(invitations.id, record.id), isNull(invitations.acceptedAt)))
          .returning({ id: invitations.id });

        if (consumed.length === 0)
          throw notFound({
            de: 'Diese Einladung wurde bereits verwendet.',
            fr: 'Cette invitation a déjà été utilisée.',
            it: 'Questo invito è già stato utilizzato.',
            en: 'This invitation has already been used.',
          });

        let userId = existingAccount?.id;
        if (!userId) {
          const [created] = await tx
            .insert(users)
            .values({
              normalizedEmail: record.normalizedEmail,
              displayName: input.displayName?.trim() || record.normalizedEmail,
              passwordHash: await hashPassword(input.password),
            })
            .returning({ id: users.id });
          if (!created)
            throw new HttpError('INTERNAL', {
              de: 'Konto konnte nicht angelegt werden.',
              fr: "Le compte n'a pas pu être créé.",
              it: "Non è stato possibile creare l'account.",
              en: 'The account could not be created.',
            });
          userId = created.id;
        }

        await tx.insert(memberships).values({
          workspaceId: record.workspaceId,
          userId,
          role: record.role,
          customerId: record.customerId,
        });

        await recordActivity(tx, {
          workspaceId: record.workspaceId,
          actorId: userId,
          action: 'invitation.accepted',
          entityType: 'membership',
          entityId: userId,
          metadata: { role: record.role },
        });

        return { userId, workspaceId: record.workspaceId };
      });
    },
  };
}

export type InvitationService = ReturnType<typeof createInvitationService>;
