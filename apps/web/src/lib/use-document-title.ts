import { useEffect } from 'react';

/**
 * Setzt den Fenstertitel, solange die Seite steht, und stellt beim Verlassen
 * den vorherigen wieder her. Ein `<title>` im Baum würde React zwar in den
 * Kopf heben, dort stünde aber schon der aus index.html — und der Browser
 * nimmt den ersten.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
