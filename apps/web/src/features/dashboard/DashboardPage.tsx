import { Suspense, lazy } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { WorkspaceSummary } from '@tallyroom/contracts';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { workspacePath } from '../../lib/paths.ts';
import { useDashboard } from '../contracts/api.ts';
import { ProjectRows } from '../projects/ProjectRows.tsx';
import { useProjects } from '../projects/api.ts';
/*
 * Recharts ist die grösste Abhängigkeit im Frontend und wird auf genau einer
 * Seite gebraucht. Ohne diese Trennung lädt jeder Besucher der Startseite
 * eine Diagrammbibliothek mit, die er nie sieht.
 */
const ContractValueChart = lazy(() =>
  import('./ContractValueChart.tsx').then((modul) => ({ default: modul.ContractValueChart })),
);
import { MetricBand } from './MetricBand.tsx';
import { dashboardMessages } from './messages.ts';

export function DashboardPage({ workspace }: { workspace: WorkspaceSummary }) {
  const [params, setParams] = useSearchParams();
  const contractDate = params.get('contractDate') ?? undefined;
  const m = useMessages(dashboardMessages);

  const board = useDashboard(workspace.id, contractDate);
  const attention = useProjects(workspace.id, { sort: 'targetDate', direction: 'asc' });
  const needsAttention = (attention.data?.data ?? []).filter(
    (project) => project.overdueMilestones > 0,
  );

  if (board.isError) {
    return <ErrorState detail={m.loadFailed} />;
  }
  if (board.isPending) return <LoadingState label={m.loading} />;

  const data = board.data;
  const base = workspacePath(workspace.id);

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em]">{m.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {workspace.name} · {m.timezone(workspace.timezone)}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dashboard-stichtag" className="text-xs font-medium text-muted">
            {m.contractDateLabel}
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
          title={m.monthlyContractValue}
          action={<span className="text-xs text-muted">{m.history.period}</span>}
        />
        <div className="px-4 pb-5 sm:px-5">
          <p className="mb-3 text-xs text-muted">{m.history.note}</p>
          {/*
            Der Platzhalter ist genauso hoch wie das Diagramm. Ein Fallback mit
            anderer Höhe würde beim Nachladen den Rest der Seite verschieben —
            und genau das misst der CLS-Wert.
          */}
          <Suspense
            fallback={
              <div className="text-dense flex h-[248px] items-center text-muted">
                {m.history.chartLoading}
              </div>
            }
          >
            <ContractValueChart history={data.history} />
          </Suspense>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <h2 className="text-sm font-semibold">{m.attention.title}</h2>
          <Link
            to={`${base}/projects`}
            className="-my-2 inline-flex min-h-11 items-center px-1 text-xs font-medium"
          >
            {m.attention.allProjects}
          </Link>
        </div>

        {attention.isPending && (
          <p className="px-4 pb-5 text-sm text-muted sm:px-5">{m.attention.loading}</p>
        )}
        {attention.data && needsAttention.length === 0 && (
          <p className="px-4 pb-5 text-sm text-muted sm:px-5">{m.attention.none}</p>
        )}
        {needsAttention.length > 0 && (
          <ProjectRows projects={needsAttention} basePath={`${base}/projects`} />
        )}
      </Card>

      <p className="text-xs text-muted">{m.requestsHint}</p>
    </div>
  );
}
