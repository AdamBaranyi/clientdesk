import type { Customer, WorkspaceSummary } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { useArchiveBlockers, useArchiveCustomer } from './api.ts';
import { customerMessages } from './messages.ts';

interface Props {
  workspace: WorkspaceSummary;
  customer: Customer;
}

/**
 * Zeigt vor dem Archivieren die konkreten Hinderungsgründe an. Der Server
 * prüft sie beim Ausführen erneut in derselben Transaktion — diese Anzeige
 * ist Erklärung, nicht Zugriffskontrolle.
 */
export function ArchiveSection({ workspace, customer }: Props) {
  const blockers = useArchiveBlockers(workspace.id, customer.archivedAt ? undefined : customer.id);
  const action = useArchiveCustomer(workspace.id, customer.id);
  const m = useMessages(customerMessages);

  if (customer.archivedAt) {
    return (
      <Card>
        <CardHeader title={m.status.archived} />
        <div className="flex flex-col gap-3 px-4 pb-4 sm:px-5">
          <p className="max-w-[62ch] text-body text-muted">{m.archive.archivedDetail}</p>
          <div>
            <Button
              variant="secondary"
              disabled={action.isPending}
              onClick={() => action.mutate('restore')}
            >
              {action.isPending ? m.archive.restoring : m.archive.restore}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const counts = blockers.data;
  const total = counts ? counts.runningProjects + counts.activeContracts + counts.openRequests : 0;
  const blocked = Boolean(counts) && total > 0;

  return (
    <Card>
      <CardHeader title={m.archive.title} />
      <div className="flex flex-col gap-3 px-4 pb-4 sm:px-5">
        {blockers.isPending && <p className="text-body text-muted">{m.archive.checking}</p>}

        {blocked && counts && (
          <div className="rounded-sm border border-line bg-raised px-3 py-3">
            <p className="text-body font-medium">{m.archive.blocked}</p>
            <ul className="mt-2 flex flex-col gap-1 text-body text-muted">
              {counts.runningProjects > 0 && (
                <li>{m.runningProjectCount(counts.runningProjects)}</li>
              )}
              {counts.activeContracts > 0 && (
                <li>{m.archive.activeContracts(counts.activeContracts)}</li>
              )}
              {counts.openRequests > 0 && <li>{m.archive.openRequests(counts.openRequests)}</li>}
            </ul>
          </div>
        )}

        {!blocked && counts && (
          <p className="max-w-[62ch] text-body text-muted">{m.archive.nothingBlocks}</p>
        )}

        {action.isError && (
          <p role="alert" className="text-body text-danger">
            {m.archive.failed}
          </p>
        )}

        <div>
          <Button
            variant="danger"
            disabled={blocked || action.isPending || blockers.isPending}
            onClick={() => action.mutate('archive')}
          >
            {action.isPending ? m.archive.archiving : m.archive.archive}
          </Button>
        </div>
      </div>
    </Card>
  );
}
