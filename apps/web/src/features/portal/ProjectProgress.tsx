import { AlertCircle } from 'lucide-react';
import type { ClientProject } from '@clientdesk/contracts';
import { formatDate } from '../../lib/format.ts';

/**
 * Ohne Meilensteine gibt es keinen Fortschritt — auch hier nicht. Eine leere
 * Leiste als „0 Prozent" wäre eine Aussage, die nicht getroffen wurde.
 */
export function ProjectProgress({ project }: { project: ClientProject }) {
  return (
    <div className="flex flex-col gap-2">
      {project.progress === null ? (
        <span className="text-xs text-muted">Noch keine Meilensteine</span>
      ) : (
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-24 shrink-0 overflow-hidden bg-line" aria-hidden="true">
            <span
              className="block h-full bg-ink"
              style={{ width: `${Math.round(project.progress * 100)}%` }}
            />
          </span>
          <span className="font-mono text-xs text-muted">
            {project.milestonesDone} von {project.milestoneCount} erledigt
          </span>
        </span>
      )}

      {project.nextMilestone && (
        <span className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">Nächster Schritt: {project.nextMilestone.title}</span>
          {project.nextMilestone.dueDate && (
            <span
              className={[
                'inline-flex items-center gap-1.5 font-mono',
                project.nextMilestone.overdue ? 'font-medium text-danger' : 'text-muted',
              ].join(' ')}
            >
              {project.nextMilestone.overdue && (
                <AlertCircle size={12} strokeWidth={2} aria-hidden="true" />
              )}
              {formatDate(project.nextMilestone.dueDate)}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
