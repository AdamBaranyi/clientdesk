import { currentLocale, type Locale } from '@tallyroom/contracts';
/**
 * „Heute" ist das Kalenderdatum in der Zeitzone des Workspace, nicht die des
 * Servers. Ein Meilenstein gilt in Zürich als überfällig, sobald es dort der
 * nächste Tag ist — unabhängig davon, wo die API läuft.
 */
export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA liefert bereits JJJJ-MM-TT.
  return formatter.format(now);
}

/** Vergleicht zwei Kalenderdaten als Zeichenketten — bei JJJJ-MM-TT korrekt. */
export function isBefore(date: string, reference: string): boolean {
  return date < reference;
}

/** Monatskürzel für die Achse des Verlaufs, in der Sprache des Requests. */
const MONTH_LABELS: Record<Locale, readonly string[]> = {
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
  it: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

export interface MonthPoint {
  /** Datum, zu dem gerechnet wird. */
  date: string;
  label: string;
  isCurrentMonth: boolean;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Letzter Kalendertag des Monats, rein rechnerisch ohne Zeitzonenbezug. */
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Die Stichtage für den Verlauf: je Monat das Monatsende, für den laufenden
 * Monat das heutige Datum. Der laufende Monat ist noch nicht abgeschlossen und
 * wird deshalb als solcher gekennzeichnet — ihn wie einen vollen Monat
 * darzustellen wäre irreführend.
 */
export function monthEndPoints(today: string, count: number): MonthPoint[] {
  const [yearPart, monthPart] = today.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);

  const points: MonthPoint[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const absolute = year * 12 + (month - 1) - offset;
    const pointYear = Math.floor(absolute / 12);
    const pointMonth = (absolute % 12) + 1;
    const isCurrentMonth = offset === 0;

    points.push({
      date: isCurrentMonth
        ? today
        : `${pointYear}-${pad(pointMonth)}-${pad(lastDayOfMonth(pointYear, pointMonth))}`,
      label: MONTH_LABELS[currentLocale()][pointMonth - 1] ?? '?',
      isCurrentMonth,
    });
  }
  return points;
}
