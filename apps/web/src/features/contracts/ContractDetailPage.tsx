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

export function ContractDetailPage({ workspace }: { workspace: WorkspaceSummary }) {
  const { contractId } = useParams();
  const query = useContract(workspace.id, contractId);
  const rates = useRates(workspace.id, contractId);
  const update = useUpdateContract(workspace.id, contractId ?? '');

  const preview = useRecordTitlePreview();
  if (query.isPending) return <PendingRecord title={preview} label="Vertrag wird geladen …" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState detail="Dieser Vertrag existiert nicht oder gehört zu einem anderen Workspace." />
    );
  }

  const contract = query.data;
  const conflict =
    update.error instanceof ApiRequestError && update.error.code === 'VERSION_CONFLICT';

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <Link
        to={workspacePath(workspace.id, 'contracts')}
        className="inline-flex items-center gap-1.5 text-sm text-muted no-underline hover:text-ink"
      >
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Alle Verträge
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <RecordHeading>{contract.name}</RecordHeading>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted">
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
            {update.isPending ? 'Wird bestätigt …' : 'Vertrag bestätigen'}
          </Button>
        )}
      </div>

      {conflict && (
        <p
          role="alert"
          className="rounded-sm border border-line bg-raised px-4 py-3 text-sm text-danger"
        >
          Der Vertrag wurde inzwischen von jemand anderem geändert. Bitte Seite neu laden.
        </p>
      )}

      <Card>
        <CardHeader title="Übersicht" />
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-4 pb-5 sm:grid-cols-3 sm:px-5">
          <Entry label="Beginn" value={formatDate(contract.startDate)} />
          <Entry
            label="Ende (exklusiv)"
            value={contract.endDate ? formatDate(contract.endDate) : 'Offen'}
          />
          <Entry
            label="Aktuell monatlich"
            value={
              contract.amountAtDateMinor === null
                ? contract.visibleStatus === 'planned'
                  ? 'Gilt ab Vertragsbeginn'
                  : 'Kein Preis hinterlegt'
                : `CHF ${formatAmountMinor(contract.amountAtDateMinor)}`
            }
          />
        </dl>

        {contract.publicDescription && (
          <div className="border-t border-line-soft px-4 py-4 sm:px-5">
            <dt className="text-[10px] font-semibold tracking-[0.09em] text-muted uppercase">
              Leistungsbeschreibung
            </dt>
            <dd className="mt-1.5 max-w-[70ch] text-sm whitespace-pre-line">
              {contract.publicDescription}
            </dd>
            <p className="mt-2 text-xs text-muted">
              {contract.clientVisible
                ? 'Für den Kunden im Portal sichtbar.'
                : 'Noch nicht fürs Kundenportal freigegeben.'}
            </p>
          </div>
        )}

        {contract.internalNote && (
          <div className="border-t border-line-soft px-4 py-4 sm:px-5">
            <dt className="text-[10px] font-semibold tracking-[0.09em] text-muted uppercase">
              Interne Notiz
            </dt>
            <dd className="mt-1.5 max-w-[70ch] text-sm whitespace-pre-line">
              {contract.internalNote}
            </dd>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Preisversionen"
          action={
            <span className="text-xs text-muted">
              Eine Änderung ersetzt nichts — sie gilt ab ihrem Datum
            </span>
          }
        />
        {rates.isPending && <LoadingState label="Preisversionen werden geladen …" />}
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
      <dt className="text-[10px] font-semibold tracking-[0.09em] text-muted uppercase">{label}</dt>
      <dd className="mt-1.5 font-mono text-sm">{value}</dd>
    </div>
  );
}
