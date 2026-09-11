import type { ReactNode } from 'react';

/**
 * Tabellenteile im Datenblatt-Schnitt.
 *
 * Vier Listen schrieben bisher dieselben Klassen ab. Hier stehen sie einmal,
 * damit eine Spalte in allen vier Listen gleich aussieht — und damit eine
 * Änderung am Raster nicht viermal von Hand nachgezogen werden muss.
 *
 * Keine Hülle, kein Schatten, keine Rundung: die Tabelle ist das Raster. Die
 * Zeile meldet sich beim Überfahren dadurch, dass ihre gedämpften Zellen auf
 * Tinte gehen — die Zeile, auf die man schaut, wird lesbarer. Ein farbiger
 * Streifen an der Kante wäre auch in Tinte wieder der übliche Reflex.
 */

const uebergang = 'transition-colors ease-state duration-[var(--dur-snap)]';

export function DataTable({ children }: { children: ReactNode }) {
  return <table className="hidden w-full border-collapse lg:table">{children}</table>;
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-line text-left">{children}</tr>
    </thead>
  );
}

export function Th({ children, right = false }: { children: ReactNode; right?: boolean }) {
  return (
    <th
      scope="col"
      className={[
        'font-condensed text-body font-semibold tracking-[0.06em] text-muted uppercase',
        'px-3 pb-2',
        right ? 'text-right' : 'text-left',
      ].join(' ')}
    >
      {children}
    </th>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <tr className="group border-t border-line-soft">{children}</tr>;
}

interface CellProps {
  children: ReactNode;
  right?: boolean;
  /** Zahlen laufen in Mono und tabellarisch, sonst wandern die Spalten. */
  numeric?: boolean;
  /** Die Spalte, die die Zeile benennt. Trägt Tinte, auch ohne Überfahren. */
  lead?: boolean;
}

export function Cell({ children, right = false, numeric = false, lead = false }: CellProps) {
  return (
    <td
      className={[
        'text-body px-3 py-3',
        right ? 'text-right' : 'text-left',
        numeric ? 'font-mono tabular-nums' : '',
        lead ? 'font-medium text-ink' : `text-muted ${uebergang} group-hover:text-ink`,
      ].join(' ')}
    >
      {children}
    </td>
  );
}

/**
 * Die Kartenliste unter 1024 Pixeln. Dieselben Daten, andere Form — eine
 * Tabelle seitlich zu schieben ist keine Lösung, Spalten wegzulassen auch nicht.
 *
 * Bis zum 12.09.2026 lag die Grenze bei 640 Pixeln. Seit keine Schrift mehr
 * unter 16 px geht, will die schmalste Tabelle (Verträge) 725 Pixel: bei 768
 * stehen 718 zur Verfügung, bei 1024 sind es 742. Also Karten, solange die
 * Seitenleiste nicht steht — gequetschte Spalten brechen sonst mitten im Wort.
 */
export function CardList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col lg:hidden">{children}</ul>;
}

export function CardItem({ children }: { children: ReactNode }) {
  return <li className="border-t border-line-soft">{children}</li>;
}
