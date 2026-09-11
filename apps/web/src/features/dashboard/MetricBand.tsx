import type { Dashboard } from '@tallyroom/contracts';
import { useMessages } from '../../i18n/messages.ts';
import { formatDate } from '../../lib/format.ts';
import { splitAmountForDisplay } from '../../lib/money-display.ts';
import { dashboardMessages } from './messages.ts';
import { MetricFigure } from './MetricFigure.tsx';

interface Props {
  data: Dashboard;
  /** Pfadwurzel des Workspace, für die Sprünge in die gefilterten Listen. */
  base: string;
}

/**
 * Das Kennzahlband. Eine Messlatte mit vier Feldern, kein Kartenteppich.
 *
 * Vier gleich breite Karten waren die eigentliche Schwäche: sie behaupteten,
 * alle vier Zahlen seien gleich wichtig. Sind sie nicht — der Vertragswert ist
 * die Zahl, wegen der jemand diese Seite öffnet. Er bekommt deshalb rund 43
 * Prozent der Breite und eine Stufe mehr Schriftgrad; die drei Zähler stützen.
 *
 * Nebenbei löst das ein Platzproblem: in vier gleichen Spalten sind 283 Pixel
 * pro Zelle frei, und `CHF 2'970.00` braucht in Plex Mono bei 48 Pixeln schon
 * 346. Die wichtigste Zahl des Produkts passte nicht in ihre eigene Zelle.
 *
 * Die Latte zeichnet sich einmal von links nach rechts, die Zahlen erscheinen
 * in ihrem Kielwasser. Ein choreografierter Moment statt vier einzelner.
 */
export function MetricBand({ data, base }: Props) {
  const m = useMessages(dashboardMessages);
  const value = splitAmountForDisplay(data.monthlyContractValueMinor);
  const stichtag = formatDate(data.contractDate);

  return (
    <section aria-label={m.metrics.label} data-tour="metrics" className="flex flex-col">
      <div aria-hidden className="motion-rule h-px w-full bg-line" />

      <div className="grid gap-6 pt-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,9fr)_repeat(3,minmax(0,4fr))]">
        <MetricFigure
          index={0}
          lead
          label={m.monthlyContractValue}
          unit={m.metrics.contractValueUnit}
          figure={value.francs}
          cents={value.cents}
          note={m.metrics.contractValueNote(stichtag)}
          to={`${base}/contracts?status=active`}
        />
        <MetricFigure
          index={1}
          label={m.metrics.activeCustomers}
          figure={String(data.activeCustomers)}
          note={m.metrics.activeCustomersNote}
          to={`${base}/customers`}
        />
        <MetricFigure
          index={2}
          label={m.metrics.runningProjects}
          figure={String(data.runningProjects)}
          note={m.metrics.runningProjectsNote(data.pausedProjects)}
          to={`${base}/projects?status=active`}
        />
        <MetricFigure
          index={3}
          label={m.metrics.confirmedContracts}
          figure={String(data.confirmedContracts)}
          note={m.metrics.confirmedContractsNote(stichtag)}
          to={`${base}/contracts`}
        />
      </div>
    </section>
  );
}
