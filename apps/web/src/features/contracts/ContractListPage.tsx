import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router';
import {
  CONTRACT_VISIBLE_STATUS,
  formatAmountMinor,
  type ContractVisibleStatus,
  type WorkspaceSummary,
} from '@tallyroom/contracts';
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
import { SearchField, SelectField } from '../../components/base/Controls.tsx';
import { domainMessages } from '../../i18n/domain-messages.ts';
import { useMessages } from '../../i18n/messages.ts';
import { contractMessages } from './messages.ts';

export function ContractListPage({ workspace }: { workspace: WorkspaceSummary }) {
  const [params, setParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const m = useMessages(contractMessages);
  const domain = useMessages(domainMessages);

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
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-section font-semibold tracking-[-0.02em]">{m.list.title}</h1>
          <p className="mt-1 text-body text-muted">{m.list.lead}</p>
        </div>
        <Button
          variant="primary"
          disabled={availableCustomers.length === 0}
          onClick={() => setDialogOpen(true)}
        >
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          {m.createContract}
        </Button>
      </div>

      {board.data && (
        <Card className="px-4 py-4 sm:px-5">
          <p className="text-body font-semibold tracking-[0.06em] text-muted uppercase">
            {m.list.monthlyValueOn(formatDate(board.data.contractDate))}
          </p>
          <p className="mt-2 font-mono text-2xl leading-none font-medium">
            CHF {formatAmountMinor(board.data.monthlyContractValueMinor)}
          </p>
          <p className="mt-2 text-body text-muted">
            {m.list.confirmedNote(board.data.confirmedContracts)}
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchField
          value={search}
          onChange={(wert) => patchParams({ search: wert })}
          placeholder={m.list.searchPlaceholder}
          label={m.list.searchLabel}
        />

        <SelectField
          id="vertrag-status-filter"
          label={m.list.statusFilter}
          value={status ?? ''}
          onChange={(event) => patchParams({ status: event.target.value || null })}
        >
          <option value="">{m.list.allStatuses}</option>
          {CONTRACT_VISIBLE_STATUS.map((option) => (
            <option key={option} value={option}>
              {domain.contractStatus[option]}
            </option>
          ))}
        </SelectField>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="vertrag-stichtag" className="text-body font-medium text-muted">
            {m.list.referenceDate}
          </label>
          <input
            id="vertrag-stichtag"
            type="date"
            value={onDate ?? ''}
            onChange={(event) => patchParams({ onDate: event.target.value || null })}
            className="text-body min-h-11 rounded-sm border border-line bg-surface px-3 text-ink"
          />
        </div>
      </div>

      <Card>
        {query.isPending && <LoadingState label={m.list.loading} />}
        {query.isError && <ErrorState detail={m.list.loadFailed} />}

        {query.data && query.data.data.length === 0 && (
          <EmptyState
            title={search || status ? m.list.noMatchTitle : m.list.emptyTitle}
            detail={
              search || status
                ? m.list.noMatchDetail
                : availableCustomers.length === 0
                  ? m.list.noCustomersDetail
                  : m.list.emptyDetail
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

      <Dialog open={dialogOpen} title={m.createContract} onClose={() => setDialogOpen(false)}>
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
