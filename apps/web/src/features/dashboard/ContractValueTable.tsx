import { formatAmountMinor, type MonthlyValuePoint } from '@tallyroom/contracts';
import { Cell, Row, TableHead, Th } from '../../components/base/DataTable.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { formatDate } from '../../lib/format.ts';
import { dashboardMessages } from './messages.ts';

/**
 * Die Zahlen hinter dem Diagramm, aufklappbar. Für Screenreader ist das die
 * eigentliche Fassung — das Diagramm daneben ist als dekorativ ausgezeichnet.
 */
export function ContractValueTable({ history }: { history: MonthlyValuePoint[] }) {
  const m = useMessages(dashboardMessages);
  return (
    <details className="border border-line-soft px-3 py-2">
      <summary className="font-condensed text-body cursor-pointer font-semibold tracking-[0.06em] text-muted uppercase">
        {m.history.tableToggle}
      </summary>
      <table className="mt-3 w-full border-collapse">
        <caption className="sr-only">{m.history.tableCaption}</caption>
        <TableHead>
          <Th>{m.history.month}</Th>
          <Th>{m.history.referenceDate}</Th>
          <Th right>{m.history.contractValue}</Th>
        </TableHead>
        <tbody>
          {history.map((point) => (
            <Row key={point.date}>
              <Cell lead>
                {point.label}
                {point.isCurrentMonth && (
                  <span className="text-body ml-2 text-muted">{m.history.currentMonth}</span>
                )}
              </Cell>
              <Cell numeric>{formatDate(point.date)}</Cell>
              <Cell right numeric>
                {formatAmountMinor(point.amountMinor)}
              </Cell>
            </Row>
          ))}
        </tbody>
      </table>
    </details>
  );
}
