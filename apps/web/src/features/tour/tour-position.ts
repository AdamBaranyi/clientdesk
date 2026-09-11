export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Size {
  width: number;
  height: number;
}

/** Abstand zwischen Ziel und Karte und zum Bildrand. */
const GAP = 12;
const MARGIN = 12;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export interface CardPlacement {
  top: number;
  left: number;
  /** Die Karte verdeckt das Ziel, weil daneben kein Platz war. */
  covers: boolean;
}

/**
 * Wo die Karte steht: unter dem Ziel, sonst darüber, sonst rechts daneben.
 * Die Reihenfolge folgt dem Lesefluss — erst das Ziel, dann die Erklärung.
 * Rechts daneben braucht es nur für hohe, schmale Ziele wie die Navigation.
 *
 * Passt nichts davon, steht die Karte unten am Rand und verdeckt einen Teil
 * des Ziels. Das meldet `covers`; wer aufruft, kann das Ziel dann nach oben
 * scrollen und neu messen.
 */
export function placeCard(target: Box | null, card: Size, viewport: Size): CardPlacement {
  const maxLeft = viewport.width - card.width - MARGIN;
  const maxTop = viewport.height - card.height - MARGIN;

  if (!target) {
    return {
      top: clamp((viewport.height - card.height) / 2, MARGIN, maxTop),
      left: clamp((viewport.width - card.width) / 2, MARGIN, maxLeft),
      covers: false,
    };
  }

  const left = clamp(target.left, MARGIN, maxLeft);
  const below = target.top + target.height + GAP;
  if (below <= maxTop) return { top: below, left, covers: false };

  const above = target.top - GAP - card.height;
  if (above >= MARGIN) return { top: above, left, covers: false };

  const right = target.left + target.width + GAP;
  if (right <= maxLeft) {
    return { top: clamp(target.top, MARGIN, maxTop), left: right, covers: false };
  }

  return { top: Math.max(MARGIN, maxTop), left, covers: true };
}

/** Wie weit die Seite scrollen muss, damit das Ziel knapp unter dem oberen Rand steht. */
export function scrollToTop(target: Box): number {
  return target.top - MARGIN;
}

/** Ragt das Ziel über einen Bildrand hinaus, samt dem Abstand für den Rahmen? */
export function outOfView(target: Box, viewport: Size): boolean {
  return target.top < MARGIN || target.top + target.height > viewport.height - MARGIN;
}

/** Der Rahmen um das Ziel, auf den sichtbaren Teil des Bildes beschnitten. */
export function spotlightBox(target: Box, viewport: Size, padding = 6): Box {
  const top = Math.max(target.top - padding, 0);
  const left = Math.max(target.left - padding, 0);
  const bottom = Math.min(target.top + target.height + padding, viewport.height);
  const right = Math.min(target.left + target.width + padding, viewport.width);
  return { top, left, width: Math.max(right - left, 0), height: Math.max(bottom - top, 0) };
}
