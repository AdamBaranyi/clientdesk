import { Download } from 'lucide-react';
import { Link } from 'react-router';
import { formatAmountMinor, type WorkspaceSummary } from '@clientdesk/contracts';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
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

export function PortalOverviewPage({ workspace }: { workspace: WorkspaceSummary }) {
  const query = usePortalOverview(workspace.id);

  if (query.isPending) return <LoadingState label="Übersicht wird geladen …" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState detail="Die Übersicht konnte nicht geladen werden. Bitte Seite neu laden." />
    );
  }

  const data = query.data;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.02em]">{data.customerName}</h1>
        <p className="mt-1 text-sm text-muted">Betreut von {data.workspaceName}</p>
      </div>

      <Card>
        <CardHeader title="Ihre Projekte" />
        {data.projects.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-muted sm:px-5">
            Derzeit ist kein Projekt für Sie freigegeben.
          </p>
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
          title="Ihre offenen Anfragen"
          action={
            <Link
              to={portalPath(workspace.id, 'requests')}
              className="-my-2 inline-flex min-h-11 items-center px-1 text-xs font-medium"
            >
              Alle Anfragen
            </Link>
          }
        />
        {data.openRequests.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-muted sm:px-5">Keine offene Anfrage.</p>
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

  if (query.isPending) return <LoadingState label="Projekte werden geladen …" />;
  if (query.isError) return <ErrorState detail="Die Projekte konnten nicht geladen werden." />;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-5">
      <h1 className="text-xl font-semibold tracking-[-0.02em]">Projekte</h1>

      <Card>
        {query.data?.length === 0 && (
          <EmptyState
            title="Kein freigegebenes Projekt"
            detail="Sobald ein Projekt für Sie freigegeben ist, erscheint es hier mit seinem Stand."
          />
        )}
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
              <p className="mt-2 font-mono text-xs text-faint">
                Start {formatDate(project.startDate)}
                {project.targetDate ? ` · Ziel ${formatDate(project.targetDate)}` : ''}
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

  if (query.isPending) return <LoadingState label="Verträge werden geladen …" />;
  if (query.isError) return <ErrorState detail="Die Verträge konnten nicht geladen werden." />;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-5">
      <h1 className="text-xl font-semibold tracking-[-0.02em]">Serviceverträge</h1>

      <Card>
        {query.data?.length === 0 && (
          <EmptyState
            title="Kein freigegebener Vertrag"
            detail="Sobald ein Vertrag für Sie freigegeben ist, sehen Sie hier Leistung und Betrag."
          />
        )}
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
                    ? 'Gilt ab Vertragsbeginn'
                    : `CHF ${formatAmountMinor(contract.monthlyAmountMinor)} pro Monat`}
                </p>
              </div>
              {contract.publicDescription && (
                <p className="mt-1.5 max-w-[70ch] text-sm text-muted">
                  {contract.publicDescription}
                </p>
              )}
              <p className="mt-2 font-mono text-xs text-faint">
                Ab {formatDate(contract.startDate)}
                {contract.endDate ? ` bis ${formatDate(contract.endDate)}` : ' · unbefristet'}
                {contract.active ? '' : ' · derzeit nicht aktiv'}
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

  if (query.isPending) return <LoadingState label="Dokumente werden geladen …" />;
  if (query.isError) return <ErrorState detail="Die Dokumente konnten nicht geladen werden." />;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-5">
      <h1 className="text-xl font-semibold tracking-[-0.02em]">Dokumente</h1>

      <Card>
        {query.data?.length === 0 && (
          <EmptyState
            title="Keine freigegebenen Unterlagen"
            detail="Hier erscheinen die Dateien, die für Sie freigegeben wurden."
          />
        )}
        <ul className="flex flex-col">
          {(query.data ?? []).map((document) => (
            <li
              key={document.id}
              className="flex flex-col gap-3 border-t border-line-soft px-4 py-4 first:border-t-0 sm:flex-row sm:items-center sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium break-words">{document.originalName}</p>
                <p className="mt-1 font-mono text-xs text-faint">
                  {formatDate(document.createdAt.slice(0, 10))}
                  {document.projectName ? ` · ${document.projectName}` : ''}
                </p>
              </div>
              <a
                href={portalDownloadUrl(workspace.id, document.id)}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm border border-line px-3 text-sm font-medium text-muted no-underline hover:text-ink"
              >
                <Download size={15} strokeWidth={1.8} aria-hidden="true" />
                Herunterladen
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
