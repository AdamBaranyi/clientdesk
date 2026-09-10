import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router';
import type { CustomerStatusFilter, WorkspaceSummary } from '@clientdesk/contracts';
import { Button } from '../../components/base/Button.tsx';
import { workspacePath } from '../../lib/paths.ts';
import { Card } from '../../components/base/Card.tsx';
import { Dialog } from '../../components/base/Dialog.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { Pagination } from '../../components/base/Pagination.tsx';
import { useCreateCustomer, useCustomers } from './api.ts';
import { CustomerForm } from './CustomerForm.tsx';
import { CustomerRows } from './CustomerRows.tsx';
import { FilterGroup, SearchField } from '../../components/base/Controls.tsx';

const STATUS_LABELS: Record<CustomerStatusFilter, string> = {
  active: 'Aktiv',
  archived: 'Archiviert',
  all: 'Alle',
};

/** Suche, Filter und Seite stehen in der URL — ein Link bleibt teilbar. */
export function CustomerListPage({ workspace }: { workspace: WorkspaceSummary }) {
  const [params, setParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);

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
          <h1 className="text-xl font-semibold tracking-[-0.02em]">Kunden</h1>
          <p className="mt-1 text-sm text-muted">Alle Kunden dieser Agentur.</p>
        </div>
        <Button variant="primary" onClick={() => setDialogOpen(true)}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          Kunde anlegen
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          value={search}
          onChange={(wert) => patchParams({ search: wert })}
          placeholder="Name, Kontakt oder E-Mail"
          label="Kunden durchsuchen"
        />

        <FilterGroup
          label="Status"
          active={status}
          options={(Object.keys(STATUS_LABELS) as CustomerStatusFilter[]).map((option) => ({
            value: option,
            label: STATUS_LABELS[option],
          }))}
          onSelect={(option) => patchParams({ status: option === 'active' ? null : option })}
        />
      </div>

      <Card>
        {query.isPending && <LoadingState label="Kunden werden geladen …" />}

        {query.isError && (
          <ErrorState detail="Die Kundenliste konnte nicht geladen werden. Bitte Seite neu laden." />
        )}

        {query.data && query.data.data.length === 0 && (
          <EmptyState
            title={search ? 'Kein Treffer' : 'Noch keine Kunden'}
            detail={
              search
                ? `Zu „${search}" gibt es in dieser Ansicht keinen Kunden. Suchbegriff ändern oder den Statusfilter erweitern.`
                : 'Sobald der erste Kunde angelegt ist, erscheint er hier mit seinen laufenden Projekten.'
            }
            action={
              !search ? (
                <Button variant="primary" onClick={() => setDialogOpen(true)}>
                  <Plus size={16} strokeWidth={2} aria-hidden="true" />
                  Kunde anlegen
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

      <Dialog open={dialogOpen} title="Kunde anlegen" onClose={() => setDialogOpen(false)}>
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
