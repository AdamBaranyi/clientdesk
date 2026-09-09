/** Schweizer Schreibweise: TT.MM.JJJJ aus einem JJJJ-MM-TT-Kalenderdatum. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}
