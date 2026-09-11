import { ChevronDown } from 'lucide-react';
import { isLocale, LOCALES, type Locale } from '@tallyroom/contracts';
import { useLocale } from '../../i18n/locale-context.ts';

/**
 * Jede Sprache steht in sich selbst, nicht übersetzt: wer kein Deutsch liest,
 * findet „Français" auch in der deutschen Oberfläche. Das lang-Attribut sagt
 * einem Screenreader, in welcher Sprache er den Namen vorlesen soll.
 */
const NAMES: Record<Locale, string> = {
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  en: 'English',
};

const LABEL: Record<Locale, string> = {
  de: 'Sprache',
  fr: 'Langue',
  it: 'Lingua',
  en: 'Language',
};

/**
 * Vier Knöpfe passen bei 320 Pixeln nicht neben Wortmarke und Themenschalter.
 * Deshalb eine echte Auswahlliste des Browsers — mit Tastatur, Screenreader und
 * dem Auswahlrad auf dem Telefon, ohne eigenen Nachbau. Sichtbar ist nur das
 * Kürzel; die Liste selbst zeigt die vollen Namen. Die Liste liegt unsichtbar
 * über dem Kürzel, deshalb zeichnet die Hülle den Fokusring.
 */
export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="relative inline-flex h-11 items-center gap-1 rounded-sm border border-line bg-surface px-2 text-muted hover:text-ink has-[:focus-visible]:[outline:2px_solid_var(--focus-ring)] has-[:focus-visible]:[outline-offset:2px] sm:h-8">
      <span
        aria-hidden="true"
        className="font-condensed text-body font-semibold tracking-[0.06em] text-ink"
      >
        {locale.toUpperCase()}
      </span>
      <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
      <select
        name="locale"
        aria-label={LABEL[locale]}
        value={locale}
        onChange={(event) => {
          if (isLocale(event.target.value)) setLocale(event.target.value);
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {LOCALES.map((option) => (
          <option key={option} value={option} lang={option}>
            {NAMES[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
