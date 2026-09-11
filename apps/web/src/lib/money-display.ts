import { formatAmountMinor } from '@tallyroom/contracts';

export interface DisplayAmount {
  /** Ganze Franken in Schweizer Schreibweise, zum Beispiel `2'970`. */
  francs: string;
  /** Rappen ohne Punkt, oder null wenn der Betrag glatt ist. */
  cents: string | null;
}

/**
 * Zerlegt einen Betrag für die Anzeige in einer grossen Zahl.
 *
 * `formatAmountMinor` schreibt die Rappen immer aus, und das ist in Formularen
 * und Tabellen richtig — dort muss ein Betrag eindeutig bleiben. Auf einer
 * Kennzahl in 72 Pixeln kosten zwei Nullen nach dem Punkt aber ein Drittel der
 * Zeilenbreite und tragen nichts. Glatte Beträge zeigen deshalb keine Rappen,
 * krumme zeigen sie kleiner.
 *
 * Die Rappen verschwinden nur, wenn sie tatsächlich null sind. Ein Betrag wird
 * hier nicht gerundet — aus 2'970.40 würde sonst eine Zahl, die es nicht gibt.
 */
export function splitAmountForDisplay(minor: number): DisplayAmount {
  const formatted = formatAmountMinor(minor);
  const cut = formatted.lastIndexOf('.');
  const francs = formatted.slice(0, cut);
  const cents = formatted.slice(cut + 1);
  return { francs, cents: cents === '00' ? null : cents };
}
