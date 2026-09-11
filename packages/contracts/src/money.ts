import { z } from 'zod';
import { localized } from './i18n.ts';

/**
 * Geld wird durchgehend als Ganzzahl in Rappen geführt. Gleitkomma hat bei
 * Beträgen nichts zu suchen: 0.1 + 0.2 ist dort nicht 0.3, und über eine
 * Summe von Verträgen hinweg wird daraus ein sichtbarer Fehler.
 */
export const amountMinorSchema = z
  .number()
  .int(
    localized({
      de: 'Betrag muss in ganzen Rappen angegeben werden',
      fr: 'Le montant doit être indiqué en centimes entiers',
      it: "L'importo deve essere indicato in centesimi interi",
      en: 'Amount must be given in whole rappen',
    }),
  )
  .min(
    0,
    localized({
      de: 'Betrag darf nicht negativ sein',
      fr: 'Le montant ne peut pas être négatif',
      it: "L'importo non può essere negativo",
      en: 'Amount cannot be negative',
    }),
  )
  // Eine Milliarde Rappen sind zehn Millionen Franken — als Schutz vor Tippfehlern.
  .max(
    1_000_000_000,
    localized({
      de: 'Betrag ist unrealistisch hoch',
      fr: 'Le montant est trop élevé pour être réaliste',
      it: "L'importo è troppo alto per essere realistico",
      en: 'Amount is unrealistically high',
    }),
  );

/** Formatiert Rappen als Schweizer Betrag, zum Beispiel 485000 zu "4'850.00". */
export function formatAmountMinor(minor: number): string {
  const francs = Math.trunc(minor / 100);
  const rappen = Math.abs(minor % 100);
  const grouped = String(Math.abs(francs)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  const sign = minor < 0 ? '-' : '';
  return `${sign}${grouped}.${String(rappen).padStart(2, '0')}`;
}

/**
 * Liest eine Eingabe wie "4850", "4850.50" oder "4'850.50" als Rappen.
 * Gibt null zurück, wenn die Eingabe kein Betrag ist — der Aufrufer
 * entscheidet, ob das ein Validierungsfehler ist.
 */
export function parseAmountToMinor(input: string): number | null {
  const cleaned = input.trim().replace(/['\s]/g, '').replace(',', '.');
  if (cleaned === '' || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const [francs, rappen = ''] = cleaned.split('.');
  const paddedRappen = rappen.padEnd(2, '0');
  return Number.parseInt(francs ?? '0', 10) * 100 + Number.parseInt(paddedRappen, 10);
}
