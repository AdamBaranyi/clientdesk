import { and, eq } from 'drizzle-orm';
import { milestones, type Database } from '@tallyroom/db';
import type { Milestone, MilestoneInput, MilestoneUpdate } from '@tallyroom/contracts';
import { HttpError, notFound } from '../../lib/http-error.ts';
import { recordActivity } from '../../lib/activity.ts';
import { todayInTimezone } from '../../lib/workspace-date.ts';
import type { ProjectRepository } from './repository.ts';

function blankToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function createMilestoneService(db: Database, repository: ProjectRepository) {
  async function requireProjectExists(
    workspaceId: string,
    projectId: string,
    today: string,
  ): Promise<void> {
    const project = await repository.findById(workspaceId, projectId, today);
    if (!project) throw notFound({ de: 'Projekt nicht gefunden.', en: 'Project not found.' });
  }

  async function listFor(
    workspaceId: string,
    projectId: string,
    today: string,
  ): Promise<Milestone[]> {
    const rows = await repository.listMilestones(workspaceId, projectId);
    return rows.map((row) => ({
      ...row,
      // Überfällig heisst: Datum vor dem heutigen Workspace-Datum und noch offen.
      overdue: row.status === 'open' && row.dueDate !== null && row.dueDate < today,
    }));
  }

  return {
    async list(workspaceId: string, timezone: string, projectId: string): Promise<Milestone[]> {
      const today = todayInTimezone(timezone);
      await requireProjectExists(workspaceId, projectId, today);
      return listFor(workspaceId, projectId, today);
    },

    async add(
      workspaceId: string,
      timezone: string,
      actorId: string,
      projectId: string,
      input: MilestoneInput,
    ): Promise<Milestone[]> {
      const today = todayInTimezone(timezone);
      await requireProjectExists(workspaceId, projectId, today);
      const sortOrder = await repository.nextSortOrder(workspaceId, projectId);

      await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(milestones)
          .values({
            workspaceId,
            projectId,
            title: input.title.trim(),
            description: blankToNull(input.description),
            dueDate: input.dueDate ?? null,
            sortOrder,
          })
          .returning({ id: milestones.id, title: milestones.title });

        if (!created)
          throw new HttpError('INTERNAL', {
            de: 'Meilenstein konnte nicht angelegt werden.',
            en: 'The milestone could not be created.',
          });

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'milestone.created',
          entityType: 'milestone',
          entityId: created.id,
          metadata: { title: created.title },
        });
      });

      return listFor(workspaceId, projectId, today);
    },

    /**
     * Der Meilenstein wird über workspaceId und ID gesucht; die Projekt-ID
     * kommt aus dem gefundenen Datensatz und nicht aus dem Request.
     */
    async update(
      workspaceId: string,
      timezone: string,
      actorId: string,
      milestoneId: string,
      input: MilestoneUpdate,
    ): Promise<Milestone[]> {
      const existing = await repository.findMilestone(workspaceId, milestoneId);
      if (!existing)
        throw notFound({ de: 'Meilenstein nicht gefunden.', en: 'Milestone not found.' });

      await db.transaction(async (tx) => {
        await tx
          .update(milestones)
          .set({
            ...(input.title !== undefined ? { title: input.title.trim() } : {}),
            ...(input.description !== undefined
              ? { description: blankToNull(input.description) }
              : {}),
            ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
            ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
            updatedAt: new Date(),
          })
          .where(and(eq(milestones.workspaceId, workspaceId), eq(milestones.id, milestoneId)));

        if (input.status !== undefined && input.status !== existing.status) {
          await recordActivity(tx, {
            workspaceId,
            actorId,
            action: input.status === 'done' ? 'milestone.completed' : 'milestone.reopened',
            entityType: 'milestone',
            entityId: milestoneId,
            metadata: { title: existing.title },
          });
        }
      });

      return listFor(workspaceId, existing.projectId, todayInTimezone(timezone));
    },
  };
}

export type MilestoneService = ReturnType<typeof createMilestoneService>;
