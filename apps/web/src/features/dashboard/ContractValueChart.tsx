import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatAmountMinor, type MonthlyValuePoint } from '@clientdesk/contracts';
import { useTheme } from '../../lib/theme-context.ts';
import { formatDate } from '../../lib/format.ts';

/**
 * Recharts liest keine CSS-Variablen, deshalb die Tokenwerte hier als Literale
 * — sie stammen aus derselben Palette wie tokens.css.
 */
const PALETTE = {
  dark: { accent: '#7C6BFF', muted: '#2A3242', axis: '#6A7385', grid: '#232936' },
  light: { accent: '#5B47E0', muted: '#DEE0E8', axis: '#88909F', grid: '#EBECF1' },
} as const;

export function ContractValueChart({ history }: { history: MonthlyValuePoint[] }) {
  const { resolved } = useTheme();
  const colors = PALETTE[resolved];

  // Ohne useMemo entstünde bei jedem Render ein neues Array, und Recharts
  // startete seine Balkenanimation jedes Mal von vorn — sichtbar als Diagramm,
  // das seine Balken zeichnet und sofort wieder verliert.
  const data = useMemo(
    () => history.map((point) => ({ ...point, francs: point.amountMinor / 100 })),
    [history],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Für Screenreader ist die Tabelle darunter die zugängliche Fassung. */}
      <div className="h-[200px] w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: colors.axis, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: colors.grid }}
            />
            <YAxis
              tick={{ fill: colors.axis, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => `${value.toLocaleString('de-CH')}`}
            />
            <Tooltip
              cursor={{ fill: colors.grid, opacity: 0.4 }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: 'var(--muted)' }}
              formatter={(value) => [
                `CHF ${typeof value === 'number' ? value.toLocaleString('de-CH') : '—'}`,
                'Monatswert',
              ]}
            />
            {/* Ohne Animation: das Diagramm ist ein Datenbild, keine Vorführung —
                und es bleibt bei reduzierter Bewegung ruhig. */}
            <Bar
              dataKey="francs"
              radius={[4, 4, 0, 0]}
              fill={colors.accent}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="rounded-md border border-line-soft px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-muted">
          Werte als Tabelle
        </summary>
        <table className="mt-3 w-full border-collapse text-sm">
          <caption className="sr-only">
            Monatlicher Vertragswert der letzten sechs Monate in Schweizer Franken
          </caption>
          <thead>
            <tr className="text-left text-[10px] font-semibold tracking-[0.09em] text-faint uppercase">
              <th className="pb-2 font-semibold">Monat</th>
              <th className="pb-2 font-semibold">Stichtag</th>
              <th className="pb-2 text-right font-semibold">Vertragswert</th>
            </tr>
          </thead>
          <tbody>
            {history.map((point) => (
              <tr key={point.date} className="border-t border-line-soft">
                <td className="py-2">
                  {point.label}
                  {point.isCurrentMonth && (
                    <span className="ml-2 text-xs text-faint">laufender Monat</span>
                  )}
                </td>
                <td className="py-2 font-mono text-xs text-muted">{formatDate(point.date)}</td>
                <td className="py-2 text-right font-mono">
                  CHF {formatAmountMinor(point.amountMinor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
