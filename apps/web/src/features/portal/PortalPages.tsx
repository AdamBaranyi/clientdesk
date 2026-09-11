import { Download } from 'lucide-react';
import { Link } from 'react-router';
import { formatAmountMinor, type WorkspaceSummary } from '@tallyroom/contracts';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { formatDate } from '../../lib/format.ts';
import { portalPath } from '../../lib/portal-paths.ts';
import { ProjectProgress } from './ProjectProgress.tsx';
import {
  portalDownloadUrl,
  usePortalContracts,
  usePortalDocuments,
  usePortalOverview,
  usePortalProjects,
} from './api.ts';
import { portalMessages } from './messages.ts';

export function PortalOverviewPage({ workspace }: { workspace: WorkspaceSummary }) {
  const query = usePortalOverview(workspace.id);
  const m = useMessages(portalMessages);

  if (query.isPending) return <LoadingState label={m.overview.loading} />;
  if (query.isError || !query.data) {
    return <ErrorState detail={m.overview.loadFailed} />;
  }

  const data = query.data;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.02em]">{data.customerName}</h1>
        <p className="mt-1 text-sm text-muted">{m.overview.managedBy(data.workspaceName)}</p>
      </div>

      <Card>
        <CardHeader title={m.overview.yourProjects} />
        {data.projects.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-muted sm:px-5">{m.overview.noProjects}</p>
        ) : (
          <ul className="flex flex-col">
            {data.projects.map((project) => (
              <li key={project.id} className="border-t border-line-soft px-4 py-4 sm:px-5">
                <p className="font-medium">{project.name}</p>
                <div className="mt-2">
                  <ProjectProgress project={project} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          title={m.overview.yourOpenRequests}
          action={
            <Link
              to={portalPath(workspace.id, 'requests')}
              className="-my-2 inline-flex min-h-11 items-center px-1 text-xs font-medium"
            >
              {m.requests.all}
            </Link>
          }
        />
        {data.openRequests.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-muted sm:px-5">{m.overview.noOpenRequests}</p>
        ) : (
          <ul className="flex flex-col">
            {data.openRequests.map((request) => (
              <li key={request.id} className="border-t border-line-soft">
                <Link
                  to={portalPath(workspace.id, 'requests', request.id)}
                  className="block px-4 py-3 no-underline hover:bg-raised sm:px-5"
                >
                  <span className="font-medium text-ink">{request.subject}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function PortalProjectsPage({ workspace }: { workspace: WorkspaceSummary }) {
  const query = usePortalProjects(workspace.id);
  const m = useMessages(portalMessages).projects;

  if (query.isPending) return <LoadingState label={m.loading} />;
  if (query.isError) return <ErrorState detail={m.loadFailed} />;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8">
      <h1 className="text-xl font-semibold tracking-[-0.02em]">{m.heading}</h1>

      <Card>
        {query.data?.length === 0 && <EmptyState title={m.emptyTitle} detail={m.emptyDetail} />}
        <ul className="flex flex-col">
          {(query.data ?? []).map((project) => (
            <li
              key={project.id}
              className="border-t border-line-soft px-4 py-4 first:border-t-0 sm:px-5"
            >
              <p className="font-medium">{project.name}</p>
              {project.description && (
                <p className="mt-1 max-w-[70ch] text-sm text-muted">{project.description}</p>
              )}
              <div className="mt-3">
                <ProjectProgress project={project} />
              </div>
              <p className="mt-2 font-mono text-xs text-muted">
                {m.schedule(
                  formatDate(project.startDate),
                  project.targetDate ? formatDate(project.targetDate) : null,
                )}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function PortalContractsPage({ workspace }: { workspace: WorkspaceSummary }) {
  const query = usePortalContracts(workspace.id);
  const m = useMessages(portalMessages).contracts;

  if (query.isPending) return <LoadingState label={m.loading} />;
  if (query.isError) return <ErrorState detail={m.loadFailed} />;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8">
      <h1 className="text-xl font-semibold tracking-[-0.02em]">{m.heading}</h1>

      <Card>
        {query.data?.length === 0 && <EmptyState title={m.emptyTitle} detail={m.emptyDetail} />}
        <ul className="flex flex-col">
          {(query.data ?? []).map((contract) => (
            <li
              key={contract.id}
              className="border-t border-line-soft px-4 py-4 first:border-t-0 sm:px-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{contract.name}</p>
                <p className="font-mono text-sm">
                  {contract.monthlyAmountMinor === null
                    ? m.amountPending
                    : m.perMonth(formatAmountMinor(contract.monthlyAmountMinor))}
                </p>
              </div>
              {contract.publicDescription && (
                <p className="mt-1.5 max-w-[70ch] text-sm text-muted">
                  {contract.publicDescription}
                </p>
              )}
              <p className="mt-2 font-mono text-xs text-muted">
                {m.term(
                  formatDate(contract.startDate),
                  contract.endDate ? formatDate(contract.endDate) : null,
                )}
                {contract.active ? '' : ` · ${m.inactive}`}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function PortalDocumentsPage({ workspace }: { workspace: WorkspaceSummary }) {
  const query = usePortalDocuments(workspace.id);
  const m = useMessages(portalMessages).documents;

  if (query.isPending) return <LoadingState label={m.loading} />;
  if (query.isError) return <ErrorState detail={m.loadFailed} />;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8">
      <h1 className="text-xl font-semibold tracking-[-0.02em]">{m.heading}</h1>

      <Card>
        {query.data?.length === 0 && <EmptyState title={m.emptyTitle} detail={m.emptyDetail} />}
        <ul className="flex flex-col">
          {(query.data ?? []).map((document) => (
            <li
              key={document.id}
              className="flex flex-col gap-3 border-t border-line-soft px-4 py-4 first:border-t-0 sm:flex-row sm:items-center sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium break-words">{document.originalName}</p>
                <p className="mt-1 font-mono text-xs text-muted">
                  {formatDate(document.createdAt.slice(0, 10))}
                  {document.projectName ? ` · ${document.projectName}` : ''}
                </p>
              </div>
              <a
                href={portalDownloadUrl(workspace.id, document.id)}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm border border-line px-3 text-sm font-medium text-muted no-underline hover:text-ink"
              >
                <Download size={15} strokeWidth={1.8} aria-hidden="true" />
                {m.download}
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
