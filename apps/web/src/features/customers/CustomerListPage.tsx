import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router';
import {
  CUSTOMER_STATUS_FILTERS,
  type CustomerStatusFilter,
  type WorkspaceSummary,
} from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { workspacePath } from '../../lib/paths.ts';
import { Card } from '../../components/base/Card.tsx';
import { Dialog } from '../../components/base/Dialog.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { Pagination } from '../../components/base/Pagination.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { useCreateCustomer, useCustomers } from './api.ts';
import { CustomerForm } from './CustomerForm.tsx';
import { CustomerRows } from './CustomerRows.tsx';
import { customerMessages } from './messages.ts';
import { FilterGroup, SearchField } from '../../components/base/Controls.tsx';

/** Suche, Filter und Seite stehen in der URL — ein Link bleibt teilbar. */
export function CustomerListPage({ workspace }: { workspace: WorkspaceSummary }) {
  const [params, setParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const m = useMessages(customerMessages);

  const search = params.get('search') ?? '';
  const status = (params.get('status') as CustomerStatusFilter | null) ?? 'active';
  const page = Number(params.get('page') ?? '1');

  const query = useCustomers(workspace.id, { search, status, page });
  const create = useCreateCustomer(workspace.id);

  function patchParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    // Jede Filteränderung führt zurück auf Seite eins.
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  }

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-section font-semibold tracking-[-0.02em]">{m.list.title}</h1>
          <p className="mt-1 text-body text-muted">{m.list.lead}</p>
        </div>
        <Button variant="primary" onClick={() => setDialogOpen(true)}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          {m.createCustomer}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          value={search}
          onChange={(wert) => patchParams({ search: wert })}
          placeholder={m.list.searchPlaceholder}
          label={m.list.searchLabel}
        />

        <FilterGroup
          label={m.fields.status}
          active={status}
          options={CUSTOMER_STATUS_FILTERS.map((option) => ({
            value: option,
            label: m.status[option],
          }))}
          onSelect={(option) => patchParams({ status: option === 'active' ? null : option })}
        />
      </div>

      <Card>
        {query.isPending && <LoadingState label={m.list.loading} />}

        {query.isError && <ErrorState detail={m.list.loadFailed} />}

        {query.data && query.data.data.length === 0 && (
          <EmptyState
            title={search ? m.list.noMatch : m.list.empty}
            detail={search ? m.list.noMatchDetail(search) : m.list.emptyDetail}
            action={
              !search ? (
                <Button variant="primary" onClick={() => setDialogOpen(true)}>
                  <Plus size={16} strokeWidth={2} aria-hidden="true" />
                  {m.createCustomer}
                </Button>
              ) : undefined
            }
          />
        )}

        {query.data && query.data.data.length > 0 && (
          <>
            <div className="pt-4">
              <CustomerRows
                customers={query.data.data}
                basePath={workspacePath(workspace.id, 'customers')}
              />
            </div>
            <Pagination
              pagination={query.data.pagination}
              onChange={(next) => patchParams({ page: String(next) })}
            />
          </>
        )}
      </Card>

      <Dialog open={dialogOpen} title={m.createCustomer} onClose={() => setDialogOpen(false)}>
        <CustomerForm
          pending={create.isPending}
          error={create.error}
          onCancel={() => setDialogOpen(false)}
          onSubmit={(values) =>
            create.mutate(values, {
              onSuccess: () => {
                create.reset();
                setDialogOpen(false);
              },
            })
          }
        />
      </Dialog>
    </div>
  );
}
