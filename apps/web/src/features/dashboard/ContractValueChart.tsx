import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlyValuePoint } from '@clientdesk/contracts';
import { useChartColors } from '../../lib/use-chart-colors.ts';
import { ContractValueTable } from './ContractValueTable.tsx';

/**
 * Ein Balken. Recharts animiert seine Balken nur alle gleichzeitig; der
 * Versatz kommt deshalb hier aus derselben Regel, die auch Tabellenreihen
 * staffelt — samt Deckel, damit ein längeres Diagramm nicht auseinanderläuft.
 *
 * `transformBox: fill-box` ist bei SVG nötig, sonst bezieht sich
 * `transform-origin: bottom` auf den Ursprung der Zeichenfläche und der Balken
 * wächst aus der falschen Kante.
 */
interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  index?: number;
}

function GrowingBar({ x, y, width, height, fill, index = 0 }: BarShapeProps) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      className="motion-bar"
      style={{ transformBox: 'fill-box', '--motion-index': index } as CSSProperties}
    />
  );
}

export function ContractValueChart({ history }: { history: MonthlyValuePoint[] }) {
  const colors = useChartColors();

  // Ohne useMemo entstünde bei jedem Render ein neues Array, und Recharts
  // startete seine Balkenanimation jedes Mal von vorn — sichtbar als Diagramm,
  // das seine Balken zeichnet und sofort wieder verliert.
  const data = useMemo(
    () => history.map((point) => ({ ...point, francs: point.amountMinor / 100 })),
    [history],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Für Screenreader ist die Tabelle darunter die zugängliche Fassung. */}
      <div className="h-[200px] w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: colors.axis, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: colors.cursor }}
            />
            <YAxis
              tick={{ fill: colors.axis, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => value.toLocaleString('de-CH')}
            />
            <Tooltip
              cursor={{ fill: colors.cursor, opacity: 0.35 }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
              labelStyle={{ color: 'var(--muted)', fontFamily: 'var(--font-condensed)' }}
              formatter={(value) => [
                `CHF ${typeof value === 'number' ? value.toLocaleString('de-CH') : '—'}`,
                'Monatswert',
              ]}
            />
            {/* Eigene Animation statt der von Recharts: gestaffelt, mit den
                Zeiten aus den Bewegungstokens, und bei reduzierter Bewegung
                automatisch still. */}
            <Bar
              dataKey="francs"
              fill={colors.mark}
              isAnimationActive={false}
              shape={<GrowingBar />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ContractValueTable history={history} />
    </div>
  );
}
