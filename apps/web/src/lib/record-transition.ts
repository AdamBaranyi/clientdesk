/**
 * Kleiner Taktgeber zwischen dem Link, der einen Seitenübergang startet, und
 * der Überschrift, die dabei entsteht.
 *
 * `document.startViewTransition` fotografiert den alten Zustand, ruft den
 * Rückruf auf und fotografiert dann den neuen. Naheliegend wäre, im Rückruf
 * `flushSync` um die Navigation zu legen — nur wickelt React Router jede
 * Navigation in `startTransition`, und eine Transition lässt sich nicht
 * synchron erzwingen. Gemessen: beim zweiten Schnappschuss stand noch die alte
 * Überschrift, der Name hatte also nichts, wohin er wandern konnte.
 *
 * Gibt der Rückruf ein Promise zurück, wartet der Browser damit. Genau das
 * passiert hier: die Überschrift meldet sich, sobald sie im Layout steht.
 *
 * Die Frist ist eine Notbremse, keine Zeitsteuerung. Läuft sie ab — Fehlerfall,
 * kein Name aus der Zeile, Detailseite ohne Überschrift — läuft der Übergang
 * als gewöhnliche Überblendung weiter, statt hängen zu bleiben.
 */
const FRIST_MS = 250;

let offen: { resolve: () => void; timer: number } | null = null;

export function awaitRecordHeading(): Promise<void> {
  abbrechen();
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      offen = null;
      resolve();
    }, FRIST_MS);
    offen = { resolve, timer };
  });
}

/** Wird von der Überschrift aufgerufen, sobald sie im Layout steht. */
export function signalRecordHeading(): void {
  if (!offen) return;
  const { resolve, timer } = offen;
  offen = null;
  window.clearTimeout(timer);
  resolve();
}

function abbrechen(): void {
  if (!offen) return;
  window.clearTimeout(offen.timer);
  offen.resolve();
  offen = null;
}
