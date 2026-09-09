import { Link } from 'react-router';
import type { WorkspaceSummary } from '@clientdesk/contracts';
import { Card } from '../../components/base/Card.tsx';
import { workspacePath } from '../../lib/paths.ts';
import { ErrorState } from '../../components/base/EmptyState.tsx';
import { useCustomers } from '../customers/api.ts';
import { ProjectRows } from '../projects/ProjectRows.tsx';
import { useProjects } from '../projects/api.ts';

/**
 * Meilenstein 2: die Kennzahlen, für die es echte Daten gibt. Monatlicher
 * Vertragswert und offene Anfragen kommen mit den Verträgen und Anfragen —
 * hier steht bewusst keine Platzhalterzahl.
 */
export function DashboardPage({ workspace }: { workspace: WorkspaceSummary }) {
  const customers = useCustomers(workspace.id, { status: 'active', pageSize: 1 });
  const activeProjects = useProjects(workspace.id, { status: 'active', pageSize: 1 });
  const attention = useProjects(workspace.id, { sort: 'targetDate', direction: 'asc' });

  const needsAttention = (attention.data?.data ?? []).filter(
    (project) => project.overdueMilestones > 0,
  );

  if (customers.isError || activeProjects.isError) {
    return (
      <ErrorState detail="Die Übersicht konnte nicht geladen werden. Bitte Seite neu laden." />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          {workspace.name} · Zeitzone {workspace.timezone}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Metric
          label="Aktive Kunden"
          value={customers.data?.pagination.totalItems}
          to={workspacePath(workspace.id, 'customers')}
          hint="Nicht archivierte Kundendatensätze"
        />
        <Metric
          label="Laufende Projekte"
          value={activeProjects.data?.pagination.totalItems}
          to={`${workspacePath(workspace.id, 'projects')}?status=active`}
          hint="Projekte im Status Aktiv"
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <h2 className="text-sm font-semibold">Projekte mit überfälligen Meilensteinen</h2>
          <Link to={workspacePath(workspace.id, 'projects')} className="text-xs font-medium">
            Alle Projekte
          </Link>
        </div>

        {attention.isPending && (
          <p className="px-4 pb-5 text-sm text-muted sm:px-5">Wird geladen …</p>
        )}

        {attention.data && needsAttention.length === 0 && (
          <p className="px-4 pb-5 text-sm text-muted sm:px-5">
            Kein Projekt hat überfällige Meilensteine. Nichts liegen geblieben.
          </p>
        )}

        {needsAttention.length > 0 && (
          <ProjectRows
            projects={needsAttention}
            basePath={workspacePath(workspace.id, 'projects')}
          />
        )}
      </Card>

      <p className="text-xs text-faint">
        Monatlicher Vertragswert und offene Anfragen erscheinen hier, sobald es Verträge und
        Anfragen gibt.
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  to,
  hint,
}: {
  label: string;
  value: number | undefined;
  to: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-line bg-surface p-5 no-underline shadow-[var(--shadow-card)] transition-colors hover:border-faint"
    >
      <span className="text-[10px] font-semibold tracking-[0.09em] text-faint uppercase">
        {label}
      </span>
      <span className="mt-3 block font-mono text-3xl leading-none font-medium text-ink">
        {value === undefined ? '—' : value}
      </span>
      <span className="mt-2 block text-xs text-faint">{hint}</span>
    </Link>
  );
}
