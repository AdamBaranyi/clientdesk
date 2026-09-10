import { Link } from 'react-router';
import type { Customer } from '@clientdesk/contracts';
import {
  CardItem,
  CardList,
  Cell,
  DataTable,
  Row,
  TableHead,
  Th,
} from '../../components/base/DataTable.tsx';
import { ArchivedBadge } from '../../components/base/StatusBadge.tsx';

interface Props {
  customers: Customer[];
  basePath: string;
}

function projectCount(count: number): string {
  return count === 1 ? '1 laufendes Projekt' : `${count} laufende Projekte`;
}

/**
 * Zwei Darstellungen desselben Bestands: ab 640 Pixeln eine Tabelle, darunter
 * Karten. Damit bleibt auf 320 Pixeln alles lesbar, ohne die Tabelle seitlich
 * zu schieben oder Spalten ersatzlos wegzulassen.
 */
export function CustomerRows({ customers, basePath }: Props) {
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
                <span>{projectCount(customer.activeProjectCount)}</span>
                {customer.archivedAt && <ArchivedBadge />}
              </span>
            </Link>
          </CardItem>
        ))}
      </CardList>

      <DataTable>
        <TableHead>
          <Th>Name</Th>
          <Th>Hauptkontakt</Th>
          <Th>Status</Th>
          <Th right>Laufende Projekte</Th>
        </TableHead>
        <tbody>
          {customers.map((customer) => (
            <Row key={customer.id}>
              <Cell lead>
                <Link to={`${basePath}/${customer.id}`} className="text-ink">
                  {customer.name}
                </Link>
              </Cell>
              <Cell>{customer.contactName ?? '—'}</Cell>
              <Cell>{customer.archivedAt ? <ArchivedBadge /> : 'Aktiv'}</Cell>
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
