import { Monitor, Moon, Sun } from 'lucide-react';
import { THEME_CHOICES, type ThemeChoice } from '@tallyroom/contracts';
import { useTheme } from '../../lib/theme-context.ts';
import { useMessages } from '../../i18n/messages.ts';
import { shellMessages } from '../messages.ts';

const ICONS: Record<ThemeChoice, typeof Monitor> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

/**
 * Drei Zustände statt eines Umschalters: „Gerät" folgt der Systemeinstellung,
 * „Hell" und „Dunkel" überschreiben sie. Der aktive Zustand ist nicht nur über
 * die Farbe erkennbar, sondern über aria-pressed und den Titeltext.
 */
export function ThemeToggle() {
  const { choice, setChoice } = useTheme();
  const m = useMessages(shellMessages);

  return (
    <div
      role="group"
      aria-label={m.appearance}
      className="flex items-center gap-0.5 rounded-sm border border-line bg-surface p-[3px]"
    >
      {THEME_CHOICES.map((option) => {
        const Icon = ICONS[option];
        const active = choice === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setChoice(option)}
            aria-pressed={active}
            title={m.theme[option]}
            className={[
              // 44 Pixel hoch auf Touch-Breiten, ab sm die kompakte Variante
              // aus dem Entwurf. Die Breite bleibt bei 36 Pixeln, damit die
              // Kopfzeile bei 320 Pixeln nicht überläuft.
              'flex h-11 w-9 items-center justify-center rounded-sm transition-colors sm:h-8',
              active
                ? 'border border-line bg-raised text-ink'
                : 'border border-transparent text-muted hover:text-ink',
            ].join(' ')}
          >
            <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
            <span className="sr-only">{m.theme[option]}</span>
          </button>
        );
      })}
    </div>
  );
}
