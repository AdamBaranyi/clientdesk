import { useMemo, useSyncExternalStore } from 'react';

export interface ChartColors {
  mark: string;
  grid: string;
  axis: string;
  cursor: string;
}

/**
 * Die Diagrammfarben aus den Tokens, nicht aus einer zweiten Liste.
 *
 * Recharts zeichnet SVG-Attribute und kann mit `var(--data-mark)` nichts
 * anfangen. Bisher standen die Werte deshalb ein zweites Mal als Literale in
 * der Diagrammdatei — und sie standen dort noch in Violett, lange nachdem die
 * Palette gewechselt hatte. Genau so entsteht eine Farbe, die niemand pflegt.
 *
 * Der Themenwechsel ist keine React-Zustandsänderung, sondern ein Attribut am
 * Wurzelelement und eine Media Query. Beides wird hier direkt beobachtet.
 * `useTheme` wäre der falsche Weg: dessen Wert steht schon im Render, das
 * Attribut aber erst danach — man läse eine Runde lang die alten Farben.
 *
 * Der Schnappschuss ist bewusst eine Zeichenkette. React vergleicht ihn dem
 * Wert nach; ein frisches Objekt bei jedem Aufruf ergäbe eine Endlosschleife.
 */
const TOKENS = ['--data-mark', '--line-soft', '--muted', '--line'] as const;

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  const query = window.matchMedia('(prefers-color-scheme: dark)');
  query.addEventListener('change', onChange);

  return () => {
    observer.disconnect();
    query.removeEventListener('change', onChange);
  };
}

function snapshot(): string {
  const styles = getComputedStyle(document.documentElement);
  return TOKENS.map((token) => styles.getPropertyValue(token).trim()).join('|');
}

export function useChartColors(): ChartColors {
  const raw = useSyncExternalStore(subscribe, snapshot);

  return useMemo(() => {
    const [mark = '', grid = '', axis = '', cursor = ''] = raw.split('|');
    // Achsenbeschriftung ist Text und braucht Lesekontrast; --faint erreicht
    // dunkel nur 3.7:1 und kommt dafür nicht in Frage.
    return { mark, grid, axis, cursor };
  }, [raw]);
}
