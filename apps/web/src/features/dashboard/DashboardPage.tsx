import { Link, useSearchParams } from 'react-router';
import type { WorkspaceSummary } from '@clientdesk/contracts';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { workspacePath } from '../../lib/paths.ts';
import { useDashboard } from '../contracts/api.ts';
import { ProjectRows } from '../projects/ProjectRows.tsx';
import { useProjects } from '../projects/api.ts';
import { ContractValueChart } from './ContractValueChart.tsx';
import { MetricBand } from './MetricBand.tsx';

export function DashboardPage({ workspace }: { workspace: WorkspaceSummary }) {
  const [params, setParams] = useSearchParams();
  const contractDate = params.get('contractDate') ?? undefined;

  const board = useDashboard(workspace.id, contractDate);
  const attention = useProjects(workspace.id, { sort: 'targetDate', direction: 'asc' });
  const needsAttention = (attention.data?.data ?? []).filter(
    (project) => project.overdueMilestones > 0,
  );

  if (board.isError) {
    return (
      <ErrorState detail="Die Übersicht konnte nicht geladen werden. Bitte Seite neu laden." />
    );
  }
  if (board.isPending) return <LoadingState label="Übersicht wird geladen …" />;

  const data = board.data;
  const base = workspacePath(workspace.id);

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em]">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            {workspace.name} · Zeitzone {workspace.timezone}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dashboard-stichtag" className="text-xs font-medium text-muted">
            Stichtag für Vertragskennzahlen
          </label>
          <input
            id="dashboard-stichtag"
            type="date"
            value={contractDate ?? data.contractDate}
            onChange={(event) => {
              const next = new URLSearchParams(params);
              if (event.target.value) next.set('contractDate', event.target.value);
              else next.delete('contractDate');
              setParams(next, { replace: true });
            }}
            className="text-dense min-h-11 rounded-sm border border-line bg-surface px-3 text-ink"
          />
        </div>
      </div>

      <MetricBand data={data} base={base} />

      <Card>
        <CardHeader
          title="Monatlicher Vertragswert"
          action={<span className="text-xs text-muted">Letzte sechs Monate</span>}
        />
        <div className="px-4 pb-5 sm:px-5">
          <p className="mb-3 text-xs text-muted">
            Zu Monatsenddaten berechnet; der laufende Monat zum heutigen Datum. Vertraglich
            vereinbarter Wert, kein Zahlungseingang und kein buchhalterischer Umsatz.
          </p>
          <ContractValueChart history={data.history} />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <h2 className="text-sm font-semibold">Projekte mit überfälligen Meilensteinen</h2>
          <Link
            to={`${base}/projects`}
            className="-my-2 inline-flex min-h-11 items-center px-1 text-xs font-medium"
          >
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
          <ProjectRows projects={needsAttention} basePath={`${base}/projects`} />
        )}
      </Card>

      <p className="text-xs text-muted">
        Offene Anfragen erscheinen hier, sobald es Anfragen gibt.
      </p>
    </div>
  );
}
