import { useLayoutEffect, useState, type RefObject } from 'react';
import {
  outOfView,
  placeCard,
  scrollToTop,
  spotlightBox,
  type Box,
  type CardPlacement,
} from './tour-position.ts';
import { findTarget } from './tour-steps.ts';

interface TourLayout {
  /** Rahmen um das Ziel; null heisst, der Schritt steht in der Mitte. */
  spotlight: Box | null;
  card: CardPlacement;
  /** Erst nach der ersten Messung sichtbar, sonst springt die Karte. */
  measured: boolean;
}

const UNMEASURED: TourLayout = {
  spotlight: null,
  card: { top: 0, left: 0, covers: false },
  measured: false,
};

/**
 * Misst Ziel und Karte und legt beide fest. Neu gemessen wird bei jeder
 * Änderung, die das Ziel verschieben kann: Fenstergrösse, Scrollen und
 * Inhalte, die nachladen. Das Kennzahlband etwa hängt sich erst ein, wenn
 * seine Abfrage geantwortet hat — beim ersten Schritt ist es oft noch nicht da.
 */
export function useTourLayout(
  targets: readonly string[],
  card: RefObject<HTMLElement | null>,
): TourLayout {
  const [layout, setLayout] = useState(UNMEASURED);

  useLayoutEffect(() => {
    let frame = 0;
    let scrolled = false;

    // Ein Ziel ausserhalb des Bildes rückt an den oberen Rand, mit Platz für den Rahmen.
    const initial = findTarget(targets)?.getBoundingClientRect();
    if (initial && outOfView(initial, { width: window.innerWidth, height: window.innerHeight })) {
      scrolled = true;
      window.scrollBy({ top: scrollToTop(initial), behavior: 'instant' });
    }

    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const viewport = {
          width: document.documentElement.clientWidth,
          height: window.innerHeight,
        };
        const rect = findTarget(targets)?.getBoundingClientRect();
        const spotlight = rect ? spotlightBox(rect, viewport) : null;
        const cardRect = card.current?.getBoundingClientRect();
        const size = { width: cardRect?.width ?? 0, height: cardRect?.height ?? 0 };
        const placement = placeCard(spotlight, size, viewport);

        /*
         * Bei 320 Pixeln passt die Karte oft weder unter noch über das Ziel
         * und verdeckt es — beim Rollenwechsel genau die Knöpfe, um die es
         * geht. Dann rückt das Ziel einmal an den oberen Rand; das Scrollen
         * löst die nächste Messung aus.
         */
        if (rect && placement.covers && !scrolled && card.current) {
          scrolled = true;
          window.scrollBy({ top: scrollToTop(rect), behavior: 'instant' });
        }
        setLayout({ spotlight, card: placement, measured: true });
      });
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      observer.disconnect();
    };
  }, [targets, card]);

  return layout;
}
