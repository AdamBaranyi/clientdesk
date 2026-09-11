import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { formatAmountMinor, type WorkspaceSummary } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { ApiRequestError } from '../../lib/api.ts';
import { formatDate } from '../../lib/format.ts';
import { workspacePath } from '../../lib/paths.ts';
import { ContractStatusBadge } from './ContractStatusBadge.tsx';
import { RateHistory } from './RateHistory.tsx';
import { useContract, useRates, useUpdateContract } from './api.ts';
import { PendingRecord, RecordHeading } from '../../components/base/RecordLink.tsx';
import { useRecordTitlePreview } from '../../lib/use-record-title.ts';
import { useMessages } from '../../i18n/messages.ts';
import { contractMessages } from './messages.ts';

export function ContractDetailPage({ workspace }: { workspace: WorkspaceSummary }) {
  const { contractId } = useParams();
  const query = useContract(workspace.id, contractId);
  const rates = useRates(workspace.id, contractId);
  const update = useUpdateContract(workspace.id, contractId ?? '');
  const m = useMessages(contractMessages);

  const preview = useRecordTitlePreview();
  if (query.isPending) return <PendingRecord title={preview} label={m.detail.loading} />;
  if (query.isError || !query.data) {
    return <ErrorState detail={m.detail.notFound} />;
  }

  const contract = query.data;
  const conflict =
    update.error instanceof ApiRequestError && update.error.code === 'VERSION_CONFLICT';

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <Link
        to={workspacePath(workspace.id, 'contracts')}
        className="inline-flex items-center gap-1.5 text-body text-muted no-underline hover:text-ink"
      >
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        {m.detail.back}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <RecordHeading>{contract.name}</RecordHeading>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-body text-muted">
            <span>{contract.customerName}</span>
            <ContractStatusBadge status={contract.visibleStatus} />
          </div>
        </div>
        {contract.confirmationStatus === 'draft' && (
          <Button
            variant="primary"
            disabled={update.isPending}
            onClick={() =>
              update.mutate({ confirmationStatus: 'confirmed', version: contract.version })
            }
          >
            {update.isPending ? m.detail.confirming : m.detail.confirm}
          </Button>
        )}
      </div>

      {conflict && (
        <p
          role="alert"
          className="rounded-sm border border-line bg-raised px-4 py-3 text-body text-danger"
        >
          {m.detail.conflict}
        </p>
      )}

      <Card>
        <CardHeader title={m.detail.overview} />
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-4 pb-5 sm:grid-cols-3 sm:px-5">
          <Entry label={m.start} value={formatDate(contract.startDate)} />
          <Entry
            label={m.detail.endExclusive}
            value={contract.endDate ? formatDate(contract.endDate) : m.detail.openEnd}
          />
          <Entry
            label={m.detail.currentMonthly}
            value={
              contract.amountAtDateMinor === null
                ? contract.visibleStatus === 'planned'
                  ? m.detail.appliesFromStart
                  : m.noPrice
                : `CHF ${formatAmountMinor(contract.amountAtDateMinor)}`
            }
          />
        </dl>

        {contract.publicDescription && (
          <div className="border-t border-line-soft px-4 py-4 sm:px-5">
            <dt className="text-body font-semibold tracking-[0.06em] text-muted uppercase">
              {m.detail.serviceDescription}
            </dt>
            <dd className="mt-1.5 max-w-[70ch] text-body whitespace-pre-line">
              {contract.publicDescription}
            </dd>
            <p className="mt-2 text-body text-muted">
              {contract.clientVisible ? m.detail.visibleInPortal : m.detail.notShared}
            </p>
          </div>
        )}

        {contract.internalNote && (
          <div className="border-t border-line-soft px-4 py-4 sm:px-5">
            <dt className="text-body font-semibold tracking-[0.06em] text-muted uppercase">
              {m.internalNote}
            </dt>
            <dd className="mt-1.5 max-w-[70ch] text-body whitespace-pre-line">
              {contract.internalNote}
            </dd>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title={m.detail.priceVersions}
          action={<span className="text-body text-muted">{m.detail.priceVersionsHint}</span>}
        />
        {rates.isPending && <LoadingState label={m.detail.priceVersionsLoading} />}
        {rates.data && contractId && (
          <RateHistory workspaceId={workspace.id} contractId={contractId} rates={rates.data} />
        )}
      </Card>
    </div>
  );
}

function Entry({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-body font-semibold tracking-[0.06em] text-muted uppercase">{label}</dt>
      <dd className="mt-1.5 font-mono text-body">{value}</dd>
    </div>
  );
}
