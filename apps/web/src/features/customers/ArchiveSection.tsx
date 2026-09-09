import type { Customer, WorkspaceSummary } from '@clientdesk/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { useArchiveBlockers, useArchiveCustomer } from './api.ts';

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

  if (customer.archivedAt) {
    return (
      <Card>
        <CardHeader title="Archiviert" />
        <div className="flex flex-col gap-3 px-4 pb-4 sm:px-5">
          <p className="max-w-[62ch] text-sm text-muted">
            Dieser Kunde ist archiviert. Die Daten bleiben vollständig lesbar und können
            zurückgeholt werden.
          </p>
          <div>
            <Button
              variant="secondary"
              disabled={action.isPending}
              onClick={() => action.mutate('restore')}
            >
              {action.isPending ? 'Wird zurückgeholt …' : 'Kunde zurückholen'}
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
      <CardHeader title="Archivieren" />
      <div className="flex flex-col gap-3 px-4 pb-4 sm:px-5">
        {blockers.isPending && <p className="text-sm text-muted">Wird geprüft …</p>}

        {blocked && counts && (
          <div className="rounded-md border border-line bg-raised px-3 py-3">
            <p className="text-sm font-medium">Noch nicht möglich</p>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-muted">
              {counts.runningProjects > 0 && (
                <li>
                  {counts.runningProjects === 1
                    ? '1 laufendes Projekt'
                    : `${counts.runningProjects} laufende Projekte`}
                </li>
              )}
              {counts.activeContracts > 0 && (
                <li>
                  {counts.activeContracts === 1
                    ? '1 aktiver Vertrag'
                    : `${counts.activeContracts} aktive Verträge`}
                </li>
              )}
              {counts.openRequests > 0 && (
                <li>
                  {counts.openRequests === 1
                    ? '1 offene Anfrage'
                    : `${counts.openRequests} offene Anfragen`}
                </li>
              )}
            </ul>
          </div>
        )}

        {!blocked && counts && (
          <p className="max-w-[62ch] text-sm text-muted">
            Nichts steht entgegen. Archivierte Kunden verschwinden aus der Standardliste, bleiben
            aber lesbar und können jederzeit zurückgeholt werden.
          </p>
        )}

        {action.isError && (
          <p role="alert" className="text-sm text-danger">
            Archivieren nicht möglich. Möglicherweise ist inzwischen neue Arbeit dazugekommen —
            bitte Seite neu laden.
          </p>
        )}

        <div>
          <Button
            variant="danger"
            disabled={blocked || action.isPending || blockers.isPending}
            onClick={() => action.mutate('archive')}
          >
            {action.isPending ? 'Wird archiviert …' : 'Kunde archivieren'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
