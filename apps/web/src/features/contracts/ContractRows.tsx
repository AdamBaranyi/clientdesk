import { Link } from 'react-router';
import { formatAmountMinor, type ServiceContract } from '@clientdesk/contracts';
import { formatDate } from '../../lib/format.ts';
import { ContractStatusBadge } from './ContractStatusBadge.tsx';

interface Props {
  contracts: ServiceContract[];
  basePath: string;
  showCustomer?: boolean;
}

function Amount({ contract }: { contract: ServiceContract }) {
  if (contract.amountAtDateMinor === null) {
    // Bei einem geplanten Vertrag gibt es sehr wohl einen Preis — er gilt am
    // Stichtag nur noch nicht. „Kein Preis" würde einen Datenfehler nahelegen.
    return (
      <span className="text-xs whitespace-nowrap text-faint">
        {contract.visibleStatus === 'planned' ? 'Ab Vertragsbeginn' : 'Kein Preis hinterlegt'}
      </span>
    );
  }
  return (
    <span className="font-mono text-sm">CHF {formatAmountMinor(contract.amountAtDateMinor)}</span>
  );
}

export function ContractRows({ contracts, basePath, showCustomer = true }: Props) {
  return (
    <>
      <ul className="flex flex-col sm:hidden">
        {contracts.map((contract) => (
          <li key={contract.id} className="border-t border-line-soft">
            <Link
              to={`${basePath}/${contract.id}`}
              className="flex flex-col gap-2 px-4 py-4 no-underline hover:bg-raised"
            >
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-ink">{contract.name}</span>
                <Amount contract={contract} />
              </span>
              {showCustomer && <span className="text-sm text-muted">{contract.customerName}</span>}
              <span className="flex flex-wrap items-center gap-3">
                <ContractStatusBadge status={contract.visibleStatus} />
                <span className="font-mono text-xs text-faint">
                  ab {formatDate(contract.startDate)}
                  {contract.endDate ? ` bis ${formatDate(contract.endDate)}` : ''}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <table className="hidden w-full border-collapse sm:table">
        <thead>
          <tr className="text-left text-[10px] font-semibold tracking-[0.09em] text-faint uppercase">
            <th className="px-5 pb-2 font-semibold">Bezeichnung</th>
            {showCustomer && <th className="px-5 pb-2 font-semibold">Kunde</th>}
            <th className="px-5 pb-2 font-semibold">Status</th>
            <th className="px-5 pb-2 font-semibold">Laufzeit</th>
            <th className="px-5 pb-2 text-right font-semibold">Monatlich</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.id} className="border-t border-line-soft hover:bg-raised">
              <td className="px-5 py-3">
                <Link to={`${basePath}/${contract.id}`} className="font-medium no-underline">
                  {contract.name}
                </Link>
              </td>
              {showCustomer && (
                <td className="px-5 py-3 text-sm text-muted">{contract.customerName}</td>
              )}
              <td className="px-5 py-3">
                <ContractStatusBadge status={contract.visibleStatus} />
              </td>
              <td className="px-5 py-3 font-mono text-xs text-muted">
                {formatDate(contract.startDate)}
                {contract.endDate ? ` – ${formatDate(contract.endDate)}` : ' – offen'}
              </td>
              <td className="px-5 py-3 text-right">
                <Amount contract={contract} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
