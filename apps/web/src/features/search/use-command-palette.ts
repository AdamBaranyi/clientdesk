import { useCallback, useEffect, useState } from 'react';

/**
 * Öffnet die Palette auf Cmd+K beziehungsweise Strg+K.
 *
 * Der Griff liegt bewusst auf dem Fenster und nicht auf einem Element: die
 * Palette ist von überall erreichbar, auch wenn der Fokus gerade in einer
 * Tabelle steht. Steht er allerdings in einem Eingabefeld, greift der Griff
 * nicht — dort könnte Cmd+K etwas anderes bedeuten, und wer tippt, will
 * tippen.
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'k' || !(event.metaKey || event.ctrlKey)) return;

      const ziel = event.target;
      const tippt =
        ziel instanceof HTMLElement &&
        (ziel.tagName === 'INPUT' || ziel.tagName === 'TEXTAREA' || ziel.isContentEditable);
      if (tippt) return;

      event.preventDefault();
      setOpen((vorher) => !vorher);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return { open, setOpen, close };
}
