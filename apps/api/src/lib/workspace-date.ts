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
