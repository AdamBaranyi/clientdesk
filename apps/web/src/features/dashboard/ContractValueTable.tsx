import { formatAmountMinor, type MonthlyValuePoint } from '@tallyroom/contracts';
import { Cell, Row, TableHead, Th } from '../../components/base/DataTable.tsx';
import { formatDate } from '../../lib/format.ts';

/**
 * Die Zahlen hinter dem Diagramm, aufklappbar. Für Screenreader ist das die
 * eigentliche Fassung — das Diagramm daneben ist als dekorativ ausgezeichnet.
 */
export function ContractValueTable({ history }: { history: MonthlyValuePoint[] }) {
  return (
    <details className="border border-line-soft px-3 py-2">
      <summary className="font-condensed text-label cursor-pointer font-semibold tracking-[0.08em] text-muted uppercase">
        Werte als Tabelle
      </summary>
      <table className="mt-3 w-full border-collapse">
        <caption className="sr-only">
          Monatlicher Vertragswert der letzten sechs Monate in Schweizer Franken
        </caption>
        <TableHead>
          <Th>Monat</Th>
          <Th>Stichtag</Th>
          <Th right>Vertragswert · CHF</Th>
        </TableHead>
        <tbody>
          {history.map((point) => (
            <Row key={point.date}>
              <Cell lead>
                {point.label}
                {point.isCurrentMonth && (
                  <span className="text-micro ml-2 text-muted">laufender Monat</span>
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
