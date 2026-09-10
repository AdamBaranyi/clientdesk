import { useLayoutEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  /** Wird vorgelesen, wenn der Dialog aufgeht. */
  label: string;
  onClose: () => void;
  children: ReactNode;
  /** Ausrichtung des Fensters im Bild: mittig oder oben. */
  align?: 'center' | 'top';
}

/**
 * Ein wirklich modaler Dialog — der des Browsers, nicht ein nachgebauter.
 *
 * `showModal()` liefert vier Dinge, die man sonst von Hand schreibt und dabei
 * halb vergisst:
 *
 *   1. eine Fokusfalle, die Tab und Shift+Tab wirklich einfängt
 *   2. einen inerten Hintergrund — die Seite dahinter ist nicht nur optisch
 *      abgedeckt, sondern für Maus, Tastatur und Screenreader unerreichbar
 *   3. Escape ohne eigenen Griff am Fenster
 *   4. den Fokus zurück an das Element, von dem aus geöffnet wurde
 *
 * Die vorherige Fassung hatte Punkt 3 und schob den Fokus beim Öffnen hinein.
 * Punkt 1, 2 und 4 fehlten: mit Tab lief man aus dem Dialog in die Seite
 * dahinter, und beim Schliessen landete der Fokus am Seitenanfang.
 *
 * Ein Klick auf den abgedunkelten Rand trifft das dialog-Element selbst — das
 * Fenster darin ist ein Kind. Daran unterscheidet sich „daneben geklickt" von
 * „hineingeklickt".
 */
export function Modal({ label, onClose, children, align = 'center' }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  /*
   * `useLayoutEffect` und nicht `useEffect`: beim Abräumen läuft die
   * Aufräumfunktion eines Layout-Effekts, solange das Element noch im
   * Dokument hängt. Ein normaler Effekt räumt später auf — dann schliesst man
   * ein bereits abgehängtes dialog-Element, und der Browser gibt den Fokus
   * nicht mehr an den Auslöser zurück. Der Dialog sah richtig aus und liess
   * den Nutzer trotzdem am Seitenanfang stehen.
   */
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return undefined;
    element.showModal();
    return () => element.close();
  }, []);

  /*
   * jsx-a11y verlangt zu jedem Klick eine Tastaturentsprechung. Die gibt es
   * hier: Escape schliesst, und zwar vom Browser aus, ohne eigenen Griff. Die
   * Regel kann das nicht sehen, weil sie nur auf das Element schaut. Ein
   * Tastaturgriff auf dem abgedunkelten Rand wäre nicht bloss überflüssig,
   * sondern falsch — der Rand darf keinen Fokus bekommen.
   */
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialog}
      aria-label={label}
      onCancel={(event) => {
        // Ohne das schliesst der Browser selbst und React erfährt nichts davon.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
      className={[
        'm-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0',
        'flex justify-center backdrop:bg-black/50',
        align === 'top' ? 'items-start px-4 pt-[10vh]' : 'items-end sm:items-center',
      ].join(' ')}
    >
      {children}
    </dialog>
  );
}
