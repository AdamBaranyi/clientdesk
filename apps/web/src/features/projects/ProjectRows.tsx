import { Link } from 'react-router';
import { AlertCircle } from 'lucide-react';
import type { Project } from '@clientdesk/contracts';
import { ProjectStatusBadge } from '../../components/base/StatusBadge.tsx';
import { formatDate } from '../../lib/format.ts';

interface Props {
  projects: Project[];
  basePath: string;
  showCustomer?: boolean;
}

/** Fortschritt als Text und als Balken — nicht allein über die Farbe. */
function ProgressCell({ project }: { project: Project }) {
  if (project.progress === null) {
    return <span className="text-xs text-faint">Noch keine Meilensteine</span>;
  }
  const percent = Math.round(project.progress * 100);
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </span>
      <span className="font-mono text-xs text-muted">
        {project.milestonesDone}/{project.milestoneCount}
      </span>
    </span>
  );
}

function OverdueMark({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-danger">
      <AlertCircle size={13} strokeWidth={2} aria-hidden="true" />
      {count === 1 ? '1 überfällig' : `${count} überfällig`}
    </span>
  );
}

export function ProjectRows({ projects, basePath, showCustomer = true }: Props) {
  return (
    <>
      <ul className="flex flex-col sm:hidden">
        {projects.map((project) => (
          <li key={project.id} className="border-t border-line-soft">
            <Link
              to={`${basePath}/${project.id}`}
              className="flex flex-col gap-2 px-4 py-4 no-underline hover:bg-raised"
            >
              <span className="font-medium text-ink">{project.name}</span>
              {showCustomer && <span className="text-sm text-muted">{project.customerName}</span>}
              <span className="flex flex-wrap items-center gap-3">
                <ProjectStatusBadge status={project.status} />
                <OverdueMark count={project.overdueMilestones} />
              </span>
              <ProgressCell project={project} />
            </Link>
          </li>
        ))}
      </ul>

      <table className="hidden w-full border-collapse sm:table">
        <thead>
          <tr className="text-left text-[10px] font-semibold tracking-[0.09em] text-faint uppercase">
            <th className="px-5 pb-2 font-semibold">Projekt</th>
            {showCustomer && <th className="px-5 pb-2 font-semibold">Kunde</th>}
            <th className="px-5 pb-2 font-semibold">Status</th>
            <th className="px-5 pb-2 font-semibold">Zieltermin</th>
            <th className="px-5 pb-2 font-semibold">Fortschritt</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-t border-line-soft hover:bg-raised">
              <td className="px-5 py-3">
                <Link to={`${basePath}/${project.id}`} className="font-medium no-underline">
                  {project.name}
                </Link>
                {project.overdueMilestones > 0 && (
                  <span className="mt-1 block">
                    <OverdueMark count={project.overdueMilestones} />
                  </span>
                )}
              </td>
              {showCustomer && (
                <td className="px-5 py-3 text-sm text-muted">{project.customerName}</td>
              )}
              <td className="px-5 py-3">
                <ProjectStatusBadge status={project.status} />
              </td>
              <td className="px-5 py-3 font-mono text-xs text-muted">
                {project.targetDate ? formatDate(project.targetDate) : '—'}
              </td>
              <td className="px-5 py-3">
                <ProgressCell project={project} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
