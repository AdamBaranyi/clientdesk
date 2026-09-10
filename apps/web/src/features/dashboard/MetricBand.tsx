import type { Dashboard } from '@clientdesk/contracts';
import { formatDate } from '../../lib/format.ts';
import { splitAmountForDisplay } from '../../lib/money-display.ts';
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
  const value = splitAmountForDisplay(data.monthlyContractValueMinor);
  const stichtag = formatDate(data.contractDate);
  const pausiert = data.pausedProjects === 1 ? '1 pausiert' : `${data.pausedProjects} pausiert`;

  return (
    <section aria-label="Kennzahlen" className="flex flex-col">
      <div aria-hidden className="motion-rule h-px w-full bg-line" />

      <div className="grid gap-6 pt-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,9fr)_repeat(3,minmax(0,4fr))]">
        <MetricFigure
          index={0}
          lead
          label="Monatlicher Vertragswert"
          unit="CHF pro Monat"
          figure={value.francs}
          cents={value.cents}
          note={`Am ${stichtag} · vereinbart, kein Zahlungseingang`}
          to={`${base}/contracts?status=active`}
        />
        <MetricFigure
          index={1}
          label="Aktive Kunden"
          figure={String(data.activeCustomers)}
          note="Nicht archiviert · aktueller Stand"
          to={`${base}/customers`}
        />
        <MetricFigure
          index={2}
          label="Laufende Projekte"
          figure={String(data.runningProjects)}
          note={`${pausiert} · aktueller Stand`}
          to={`${base}/projects?status=active`}
        />
        <MetricFigure
          index={3}
          label="Bestätigte Verträge"
          figure={String(data.confirmedContracts)}
          note={`Zählen am ${stichtag}`}
          to={`${base}/contracts`}
        />
      </div>
    </section>
  );
}
