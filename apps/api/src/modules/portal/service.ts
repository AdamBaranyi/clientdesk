import { and, eq, sql } from 'drizzle-orm';
import { requestComments, serviceRequests, type Database } from '@clientdesk/db';
import type {
  ClientComment,
  ClientContract,
  ClientDocument,
  ClientProject,
  ClientRequest,
  ClientRequestInput,
  PortalOverview,
} from '@clientdesk/contracts';
import { HttpError, notFound, validationFailed } from '../../lib/http-error.ts';
import { recordActivity } from '../../lib/activity.ts';
import type { DemoLimits } from '../demo/limits.ts';
import { findExistingResult, hashRequest, recordResult } from '../../lib/idempotency.ts';
import { todayInTimezone } from '../../lib/workspace-date.ts';
import type { DocumentStorage } from '../../storage/types.ts';
import type { PortalRepository } from './repository.ts';

export interface PortalScope {
  workspaceId: string;
  workspaceName: string;
  customerId: string;
  userId: string;
  timezone: string;
}

export function createPortalService(
  db: Database,
  repository: PortalRepository,
  storage: DocumentStorage,
  demoLimits: DemoLimits,
) {
  async function projectsWithMilestones(scope: PortalScope): Promise<ClientProject[]> {
    const rows = await repository.projects(scope.workspaceId, scope.customerId);
    const today = todayInTimezone(scope.timezone);
    const upcoming = await repository.nextMilestones(
      scope.workspaceId,
      rows.map((row) => row.id),
    );

    return rows.map((row) => {
      const next = upcoming.find((milestone) => milestone.projectId === row.id);
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        status: row.status,
        startDate: row.startDate,
        targetDate: row.targetDate,
        milestoneCount: row.milestoneCount,
        milestonesDone: row.milestonesDone,
        progress: row.milestoneCount === 0 ? null : row.milestonesDone / row.milestoneCount,
        nextMilestone: next
          ? {
              title: next.title,
              dueDate: next.dueDate,
              overdue: next.dueDate !== null && next.dueDate < today,
            }
          : null,
      };
    });
  }

  function toRequest(row: {
    id: string;
    projectId: string | null;
    projectName: string | null;
    subject: string;
    body: string;
    status: ClientRequest['status'];
    createdAt: Date;
    updatedAt: Date;
  }): ClientRequest {
    return {
      id: row.id,
      projectId: row.projectId,
      projectName: row.projectName,
      subject: row.subject,
      body: row.body,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  return {
    async overview(scope: PortalScope): Promise<PortalOverview> {
      const customer = await repository.customer(scope.workspaceId, scope.customerId);
      if (!customer) throw notFound('Kunde nicht gefunden.');

      const [projects, requests, documents] = await Promise.all([
        projectsWithMilestones(scope),
        repository.requests(scope.workspaceId, scope.customerId),
        repository.documents(scope.workspaceId, scope.customerId),
      ]);

      return {
        workspaceName: scope.workspaceName,
        customerName: customer.name,
        projects,
        openRequests: requests.filter((row) => row.status !== 'resolved').map(toRequest),
        documents: documents.map(toDocument),
      };
    },

    projects: projectsWithMilestones,

    async contracts(scope: PortalScope): Promise<ClientContract[]> {
      const today = todayInTimezone(scope.timezone);
      const rows = await repository.contracts(scope.workspaceId, scope.customerId, today);
      return rows.map((row) => ({
        ...row,
        active: row.startDate <= today && (row.endDate === null || today < row.endDate),
      }));
    },

    async requests(scope: PortalScope): Promise<ClientRequest[]> {
      const rows = await repository.requests(scope.workspaceId, scope.customerId);
      return rows.map(toRequest);
    },

    async request(
      scope: PortalScope,
      requestId: string,
    ): Promise<{ request: ClientRequest; comments: ClientComment[] }> {
      const row = await repository.request(scope.workspaceId, scope.customerId, requestId);
      if (!row) throw notFound('Anfrage nicht gefunden.');

      const comments = await repository.publicComments(scope.workspaceId, requestId);
      return {
        request: toRequest(row),
        comments: comments.map((comment) => ({
          ...comment,
          createdAt: comment.createdAt.toISOString(),
        })),
      };
    },

    async documents(scope: PortalScope): Promise<ClientDocument[]> {
      const rows = await repository.documents(scope.workspaceId, scope.customerId);
      return rows.map(toDocument);
    },

    assignableProjects(scope: PortalScope) {
      return repository.assignableProjects(scope.workspaceId, scope.customerId);
    },

    /**
     * Kunde und zulässige Projektliste kommen vom Server. Der Kunde schickt
     * keine customerId mit — sie stammt aus seiner Mitgliedschaft.
     */
    async createRequest(
      scope: PortalScope,
      input: ClientRequestInput,
      idempotencyKey?: string,
    ): Promise<ClientRequest> {
      await demoLimits.assertBelowLimit(scope.workspaceId, 'requests');

      if (input.projectId) {
        const allowed = await repository.assignableProjects(scope.workspaceId, scope.customerId);
        if (!allowed.some((project) => project.id === input.projectId)) {
          throw validationFailed('Dieses Projekt steht nicht zur Auswahl.', {
            projectId: ['Unbekanntes Projekt'],
          });
        }
      }

      const idScope = idempotencyKey
        ? {
            workspaceId: scope.workspaceId,
            userId: scope.userId,
            operation: 'portal.request.create',
            key: idempotencyKey,
            requestHash: hashRequest(input),
          }
        : null;

      if (idScope) {
        const existing = await findExistingResult(db, idScope);
        if (existing) return (await this.request(scope, existing)).request;
      }

      const id = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(serviceRequests)
          .values({
            workspaceId: scope.workspaceId,
            customerId: scope.customerId,
            projectId: input.projectId ?? null,
            createdBy: scope.userId,
            subject: input.subject.trim(),
            body: input.body.trim(),
          })
          .returning({ id: serviceRequests.id });

        if (!created) throw new HttpError('INTERNAL', 'Anfrage konnte nicht angelegt werden.');

        await recordActivity(tx, {
          workspaceId: scope.workspaceId,
          actorId: scope.userId,
          action: 'request.created',
          entityType: 'request',
          entityId: created.id,
          metadata: { customerId: scope.customerId, priority: 'normal' },
        });

        if (idScope) await recordResult(tx, idScope, created.id);
        return created.id;
      });

      return (await this.request(scope, id)).request;
    },

    /**
     * Ein Kundenkommentar ist immer öffentlich — die Sichtbarkeit kommt nicht
     * aus dem Request. Wartet die Anfrage auf den Kunden, wird sie in
     * derselben Transaktion wieder geöffnet.
     */
    async addComment(
      scope: PortalScope,
      requestId: string,
      body: string,
    ): Promise<{ request: ClientRequest; comments: ClientComment[] }> {
      const existing = await repository.request(scope.workspaceId, scope.customerId, requestId);
      if (!existing) throw notFound('Anfrage nicht gefunden.');

      await db.transaction(async (tx) => {
        await tx.insert(requestComments).values({
          workspaceId: scope.workspaceId,
          requestId,
          authorId: scope.userId,
          visibility: 'public',
          body: body.trim(),
        });

        if (existing.status === 'waiting_customer') {
          await tx
            .update(serviceRequests)
            .set({
              status: 'open',
              version: sql`${serviceRequests.version} + 1`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(serviceRequests.workspaceId, scope.workspaceId),
                eq(serviceRequests.id, requestId),
              ),
            );
        } else {
          await tx
            .update(serviceRequests)
            .set({ updatedAt: new Date() })
            .where(
              and(
                eq(serviceRequests.workspaceId, scope.workspaceId),
                eq(serviceRequests.id, requestId),
              ),
            );
        }

        await recordActivity(tx, {
          workspaceId: scope.workspaceId,
          actorId: scope.userId,
          action: 'request.commented',
          entityType: 'request',
          entityId: requestId,
          metadata: { visibility: 'public' },
        });
      });

      return this.request(scope, requestId);
    },

    /** Der Download prüft Freigabe und Kundenzugehörigkeit vor dem Lesen. */
    async downloadDocument(scope: PortalScope, documentId: string) {
      const rows = await repository.documents(scope.workspaceId, scope.customerId);
      const row = rows.find((entry) => entry.id === documentId);
      if (!row) throw notFound('Dokument nicht gefunden.');

      const object = await storage.get(row.objectKey);
      if (!object) throw notFound('Die Datei ist im Speicher nicht mehr vorhanden.');
      return { originalName: row.originalName, bytes: object.bytes };
    },
  };
}

function toDocument(row: {
  id: string;
  projectId: string | null;
  projectName: string | null;
  originalName: string;
  sizeBytes: number;
  createdAt: Date;
}): ClientDocument {
  return {
    id: row.id,
    projectId: row.projectId,
    projectName: row.projectName,
    originalName: row.originalName,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
  };
}

export type PortalService = ReturnType<typeof createPortalService>;
