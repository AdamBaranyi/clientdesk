import { and, eq, sql } from 'drizzle-orm';
import { projects, type Database } from '@tallyroom/db';
import type {
  ListResponse,
  Project,
  ProjectInput,
  ProjectListQuery,
  ProjectStatus,
  ProjectUpdate,
} from '@tallyroom/contracts';
import { HttpError, notFound, validationFailed } from '../../lib/http-error.ts';
import { recordActivity } from '../../lib/activity.ts';
import type { DemoLimits } from '../demo/limits.ts';
import { todayInTimezone } from '../../lib/workspace-date.ts';
import type { ProjectRepository } from './repository.ts';

interface ProjectRow {
  id: string;
  customerId: string;
  customerName: string;
  name: string;
  description: string | null;
  internalNote: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  status: ProjectStatus;
  startDate: string;
  targetDate: string | null;
  clientVisible: boolean;
  version: number;
  milestoneCount: number;
  milestonesDone: number;
  overdueMilestones: number;
}

function toDto(row: ProjectRow): Project {
  return {
    ...row,
    // Kein Fortschritt statt 100 Prozent, solange es keine Meilensteine gibt.
    progress: row.milestoneCount === 0 ? null : row.milestonesDone / row.milestoneCount,
  };
}

function blankToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function createProjectService(
  db: Database,
  repository: ProjectRepository,
  demoLimits: DemoLimits,
) {
  async function requireProject(
    workspaceId: string,
    projectId: string,
    today: string,
  ): Promise<ProjectRow> {
    const row = await repository.findById(workspaceId, projectId, today);
    if (!row)
      throw notFound({
        de: 'Projekt nicht gefunden.',
        fr: 'Projet introuvable.',
        it: 'Progetto non trovato.',
        en: 'Project not found.',
      });
    return row as ProjectRow;
  }

  return {
    async list(
      workspaceId: string,
      timezone: string,
      query: ProjectListQuery,
      page: { page: number; pageSize: number },
    ): Promise<ListResponse<Project>> {
      const today = todayInTimezone(timezone);
      const { rows, total } = await repository.list(
        workspaceId,
        query,
        { offset: (page.page - 1) * page.pageSize, limit: page.pageSize },
        today,
      );
      return {
        data: (rows as ProjectRow[]).map(toDto),
        pagination: {
          page: page.page,
          pageSize: page.pageSize,
          totalItems: total,
          totalPages: Math.max(1, Math.ceil(total / page.pageSize)),
        },
      };
    },

    async get(workspaceId: string, timezone: string, projectId: string): Promise<Project> {
      return toDto(await requireProject(workspaceId, projectId, todayInTimezone(timezone)));
    },

    /**
     * Die Kundenzuordnung wird serverseitig geprüft. Eine customerId aus einem
     * fremden Workspace liefert 422 — sie wird nicht stillschweigend übernommen.
     */
    async create(
      workspaceId: string,
      timezone: string,
      actorId: string,
      input: ProjectInput,
    ): Promise<Project> {
      await demoLimits.assertBelowLimit(workspaceId, 'projects');

      const customer = await repository.findAssignableCustomer(workspaceId, input.customerId);
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
      if (customer.archivedAt) {
        throw validationFailed(
          {
            de: 'Für einen archivierten Kunden kann kein Projekt entstehen.',
            fr: 'Aucun projet ne peut être créé pour un client archivé.',
            it: 'Non è possibile creare un progetto per un cliente archiviato.',
            en: 'An archived customer cannot get a new project.',
          },
          {
            customerId: [
              {
                de: 'Kunde ist archiviert',
                fr: 'Le client est archivé',
                it: 'Il cliente è archiviato',
                en: 'Customer is archived',
              },
            ],
          },
        );
      }

      const id = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(projects)
          .values({
            workspaceId,
            customerId: input.customerId,
            name: input.name.trim(),
            description: blankToNull(input.description),
            internalNote: blankToNull(input.internalNote),
            ownerUserId: input.ownerUserId ?? null,
            startDate: input.startDate,
            targetDate: input.targetDate ?? null,
            clientVisible: input.clientVisible,
          })
          .returning({ id: projects.id, name: projects.name });

        if (!created)
          throw new HttpError('INTERNAL', {
            de: 'Projekt konnte nicht angelegt werden.',
            fr: "Le projet n'a pas pu être créé.",
            it: 'Non è stato possibile creare il progetto.',
            en: 'The project could not be created.',
          });

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'project.created',
          entityType: 'project',
          entityId: created.id,
          metadata: { name: created.name, customerId: input.customerId },
        });
        return created.id;
      });

      return this.get(workspaceId, timezone, id);
    },

    async update(
      workspaceId: string,
      timezone: string,
      actorId: string,
      projectId: string,
      input: ProjectUpdate,
    ): Promise<Project> {
      const today = todayInTimezone(timezone);
      const existing = await requireProject(workspaceId, projectId, today);
      const { version, completionReason, status, ...fields } = input;

      // Abschliessen setzt entweder erledigte Meilensteine oder eine Begründung voraus.
      if (status === 'completed' && existing.status !== 'completed') {
        const open = await repository.openMilestoneCount(workspaceId, projectId);
        if (open > 0 && !completionReason) {
          throw validationFailed(
            {
              de: `Noch ${open} offene Meilensteine. Zum Abschliessen ist eine Begründung nötig.`,
              fr: `Il reste ${open} jalons ouverts. Un motif est nécessaire pour clôturer le projet.`,
              it: `Ci sono ancora ${open} traguardi aperti. Per chiudere il progetto serve una motivazione.`,
              en: `${open} milestones are still open. Closing the project needs a reason.`,
            },
            {
              completionReason: [
                {
                  de: 'Begründung erforderlich',
                  fr: 'Motif obligatoire',
                  it: 'Motivazione obbligatoria',
                  en: 'Reason required',
                },
              ],
            },
          );
        }
      }

      const changed = [
        ...Object.keys(fields).filter((key) => fields[key as keyof typeof fields] !== undefined),
        ...(status !== undefined ? ['status'] : []),
      ];
      if (changed.length === 0) return toDto(existing);

      await db.transaction(async (tx) => {
        const updated = await tx
          .update(projects)
          .set({
            ...(fields.name !== undefined ? { name: fields.name.trim() } : {}),
            ...(fields.description !== undefined
              ? { description: blankToNull(fields.description) }
              : {}),
            ...(fields.internalNote !== undefined
              ? { internalNote: blankToNull(fields.internalNote) }
              : {}),
            ...(fields.ownerUserId !== undefined ? { ownerUserId: fields.ownerUserId } : {}),
            ...(fields.startDate !== undefined ? { startDate: fields.startDate } : {}),
            ...(fields.targetDate !== undefined ? { targetDate: fields.targetDate } : {}),
            ...(fields.clientVisible !== undefined ? { clientVisible: fields.clientVisible } : {}),
            ...(status !== undefined ? { status } : {}),
            version: sql`${projects.version} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projects.workspaceId, workspaceId),
              eq(projects.id, projectId),
              eq(projects.version, version),
            ),
          )
          .returning({ id: projects.id });

        if (updated.length === 0) {
          throw new HttpError('VERSION_CONFLICT', {
            de: 'Das Projekt wurde inzwischen von jemand anderem geändert. Bitte neu laden.',
            fr: "Le projet a été modifié entre-temps par quelqu'un d'autre. Veuillez recharger la page.",
            it: "Il progetto è stato modificato nel frattempo da un'altra persona. Ricarichi la pagina.",
            en: 'Someone else has changed this project in the meantime. Please reload.',
          });
        }

        if (status !== undefined && status !== existing.status) {
          await recordActivity(tx, {
            workspaceId,
            actorId,
            action: 'project.status_changed',
            entityType: 'project',
            entityId: projectId,
            // Die Begründung selbst bleibt draussen; protokolliert wird nur, dass es eine gab.
            metadata: { from: existing.status, to: status, hasReason: Boolean(completionReason) },
          });
        }

        const withoutStatus = changed.filter((key) => key !== 'status');
        if (withoutStatus.length > 0) {
          await recordActivity(tx, {
            workspaceId,
            actorId,
            action: 'project.updated',
            entityType: 'project',
            entityId: projectId,
            metadata: { changedFields: withoutStatus },
          });
        }
      });

      return this.get(workspaceId, timezone, projectId);
    },
  };
}

export type ProjectService = ReturnType<typeof createProjectService>;
