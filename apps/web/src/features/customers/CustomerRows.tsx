import { Link } from 'react-router';
import type { Customer } from '@clientdesk/contracts';
import { ArchivedBadge } from '../../components/base/StatusBadge.tsx';

interface Props {
  customers: Customer[];
  basePath: string;
}

/**
 * Zwei Darstellungen desselben Bestands: ab sm eine Tabelle, darunter Karten.
 * Damit bleibt auf 320 Pixeln alles lesbar, ohne die Tabelle seitlich zu
 * schieben oder Spalten ersatzlos wegzulassen.
 */
export function CustomerRows({ customers, basePath }: Props) {
  return (
    <>
      <ul className="flex flex-col sm:hidden">
        {customers.map((customer) => (
          <li key={customer.id} className="border-t border-line-soft">
            <Link
              to={`${basePath}/${customer.id}`}
              className="flex flex-col gap-1.5 px-4 py-4 no-underline hover:bg-raised"
            >
              <span className="font-medium text-ink">{customer.name}</span>
              {customer.contactName && (
                <span className="text-sm text-muted">{customer.contactName}</span>
              )}
              <span className="flex flex-wrap items-center gap-3 text-xs text-faint">
                <span>
                  {customer.activeProjectCount === 1
                    ? '1 laufendes Projekt'
                    : `${customer.activeProjectCount} laufende Projekte`}
                </span>
                {customer.archivedAt && <ArchivedBadge />}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <table className="hidden w-full border-collapse sm:table">
        <thead>
          <tr className="text-left text-[10px] font-semibold tracking-[0.09em] text-faint uppercase">
            <th className="px-5 pb-2 font-semibold">Name</th>
            <th className="px-5 pb-2 font-semibold">Hauptkontakt</th>
            <th className="px-5 pb-2 font-semibold">Status</th>
            <th className="px-5 pb-2 text-right font-semibold">Laufende Projekte</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-t border-line-soft hover:bg-raised">
              <td className="px-5 py-3">
                <Link to={`${basePath}/${customer.id}`} className="font-medium no-underline">
                  {customer.name}
                </Link>
              </td>
              <td className="px-5 py-3 text-sm text-muted">{customer.contactName ?? '—'}</td>
              <td className="px-5 py-3">
                {customer.archivedAt ? (
                  <ArchivedBadge />
                ) : (
                  <span className="text-xs text-muted">Aktiv</span>
                )}
              </td>
              <td className="px-5 py-3 text-right font-mono text-sm">
                {customer.activeProjectCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
