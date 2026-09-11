import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { REQUEST_STATUS, type RequestStatus, type WorkspaceSummary } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card } from '../../components/base/Card.tsx';
import { Dialog } from '../../components/base/Dialog.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { Pagination } from '../../components/base/Pagination.tsx';
import { domainMessages } from '../../i18n/domain-messages.ts';
import { useMessages } from '../../i18n/messages.ts';
import { workspacePath } from '../../lib/paths.ts';
import { useCustomers } from '../customers/api.ts';
import { useCreateRequest, useRequests } from './api.ts';
import { requestMessages } from './messages.ts';
import { RequestForm } from './RequestForm.tsx';
import { RequestRows } from './RequestRows.tsx';
import { SearchField, SelectField } from '../../components/base/Controls.tsx';

export function RequestListPage({ workspace }: { workspace: WorkspaceSummary }) {
  const [params, setParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const texts = useMessages(requestMessages);
  const m = texts.list;
  const statusLabels = useMessages(domainMessages).requestStatus;

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
          <h1 className="text-section font-semibold tracking-[-0.02em]">{m.title}</h1>
          <p className="mt-1 text-body text-muted">{m.lead}</p>
        </div>
        <Button variant="primary" disabled={availableCustomers.length === 0} onClick={openDialog}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          {texts.create}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchField
          value={search}
          onChange={(wert) => patchParams({ search: wert })}
          placeholder={m.searchPlaceholder}
          label={m.searchLabel}
        />

        <SelectField
          id="anfrage-status-filter"
          label={m.statusLabel}
          value={status ?? ''}
          onChange={(event) => patchParams({ status: event.target.value || null })}
        >
          <option value="">{m.allStatuses}</option>
          {REQUEST_STATUS.map((option) => (
            <option key={option} value={option}>
              {statusLabels[option]}
            </option>
          ))}
        </SelectField>
      </div>

      <Card>
        {query.isPending && <LoadingState label={m.loading} />}
        {query.isError && <ErrorState detail={m.loadFailed} />}

        {query.data && query.data.data.length === 0 && (
          <EmptyState
            title={search || status ? m.noMatch : m.empty}
            detail={
              search || status
                ? m.noMatchDetail
                : availableCustomers.length === 0
                  ? m.emptyNoCustomers
                  : m.emptyDetail
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

      <Dialog open={dialogOpen} title={texts.create} onClose={() => setDialogOpen(false)}>
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
