import type { ContractRate } from '@tallyroom/contracts';
import { validationFailed } from '../../lib/http-error.ts';

/** Eine neue Preisversion muss innerhalb der Vertragslaufzeit beginnen. */
export function assertRateWithinContract(
  contract: { startDate: string; endDate: string | null },
  effectiveFrom: string,
): void {
  if (effectiveFrom < contract.startDate) {
    throw validationFailed(
      {
        de: 'Die Preisversion kann nicht vor dem Vertragsbeginn gelten.',
        fr: "La version de prix ne peut pas s'appliquer avant le début du contrat.",
        it: "La versione del prezzo non può valere prima dell'inizio del contratto.",
        en: 'A price version cannot apply before the contract starts.',
      },
      {
        effectiveFrom: [
          {
            de: 'Liegt vor dem Vertragsbeginn',
            fr: 'Tombe avant le début du contrat',
            it: "Cade prima dell'inizio del contratto",
            en: 'Is before the contract start',
          },
        ],
      },
    );
  }
  if (contract.endDate !== null && effectiveFrom >= contract.endDate) {
    throw validationFailed(
      {
        de: 'Die Preisversion läge nach dem Vertragsende.',
        fr: 'La version de prix commencerait après la fin du contrat.',
        it: 'La versione del prezzo inizierebbe dopo la fine del contratto.',
        en: 'This price version would start after the contract ends.',
      },
      {
        effectiveFrom: [
          {
            de: 'Liegt am oder nach dem Enddatum',
            fr: 'Tombe à la date de fin ou après',
            it: 'Cade alla data di fine o dopo',
            en: 'Is on or after the end date',
          },
        ],
      },
    );
  }
}

/** Je Datum gibt es höchstens eine Preisversion. */
export function assertRateDateFree(rates: readonly ContractRate[], effectiveFrom: string): void {
  if (rates.some((rate) => rate.effectiveFrom === effectiveFrom)) {
    throw validationFailed(
      {
        de: 'Für dieses Datum gibt es bereits eine Preisversion.',
        fr: 'Une version de prix existe déjà pour cette date.',
        it: 'Esiste già una versione del prezzo per questa data.',
        en: 'There is already a price version for this date.',
      },
      {
        effectiveFrom: [
          {
            de: 'Datum ist bereits belegt',
            fr: 'Date déjà utilisée',
            it: 'Data già utilizzata',
            en: 'Date is already taken',
          },
        ],
      },
    );
  }
}
