import { and, eq, sql } from 'drizzle-orm';
import { requestComments, serviceRequests, type Database } from '@tallyroom/db';
import {
  isAllowedTransition,
  type CommentInput,
  type ListResponse,
  type RequestComment,
  type RequestInput,
  type RequestListQuery,
  type RequestStatus,
  type RequestUpdate,
  type ServiceRequest,
} from '@tallyroom/contracts';
import { HttpError, notFound, validationFailed } from '../../lib/http-error.ts';
import { recordActivity } from '../../lib/activity.ts';
import type { DemoLimits } from '../demo/limits.ts';
import { findExistingResult, hashRequest, recordResult } from '../../lib/idempotency.ts';
import type { RequestRepository } from './repository.ts';

interface Row {
  id: string;
  customerId: string;
  customerName: string;
  projectId: string | null;
  projectName: string | null;
  subject: string;
  body: string;
  priority: 'normal' | 'high';
  status: RequestStatus;
  assignedTo: string | null;
  assignedToName: string | null;
  createdByName: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  commentCount: number;
}

function toDto(row: Row): ServiceRequest {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toComment(row: {
  id: string;
  authorName: string | null;
  visibility: 'public' | 'internal';
  body: string;
  createdAt: Date;
}): RequestComment {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export function createRequestService(
  db: Database,
  repository: RequestRepository,
  demoLimits: DemoLimits,
) {
  async function require(workspaceId: string, requestId: string): Promise<Row> {
    const row = await repository.findById(workspaceId, requestId);
    if (!row)
      throw notFound({
        de: 'Anfrage nicht gefunden.',
        fr: 'Demande introuvable.',
        it: 'Richiesta non trovata.',
        en: 'Request not found.',
      });
    return row as Row;
  }

  /** Ein Projekt darf nur einer Anfrage desselben Kunden zugeordnet werden. */
  async function assertProjectMatches(
    workspaceId: string,
    projectId: string | null | undefined,
    customerId: string,
  ): Promise<void> {
    if (!projectId) return;
    const matches = await repository.projectBelongsToCustomer(workspaceId, projectId, customerId);
    if (!matches) {
      throw validationFailed(
        {
          de: 'Das Projekt gehört nicht zu diesem Kunden.',
          fr: "Ce projet n'appartient pas à ce client.",
          it: 'Questo progetto non appartiene a questo cliente.',
          en: 'This project does not belong to this customer.',
        },
        {
          projectId: [
            {
              de: 'Projekt passt nicht zum Kunden',
              fr: 'Le projet ne correspond pas au client',
              it: 'Il progetto non corrisponde al cliente',
              en: 'Project does not match the customer',
            },
          ],
        },
      );
    }
  }

  return {
    async list(
      workspaceId: string,
      query: RequestListQuery,
      page: { page: number; pageSize: number },
    ): Promise<ListResponse<ServiceRequest>> {
      const { rows, total } = await repository.list(workspaceId, query, {
        offset: (page.page - 1) * page.pageSize,
        limit: page.pageSize,
      });
      return {
        data: (rows as Row[]).map(toDto),
        pagination: {
          page: page.page,
          pageSize: page.pageSize,
          totalItems: total,
          totalPages: Math.max(1, Math.ceil(total / page.pageSize)),
        },
      };
    },

    async get(workspaceId: string, requestId: string): Promise<ServiceRequest> {
      return toDto(await require(workspaceId, requestId));
    },

    async listComments(workspaceId: string, requestId: string): Promise<RequestComment[]> {
      await require(workspaceId, requestId);
      const rows = await repository.listComments(workspaceId, requestId, false);
      return rows.map(toComment);
    },

    /**
     * Ein Doppelklick darf keine zweite Anfrage erzeugen. Mit demselben
     * Idempotency-Key und gleichem Inhalt kommt die erste Anfrage zurück;
     * bei anderem Inhalt ist es ein Konflikt und kein Wiederholungsversuch.
     */
    async create(
      workspaceId: string,
      actorId: string,
      input: RequestInput,
      idempotencyKey?: string,
    ): Promise<ServiceRequest> {
      await demoLimits.assertBelowLimit(workspaceId, 'requests');

      const customer = await repository.customerExists(workspaceId, input.customerId);
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
      await assertProjectMatches(workspaceId, input.projectId, input.customerId);

      const scope = idempotencyKey
        ? {
            workspaceId,
            userId: actorId,
            operation: 'request.create',
            key: idempotencyKey,
            requestHash: hashRequest(input),
          }
        : null;

      if (scope) {
        const existing = await findExistingResult(db, scope);
        if (existing) return this.get(workspaceId, existing);
      }

      const id = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(serviceRequests)
          .values({
            workspaceId,
            customerId: input.customerId,
            projectId: input.projectId ?? null,
            createdBy: actorId,
            assignedTo: input.assignedTo ?? null,
            subject: input.subject.trim(),
            body: input.body.trim(),
            priority: input.priority,
          })
          .returning({ id: serviceRequests.id });

        if (!created)
          throw new HttpError('INTERNAL', {
            de: 'Anfrage konnte nicht angelegt werden.',
            fr: "La demande n'a pas pu être créée.",
            it: 'Non è stato possibile creare la richiesta.',
            en: 'The request could not be created.',
          });

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'request.created',
          entityType: 'request',
          entityId: created.id,
          metadata: { customerId: input.customerId, priority: input.priority },
        });

        if (scope) await recordResult(tx, scope, created.id);
        return created.id;
      });

      return this.get(workspaceId, id);
    },

    async update(
      workspaceId: string,
      actorId: string,
      requestId: string,
      input: RequestUpdate,
    ): Promise<ServiceRequest> {
      const existing = await require(workspaceId, requestId);
      const { version, ...fields } = input;
      await assertProjectMatches(workspaceId, fields.projectId, existing.customerId);

      const changed = Object.keys(fields).filter(
        (key) => fields[key as keyof typeof fields] !== undefined,
      );
      if (changed.length === 0) return toDto(existing);

      await db.transaction(async (tx) => {
        const updated = await tx
          .update(serviceRequests)
          .set({
            ...(fields.priority !== undefined ? { priority: fields.priority } : {}),
            ...(fields.assignedTo !== undefined ? { assignedTo: fields.assignedTo } : {}),
            ...(fields.projectId !== undefined ? { projectId: fields.projectId } : {}),
            version: sql`${serviceRequests.version} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(serviceRequests.workspaceId, workspaceId),
              eq(serviceRequests.id, requestId),
              eq(serviceRequests.version, version),
            ),
          )
          .returning({ id: serviceRequests.id });

        if (updated.length === 0) {
          throw new HttpError('VERSION_CONFLICT', {
            de: 'Die Anfrage wurde inzwischen geändert. Bitte neu laden.',
            fr: 'La demande a été modifiée entre-temps. Veuillez recharger la page.',
            it: 'La richiesta è stata modificata nel frattempo. Ricarichi la pagina.',
            en: 'This request has been changed in the meantime. Please reload.',
          });
        }

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'request.updated',
          entityType: 'request',
          entityId: requestId,
          metadata: { changedFields: changed },
        });
      });

      return this.get(workspaceId, requestId);
    },

    async changeStatus(
      workspaceId: string,
      actorId: string,
      requestId: string,
      status: RequestStatus,
      version: number,
    ): Promise<ServiceRequest> {
      const existing = await require(workspaceId, requestId);
      if (!isAllowedTransition(existing.status, status)) {
        throw validationFailed(
          {
            de: `Übergang von ${existing.status} zu ${status} ist nicht erlaubt.`,
            fr: `Le passage de ${existing.status} à ${status} n'est pas autorisé.`,
            it: `Il passaggio da ${existing.status} a ${status} non è consentito.`,
            en: `Changing from ${existing.status} to ${status} is not allowed.`,
          },
          {
            status: [
              {
                de: 'Nicht erlaubter Übergang',
                fr: 'Passage non autorisé',
                it: 'Passaggio non consentito',
                en: 'Transition not allowed',
              },
            ],
          },
        );
      }

      await db.transaction(async (tx) => {
        const updated = await tx
          .update(serviceRequests)
          .set({ status, version: sql`${serviceRequests.version} + 1`, updatedAt: new Date() })
          .where(
            and(
              eq(serviceRequests.workspaceId, workspaceId),
              eq(serviceRequests.id, requestId),
              eq(serviceRequests.version, version),
            ),
          )
          .returning({ id: serviceRequests.id });

        if (updated.length === 0) {
          throw new HttpError('VERSION_CONFLICT', {
            de: 'Die Anfrage wurde inzwischen geändert. Bitte neu laden.',
            fr: 'La demande a été modifiée entre-temps. Veuillez recharger la page.',
            it: 'La richiesta è stata modificata nel frattempo. Ricarichi la pagina.',
            en: 'This request has been changed in the meantime. Please reload.',
          });
        }

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'request.status_changed',
          entityType: 'request',
          entityId: requestId,
          metadata: { from: existing.status, to: status },
        });
      });

      return this.get(workspaceId, requestId);
    },

    async addComment(
      workspaceId: string,
      actorId: string,
      requestId: string,
      input: CommentInput,
    ): Promise<RequestComment[]> {
      await require(workspaceId, requestId);

      await db.transaction(async (tx) => {
        await tx.insert(requestComments).values({
          workspaceId,
          requestId,
          authorId: actorId,
          visibility: input.visibility,
          body: input.body.trim(),
        });

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'request.commented',
          entityType: 'request',
          entityId: requestId,
          // Der Text selbst gehört nicht ins Protokoll, nur die Sichtbarkeit.
          metadata: { visibility: input.visibility },
        });
      });

      return this.listComments(workspaceId, requestId);
    },
  };
}

export type RequestService = ReturnType<typeof createRequestService>;
