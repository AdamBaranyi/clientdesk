import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { PROJECT_STATUS, type ProjectStatus, type WorkspaceSummary } from '@tallyroom/contracts';
import { workspacePath } from '../../lib/paths.ts';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { ProjectStatusBadge } from '../../components/base/StatusBadge.tsx';
import { ApiRequestError } from '../../lib/api.ts';
import { CompletionDialog } from './CompletionDialog.tsx';
import { MilestoneList } from './MilestoneList.tsx';
import { formatDate } from '../../lib/format.ts';
import { useMilestones, useProject, useUpdateProject } from './api.ts';
import { PendingRecord, RecordHeading } from '../../components/base/RecordLink.tsx';
import { useRecordTitlePreview } from '../../lib/use-record-title.ts';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: 'Geplant',
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
  archived: 'Archiviert',
};

export function ProjectDetailPage({ workspace }: { workspace: WorkspaceSummary }) {
  const { projectId } = useParams();
  const [completionOpen, setCompletionOpen] = useState(false);
  const query = useProject(workspace.id, projectId);
  const milestones = useMilestones(workspace.id, projectId);
  const update = useUpdateProject(workspace.id, projectId ?? '');

  const preview = useRecordTitlePreview();
  if (query.isPending) return <PendingRecord title={preview} label="Projekt wird geladen …" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState detail="Dieses Projekt existiert nicht oder gehört zu einem anderen Workspace." />
    );
  }

  const project = query.data;

  const openMilestones = project.milestoneCount - project.milestonesDone;

  /**
   * Ein Abschluss mit offenen Meilensteinen verlangt eine Begründung. Die
   * Nachfrage steht hier, die Regel selbst prüft der Server.
   */
  function changeStatus(next: ProjectStatus) {
    if (next === project.status) return;

    if (next === 'completed' && openMilestones > 0) {
      setCompletionOpen(true);
      return;
    }
    update.mutate({ status: next, version: project.version });
  }

  const conflict =
    update.error instanceof ApiRequestError && update.error.code === 'VERSION_CONFLICT';

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <Link
        to={workspacePath(workspace.id, 'projects')}
        className="inline-flex items-center gap-1.5 text-sm text-muted no-underline hover:text-ink"
      >
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Alle Projekte
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <RecordHeading>{project.name}</RecordHeading>
          <p className="mt-1.5 text-sm text-muted">{project.customerName}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="projekt-status" className="text-xs font-medium text-muted">
            Status
          </label>
          <select
            id="projekt-status"
            value={project.status}
            disabled={update.isPending}
            onChange={(event) => changeStatus(event.target.value as ProjectStatus)}
            className="text-dense min-h-11 rounded-sm border border-line bg-surface px-3 text-ink"
          >
            {PROJECT_STATUS.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {conflict && (
        <p
          role="alert"
          className="rounded-sm border border-line bg-raised px-4 py-3 text-sm text-danger"
        >
          Das Projekt wurde inzwischen von jemand anderem geändert. Bitte Seite neu laden.
        </p>
      )}

      <Card>
        <CardHeader title="Übersicht" />
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-4 pb-5 sm:grid-cols-3 sm:px-5">
          <div>
            <dt className="text-[10px] font-semibold tracking-[0.09em] text-muted uppercase">
              Status
            </dt>
            <dd className="mt-1.5">
              <ProjectStatusBadge status={project.status} />
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold tracking-[0.09em] text-muted uppercase">
              Start
            </dt>
            <dd className="mt-1.5 font-mono text-sm">{formatDate(project.startDate)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold tracking-[0.09em] text-muted uppercase">
              Zieltermin
            </dt>
            <dd className="mt-1.5 font-mono text-sm">
              {project.targetDate ? formatDate(project.targetDate) : '—'}
            </dd>
          </div>
        </dl>

        {project.description && (
          <div className="border-t border-line-soft px-4 py-4 sm:px-5">
            <dt className="text-[10px] font-semibold tracking-[0.09em] text-muted uppercase">
              Beschreibung
            </dt>
            <dd className="mt-1.5 max-w-[70ch] text-sm whitespace-pre-line">
              {project.description}
            </dd>
          </div>
        )}

        {project.internalNote && (
          <div className="border-t border-line-soft px-4 py-4 sm:px-5">
            <dt className="text-[10px] font-semibold tracking-[0.09em] text-muted uppercase">
              Interne Notiz
            </dt>
            <dd className="mt-1.5 max-w-[70ch] text-sm whitespace-pre-line">
              {project.internalNote}
            </dd>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Meilensteine"
          action={
            <span className="text-xs text-muted">
              {project.milestoneCount === 0
                ? 'Noch keine Meilensteine'
                : `${project.milestonesDone} von ${project.milestoneCount} erledigt`}
            </span>
          }
        />
        {milestones.isPending && <LoadingState label="Meilensteine werden geladen …" />}
        {milestones.data && projectId && (
          <MilestoneList
            workspaceId={workspace.id}
            projectId={projectId}
            milestones={milestones.data}
          />
        )}
      </Card>
      <CompletionDialog
        open={completionOpen}
        openMilestones={openMilestones}
        pending={update.isPending}
        onClose={() => setCompletionOpen(false)}
        onConfirm={(reason) =>
          update.mutate(
            { status: 'completed', completionReason: reason, version: project.version },
            { onSuccess: () => setCompletionOpen(false) },
          )
        }
      />
    </div>
  );
}
