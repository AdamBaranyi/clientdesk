/**
 * Das gemeinsame Aussehen aller Bedienelemente.
 *
 * Es steht in einer eigenen Datei, weil Formularfelder, Suchfelder und
 * Auswahlfelder in verschiedenen Komponenten liegen und sonst dreimal
 * dieselbe Klassenliste abgeschrieben würde — genau so waren die 8-Pixel-
 * Rundungen entstanden, die den Umbau überlebt hatten.
 *
 * Kein `outline-none`: der Fokusring in Kobalt ist die dritte erlaubte
 * Verwendung der Datenfarbe und die einzige Fokusanzeige der Anwendung. Ihn
 * abzuschalten und durch einen Rahmenwechsel zu ersetzen war der stillste
 * Barrierefreiheitsfehler im Projekt — Rahmen aus Tinte auf einer Fläche aus
 * Tinte sieht man nicht.
 */
export const CONTROL_BASE =
  'w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-body text-ink';

/** Beschriftung über einem Bedienelement: klein, condensed, in Versalien. */
export const CONTROL_LABEL =
  'font-condensed text-label font-semibold tracking-[0.12em] text-muted uppercase';
