import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useSearchParams } from 'react-router';
import {
  CONTRACT_VISIBLE_STATUS,
  formatAmountMinor,
  type ContractVisibleStatus,
  type WorkspaceSummary,
} from '@clientdesk/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card } from '../../components/base/Card.tsx';
import { Dialog } from '../../components/base/Dialog.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { Pagination } from '../../components/base/Pagination.tsx';
import { formatDate } from '../../lib/format.ts';
import { workspacePath } from '../../lib/paths.ts';
import { useCustomers } from '../customers/api.ts';
import { useContracts, useCreateContract, useDashboard } from './api.ts';
import { ContractForm } from './ContractForm.tsx';
import { ContractRows } from './ContractRows.tsx';
import { CONTRACT_STATUS_LABELS } from './labels.ts';

export function ContractListPage({ workspace }: { workspace: WorkspaceSummary }) {
  const [params, setParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);

  const search = params.get('search') ?? '';
  const status = (params.get('status') as ContractVisibleStatus | null) ?? undefined;
  const onDate = params.get('onDate') ?? undefined;
  const page = Number(params.get('page') ?? '1');

  const query = useContracts(workspace.id, {
    search,
    ...(status ? { status } : {}),
    ...(onDate ? { onDate } : {}),
    page,
  });
  const board = useDashboard(workspace.id, onDate);
  const customers = useCustomers(workspace.id, { status: 'active', pageSize: 100 });
  const create = useCreateContract(workspace.id);

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
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em]">Serviceverträge</h1>
          <p className="mt-1 text-sm text-muted">
            Wiederkehrende Leistungen wie Hosting, Wartung oder Support.
          </p>
        </div>
        <Button
          variant="primary"
          disabled={availableCustomers.length === 0}
          onClick={() => setDialogOpen(true)}
        >
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          Vertrag anlegen
        </Button>
      </div>

      {board.data && (
        <Card className="px-4 py-4 sm:px-5">
          <p className="text-[10px] font-semibold tracking-[0.09em] text-faint uppercase">
            Monatlicher Vertragswert am {formatDate(board.data.contractDate)}
          </p>
          <p className="mt-2 font-mono text-2xl leading-none font-medium">
            CHF {formatAmountMinor(board.data.monthlyContractValueMinor)}
          </p>
          <p className="mt-2 text-xs text-faint">
            {board.data.confirmedContracts === 1
              ? '1 bestätigter Vertrag zählt an diesem Tag'
              : `${board.data.confirmedContracts} bestätigte Verträge zählen an diesem Tag`}
            . Vertraglich vereinbart, kein Zahlungseingang.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex min-h-11 flex-1 items-center gap-2.5 rounded-lg border border-line bg-surface px-3">
          <Search size={16} strokeWidth={1.8} className="shrink-0 text-faint" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => patchParams({ search: event.target.value })}
            placeholder="Bezeichnung oder Kunde"
            aria-label="Verträge durchsuchen"
            className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="vertrag-status-filter" className="text-xs font-medium text-faint">
            Zustand
          </label>
          <select
            id="vertrag-status-filter"
            value={status ?? ''}
            onChange={(event) => patchParams({ status: event.target.value || null })}
            className="min-h-11 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus-visible:border-accent"
          >
            <option value="">Alle Zustände</option>
            {CONTRACT_VISIBLE_STATUS.map((option) => (
              <option key={option} value={option}>
                {CONTRACT_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="vertrag-stichtag" className="text-xs font-medium text-faint">
            Stichtag
          </label>
          <input
            id="vertrag-stichtag"
            type="date"
            value={onDate ?? ''}
            onChange={(event) => patchParams({ onDate: event.target.value || null })}
            className="min-h-11 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus-visible:border-accent"
          />
        </div>
      </div>

      <Card>
        {query.isPending && <LoadingState label="Verträge werden geladen …" />}
        {query.isError && (
          <ErrorState detail="Die Vertragsliste konnte nicht geladen werden. Bitte Seite neu laden." />
        )}

        {query.data && query.data.data.length === 0 && (
          <EmptyState
            title={search || status ? 'Kein Treffer' : 'Noch keine Verträge'}
            detail={
              search || status
                ? 'In dieser Ansicht gibt es keinen Vertrag. Suche, Zustand oder Stichtag ändern.'
                : availableCustomers.length === 0
                  ? 'Ein Vertrag gehört immer zu einem Kunden. Lege zuerst einen Kunden an.'
                  : 'Der erste Vertrag erscheint hier — und sein Betrag im monatlichen Vertragswert.'
            }
          />
        )}

        {query.data && query.data.data.length > 0 && (
          <>
            <div className="pt-4">
              <ContractRows
                contracts={query.data.data}
                basePath={workspacePath(workspace.id, 'contracts')}
              />
            </div>
            <Pagination
              pagination={query.data.pagination}
              onChange={(next) => patchParams({ page: String(next) })}
            />
          </>
        )}
      </Card>

      <Dialog open={dialogOpen} title="Vertrag anlegen" onClose={() => setDialogOpen(false)}>
        <ContractForm
          customers={availableCustomers}
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
