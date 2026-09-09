import { useState } from 'react';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Link, useParams } from 'react-router';
import type { WorkspaceSummary } from '@clientdesk/contracts';
import { Button } from '../../components/base/Button.tsx';
import { workspacePath } from '../../lib/paths.ts';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { Dialog } from '../../components/base/Dialog.tsx';
import { ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { ArchivedBadge } from '../../components/base/StatusBadge.tsx';
import { ProjectRows } from '../projects/ProjectRows.tsx';
import { useProjects } from '../projects/api.ts';
import { ArchiveSection } from './ArchiveSection.tsx';
import { useCustomer, useUpdateCustomer } from './api.ts';
import { CustomerForm } from './CustomerForm.tsx';

export function CustomerDetailPage({ workspace }: { workspace: WorkspaceSummary }) {
  const { customerId } = useParams();
  const [editing, setEditing] = useState(false);

  const query = useCustomer(workspace.id, customerId);
  const projects = useProjects(workspace.id, { customerId });
  const update = useUpdateCustomer(workspace.id, customerId ?? '');

  if (query.isPending) return <LoadingState label="Kunde wird geladen …" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState detail="Dieser Kunde existiert nicht oder gehört zu einem anderen Workspace." />
    );
  }

  const customer = query.data;

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
      <Link
        to={workspacePath(workspace.id, 'customers')}
        className="inline-flex items-center gap-1.5 text-sm text-muted no-underline hover:text-ink"
      >
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Alle Kunden
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-[-0.02em]">{customer.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted">
            {customer.contactName && <span>{customer.contactName}</span>}
            {customer.archivedAt && <ArchivedBadge />}
          </div>
        </div>
        <Button onClick={() => setEditing(true)}>
          <Pencil size={15} strokeWidth={1.8} aria-hidden="true" />
          Bearbeiten
        </Button>
      </div>

      <Card>
        <CardHeader title="Übersicht" />
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-4 pb-5 sm:grid-cols-2 sm:px-5">
          <Entry label="E-Mail" value={customer.email} href={mailto(customer.email)} />
          <Entry label="Telefon" value={customer.phone} href={tel(customer.phone)} />
          <Entry label="Webseite" value={customer.website} href={customer.website} />
          <Entry
            label="Laufende Projekte"
            value={String(customer.activeProjectCount)}
            href={null}
          />
        </dl>

        {customer.internalNote && (
          <div className="border-t border-line-soft px-4 py-4 sm:px-5">
            <dt className="text-[10px] font-semibold tracking-[0.09em] text-faint uppercase">
              Interne Notiz
            </dt>
            {/* Erscheint nie im Kundenportal — die Client-DTOs führen dieses Feld gar nicht. */}
            <dd className="mt-1.5 max-w-[70ch] text-sm whitespace-pre-line">
              {customer.internalNote}
            </dd>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Projekte" />
        {projects.isPending && <LoadingState label="Projekte werden geladen …" />}
        {projects.data && projects.data.data.length === 0 && (
          <p className="px-4 pb-5 text-sm text-muted sm:px-5">
            Für diesen Kunden gibt es noch kein Projekt.
          </p>
        )}
        {projects.data && projects.data.data.length > 0 && (
          <ProjectRows
            projects={projects.data.data}
            basePath={workspacePath(workspace.id, 'projects')}
            showCustomer={false}
          />
        )}
      </Card>

      <ArchiveSection workspace={workspace} customer={customer} />

      <Dialog open={editing} title="Kunde bearbeiten" onClose={() => setEditing(false)}>
        <CustomerForm
          customer={customer}
          pending={update.isPending}
          error={update.error}
          onCancel={() => setEditing(false)}
          onSubmit={(values) =>
            update.mutate(
              { ...values, version: customer.version },
              {
                onSuccess: () => {
                  update.reset();
                  setEditing(false);
                },
              },
            )
          }
        />
      </Dialog>
    </div>
  );
}

function Entry({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href: string | null;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold tracking-[0.09em] text-faint uppercase">{label}</dt>
      <dd className="mt-1 text-sm">
        {value ? (
          href ? (
            <a href={href} className="break-words">
              {value}
            </a>
          ) : (
            <span className="break-words">{value}</span>
          )
        ) : (
          <span className="text-faint">Nicht erfasst</span>
        )}
      </dd>
    </div>
  );
}

const mailto = (value: string | null) => (value ? `mailto:${value}` : null);
const tel = (value: string | null) => (value ? `tel:${value.replace(/\s/g, '')}` : null);
