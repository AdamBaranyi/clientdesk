import { Link } from 'react-router';
import { AlertCircle } from 'lucide-react';
import type { Project } from '@tallyroom/contracts';
import {
  CardItem,
  CardList,
  Cell,
  DataTable,
  Row,
  TableHead,
  Th,
} from '../../components/base/DataTable.tsx';
import { RecordLink } from '../../components/base/RecordLink.tsx';
import { ProjectStatusBadge } from '../../components/base/StatusBadge.tsx';
import { formatDate } from '../../lib/format.ts';
import { useMessages } from '../../i18n/messages.ts';
import { projectMessages } from './messages.ts';

interface Props {
  projects: Project[];
  basePath: string;
  showCustomer?: boolean;
}

/** Fortschritt als Balken und als Zahl — nicht allein über die Farbe. */
function ProgressCell({ project }: { project: Project }) {
  const m = useMessages(projectMessages);
  if (project.progress === null) {
    return <span className="text-micro">{m.noMilestonesYet}</span>;
  }
  const percent = Math.round(project.progress * 100);
  return (
    <span className="flex items-center gap-2">
      <span className="h-1 w-16 shrink-0 bg-line" aria-hidden="true">
        <span className="block h-full bg-ink" style={{ width: `${percent}%` }} />
      </span>
      <span className="text-micro font-mono tabular-nums">
        {project.milestonesDone}/{project.milestoneCount}
      </span>
    </span>
  );
}

function OverdueMark({ count }: { count: number }) {
  const m = useMessages(projectMessages);
  if (count === 0) return null;
  return (
    <span className="text-micro inline-flex items-center gap-1.5 font-medium text-danger">
      <AlertCircle size={13} strokeWidth={2} aria-hidden="true" />
      {m.rows.overdue(count)}
    </span>
  );
}

export function ProjectRows({ projects, basePath, showCustomer = true }: Props) {
  const m = useMessages(projectMessages);
  return (
    <>
      <CardList>
        {projects.map((project) => (
          <CardItem key={project.id}>
            <Link
              to={`${basePath}/${project.id}`}
              className="flex flex-col gap-2 px-4 py-4 text-ink hover:bg-raised"
            >
              <span className="font-medium">{project.name}</span>
              {showCustomer && (
                <span className="text-dense text-muted">{project.customerName}</span>
              )}
              <span className="flex flex-wrap items-center gap-3">
                <ProjectStatusBadge status={project.status} />
                <OverdueMark count={project.overdueMilestones} />
              </span>
              <span className="text-muted">
                <ProgressCell project={project} />
              </span>
            </Link>
          </CardItem>
        ))}
      </CardList>

      <DataTable>
        <TableHead>
          <Th>{m.rows.project}</Th>
          {showCustomer && <Th>{m.customer}</Th>}
          <Th>{m.status}</Th>
          <Th>{m.targetDate}</Th>
          <Th>{m.rows.progress}</Th>
        </TableHead>
        <tbody>
          {projects.map((project) => (
            <Row key={project.id}>
              <Cell lead>
                <RecordLink to={`${basePath}/${project.id}`} title={project.name} />
                {project.overdueMilestones > 0 && (
                  <span className="mt-1 block">
                    <OverdueMark count={project.overdueMilestones} />
                  </span>
                )}
              </Cell>
              {showCustomer && <Cell>{project.customerName}</Cell>}
              <Cell>
                <ProjectStatusBadge status={project.status} />
              </Cell>
              <Cell numeric>{project.targetDate ? formatDate(project.targetDate) : '—'}</Cell>
              <Cell>
                <ProgressCell project={project} />
              </Cell>
            </Row>
          ))}
        </tbody>
      </DataTable>
    </>
  );
}
