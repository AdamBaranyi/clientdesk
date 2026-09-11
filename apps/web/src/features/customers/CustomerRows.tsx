import { Link } from 'react-router';
import type { Customer } from '@tallyroom/contracts';
import {
  CardItem,
  CardList,
  Cell,
  DataTable,
  Row,
  TableHead,
  Th,
} from '../../components/base/DataTable.tsx';
import { RecordLink } from '../../components/base/RecordLink.tsx';
import { ArchivedBadge } from '../../components/base/StatusBadge.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { customerMessages } from './messages.ts';

interface Props {
  customers: Customer[];
  basePath: string;
}

/**
 * Zwei Darstellungen desselben Bestands: ab 640 Pixeln eine Tabelle, darunter
 * Karten. Damit bleibt auf 320 Pixeln alles lesbar, ohne die Tabelle seitlich
 * zu schieben oder Spalten ersatzlos wegzulassen.
 */
export function CustomerRows({ customers, basePath }: Props) {
  const m = useMessages(customerMessages);
  return (
    <>
      <CardList>
        {customers.map((customer) => (
          <CardItem key={customer.id}>
            <Link
              to={`${basePath}/${customer.id}`}
              className="flex flex-col gap-2 px-4 py-4 text-ink hover:bg-raised"
            >
              <span className="font-medium">{customer.name}</span>
              {customer.contactName && (
                <span className="text-dense text-muted">{customer.contactName}</span>
              )}
              <span className="text-micro flex flex-wrap items-center gap-3 text-muted">
                <span>{m.runningProjectCount(customer.activeProjectCount)}</span>
                {customer.archivedAt && <ArchivedBadge />}
              </span>
            </Link>
          </CardItem>
        ))}
      </CardList>

      <DataTable>
        <TableHead>
          <Th>{m.fields.name}</Th>
          <Th>{m.fields.mainContact}</Th>
          <Th>{m.fields.status}</Th>
          <Th right>{m.fields.runningProjects}</Th>
        </TableHead>
        <tbody>
          {customers.map((customer) => (
            <Row key={customer.id}>
              <Cell lead>
                <RecordLink to={`${basePath}/${customer.id}`} title={customer.name} />
              </Cell>
              <Cell>{customer.contactName ?? '—'}</Cell>
              <Cell>{customer.archivedAt ? <ArchivedBadge /> : m.status.active}</Cell>
              <Cell right numeric>
                {customer.activeProjectCount}
              </Cell>
            </Row>
          ))}
        </tbody>
      </DataTable>
    </>
  );
}
