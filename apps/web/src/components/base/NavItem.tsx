import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';

/**
 * Ein Eintrag in der Hauptnavigation.
 *
 * Der aktive Zustand ist eine der drei Stellen, an denen Kobalt erlaubt ist —
 * er sagt, wo man ist, und das ist eine Ortsangabe, keine Verzierung.
 *
 * Vorher trug er einen zwei Pixel breiten farbigen Streifen an der linken
 * Kante. Das ist der Reflex, den man in jedem generierten Dashboard findet, und
 * er wird durch einen Farbwechsel nicht besser. Jetzt tragen Fläche und Farbe
 * den Zustand gemeinsam: die Fläche hebt sich, Symbol und Wort gehen auf
 * Kobalt. Zwei Signale, keines davon ein Streifen.
 */
interface Props {
  to: string;
  label: string;
  icon: LucideIcon;
  onNavigate?: (() => void) | undefined;
}

export function NavItem({ to, label, icon: Icon, onNavigate }: Props) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'text-body flex min-h-11 items-center gap-2.5 px-2.5 font-medium',
          'rounded-sm transition-colors ease-state duration-[var(--dur-snap)]',
          isActive ? 'bg-raised text-data' : 'text-muted hover:text-ink',
        ].join(' ')
      }
    >
      <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
      {label}
    </NavLink>
  );
}
