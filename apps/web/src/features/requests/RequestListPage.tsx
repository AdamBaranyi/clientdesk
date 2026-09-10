import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { REQUEST_STATUS, type RequestStatus, type WorkspaceSummary } from '@clientdesk/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card } from '../../components/base/Card.tsx';
import { Dialog } from '../../components/base/Dialog.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { Pagination } from '../../components/base/Pagination.tsx';
import { workspacePath } from '../../lib/paths.ts';
import { useCustomers } from '../customers/api.ts';
import { useCreateRequest, useRequests } from './api.ts';
import { RequestForm } from './RequestForm.tsx';
import { RequestRows } from './RequestRows.tsx';
import { REQUEST_STATUS_LABELS } from './status-labels.ts';
import { SearchField, SelectField } from '../../components/base/Controls.tsx';

export function RequestListPage({ workspace }: { workspace: WorkspaceSummary }) {
  const [params, setParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);

  const search = params.get('search') ?? '';
  const status = (params.get('status') as RequestStatus | null) ?? undefined;
  const page = Number(params.get('page') ?? '1');

  const query = useRequests(workspace.id, { search, ...(status ? { status } : {}), page });
  const customers = useCustomers(workspace.id, { status: 'active', pageSize: 100 });
  const create = useCreateRequest(workspace.id);

  // Ein Schlüssel je geöffnetem Formular: zwei Klicks auf „Anfrage anlegen"
  // erzeugen dieselbe Anfrage, nicht zwei. Beim Öffnen entsteht ein neuer.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  function openDialog() {
    setIdempotencyKey(crypto.randomUUID());
    setDialogOpen(true);
  }

  function patchParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  }

  const availableCustomers = customers.data?.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em]">Anfragen</h1>
          <p className="mt-1 text-sm text-muted">Serviceanfragen aller Kunden.</p>
        </div>
        <Button variant="primary" disabled={availableCustomers.length === 0} onClick={openDialog}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          Anfrage anlegen
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchField
          value={search}
          onChange={(wert) => patchParams({ search: wert })}
          placeholder="Betreff oder Kunde"
          label="Anfragen durchsuchen"
        />

        <SelectField
          id="anfrage-status-filter"
          label="Status"
          value={status ?? ''}
          onChange={(event) => patchParams({ status: event.target.value || null })}
        >
          <option value="">Alle Status</option>
          {REQUEST_STATUS.map((option) => (
            <option key={option} value={option}>
              {REQUEST_STATUS_LABELS[option]}
            </option>
          ))}
        </SelectField>
      </div>

      <Card>
        {query.isPending && <LoadingState label="Anfragen werden geladen …" />}
        {query.isError && (
          <ErrorState detail="Die Anfragenliste konnte nicht geladen werden. Bitte Seite neu laden." />
        )}

        {query.data && query.data.data.length === 0 && (
          <EmptyState
            title={search || status ? 'Kein Treffer' : 'Noch keine Anfragen'}
            detail={
              search || status
                ? 'In dieser Ansicht gibt es keine Anfrage. Suche oder Status ändern.'
                : availableCustomers.length === 0
                  ? 'Eine Anfrage gehört immer zu einem Kunden. Lege zuerst einen Kunden an.'
                  : 'Anfragen aus dem Kundenportal und intern erfasste erscheinen hier gemeinsam.'
            }
          />
        )}

        {query.data && query.data.data.length > 0 && (
          <>
            <div className="pt-4">
              <RequestRows
                requests={query.data.data}
                basePath={workspacePath(workspace.id, 'requests')}
              />
            </div>
            <Pagination
              pagination={query.data.pagination}
              onChange={(next) => patchParams({ page: String(next) })}
            />
          </>
        )}
      </Card>

      <Dialog open={dialogOpen} title="Anfrage anlegen" onClose={() => setDialogOpen(false)}>
        <RequestForm
          customers={availableCustomers}
          workspaceId={workspace.id}
          pending={create.isPending}
          error={create.error}
          onCancel={() => setDialogOpen(false)}
          onSubmit={(input) =>
            create.mutate(
              { input, idempotencyKey },
              {
                onSuccess: () => {
                  create.reset();
                  setDialogOpen(false);
                },
              },
            )
          }
        />
      </Dialog>
    </div>
  );
}
