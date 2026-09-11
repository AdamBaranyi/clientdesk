import { Link } from 'react-router';
import { formatAmountMinor, type ServiceContract } from '@tallyroom/contracts';
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
import { formatDate } from '../../lib/format.ts';
import { ContractStatusBadge } from './ContractStatusBadge.tsx';

interface Props {
  contracts: ServiceContract[];
  basePath: string;
  showCustomer?: boolean;
}

/**
 * Der Betrag am Stichtag. Die Währung steht im Spaltenkopf und nicht in jeder
 * Zeile — sie ändert sich nicht, und wiederholt kostet sie nur Platz neben der
 * Zahl, auf die es ankommt.
 */
function Amount({ contract }: { contract: ServiceContract }) {
  if (contract.amountAtDateMinor === null) {
    // Bei einem geplanten Vertrag gibt es sehr wohl einen Preis — er gilt am
    // Stichtag nur noch nicht. „Kein Preis" würde einen Datenfehler nahelegen.
    return (
      <span className="text-micro whitespace-nowrap">
        {contract.visibleStatus === 'planned' ? 'Ab Vertragsbeginn' : 'Kein Preis hinterlegt'}
      </span>
    );
  }
  return <>{formatAmountMinor(contract.amountAtDateMinor)}</>;
}

function term(contract: ServiceContract): string {
  const start = formatDate(contract.startDate);
  return contract.endDate ? `${start} – ${formatDate(contract.endDate)}` : `${start} – offen`;
}

export function ContractRows({ contracts, basePath, showCustomer = true }: Props) {
  return (
    <>
      <CardList>
        {contracts.map((contract) => (
          <CardItem key={contract.id}>
            <Link
              to={`${basePath}/${contract.id}`}
              className="flex flex-col gap-2 px-4 py-4 text-ink hover:bg-raised"
            >
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">{contract.name}</span>
                <span className="text-dense font-mono tabular-nums text-muted">
                  <Amount contract={contract} />
                </span>
              </span>
              {showCustomer && (
                <span className="text-dense text-muted">{contract.customerName}</span>
              )}
              <span className="flex flex-wrap items-center gap-3">
                <ContractStatusBadge status={contract.visibleStatus} />
                <span className="text-micro font-mono tabular-nums text-muted">
                  {term(contract)}
                </span>
              </span>
            </Link>
          </CardItem>
        ))}
      </CardList>

      <DataTable>
        <TableHead>
          <Th>Bezeichnung</Th>
          {showCustomer && <Th>Kunde</Th>}
          <Th>Status</Th>
          <Th>Laufzeit</Th>
          <Th right>Monatlich · CHF</Th>
        </TableHead>
        <tbody>
          {contracts.map((contract) => (
            <Row key={contract.id}>
              <Cell lead>
                <RecordLink to={`${basePath}/${contract.id}`} title={contract.name} />
              </Cell>
              {showCustomer && <Cell>{contract.customerName}</Cell>}
              <Cell>
                <ContractStatusBadge status={contract.visibleStatus} />
              </Cell>
              <Cell numeric>{term(contract)}</Cell>
              <Cell right numeric>
                <Amount contract={contract} />
              </Cell>
            </Row>
          ))}
        </tbody>
      </DataTable>
    </>
  );
}
