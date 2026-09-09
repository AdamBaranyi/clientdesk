import { and, eq, sql } from 'drizzle-orm';
import { projects, type Database } from '@clientdesk/db';
import type {
  ListResponse,
  Project,
  ProjectInput,
  ProjectListQuery,
  ProjectStatus,
  ProjectUpdate,
} from '@clientdesk/contracts';
import { HttpError, notFound, validationFailed } from '../../lib/http-error.ts';
import { recordActivity } from '../../lib/activity.ts';
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

export function createProjectService(db: Database, repository: ProjectRepository) {
  async function requireProject(
    workspaceId: string,
    projectId: string,
    today: string,
  ): Promise<ProjectRow> {
    const row = await repository.findById(workspaceId, projectId, today);
    if (!row) throw notFound('Projekt nicht gefunden.');
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
      const customer = await repository.findAssignableCustomer(workspaceId, input.customerId);
      if (!customer) {
        throw validationFailed('Kunde gehört nicht zu diesem Workspace.', {
          customerId: ['Unbekannter Kunde'],
        });
      }
      if (customer.archivedAt) {
        throw validationFailed('Für einen archivierten Kunden kann kein Projekt entstehen.', {
          customerId: ['Kunde ist archiviert'],
        });
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

        if (!created) throw new HttpError('INTERNAL', 'Projekt konnte nicht angelegt werden.');

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
            `Noch ${open} offene Meilensteine. Zum Abschliessen ist eine Begründung nötig.`,
            { completionReason: ['Begründung erforderlich'] },
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
          throw new HttpError(
            'VERSION_CONFLICT',
            'Das Projekt wurde inzwischen von jemand anderem geändert. Bitte neu laden.',
          );
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
