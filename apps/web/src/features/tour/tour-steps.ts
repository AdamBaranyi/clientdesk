/**
 * Die Schritte des Rundgangs in ihrer Reihenfolge. Ein Schritt zeigt auf ein
 * Element mit `data-tour="…"`; ist keines davon sichtbar, steht die Karte in
 * der Mitte. Mehrere Ziele je Schritt, weil die Navigation unter 1024 Pixeln
 * hinter dem Menüknopf liegt — dann zeigt der Schritt auf den Knopf.
 */
export const TOUR_STEPS = [
  { id: 'welcome', targets: [] },
  { id: 'metrics', targets: ['metrics'] },
  { id: 'navigation', targets: ['navigation', 'navigation-toggle'] },
  { id: 'palette', targets: ['palette'] },
  { id: 'roles', targets: ['role-switch'] },
  { id: 'done', targets: ['tour-restart'] },
] as const;

export type TourStepId = (typeof TOUR_STEPS)[number]['id'];

/** Das erste sichtbare Ziel eines Schritts, oder null für die Mitte. */
export function findTarget(targets: readonly string[]): HTMLElement | null {
  for (const target of targets) {
    for (const element of document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return element;
    }
  }
  return null;
}
