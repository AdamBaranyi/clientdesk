import { LOCALES, type Locale } from '@tallyroom/contracts';
import { useLocale } from '../../i18n/locale-context.ts';

/**
 * Jede Sprache steht in sich selbst, nicht übersetzt: wer kein Deutsch liest,
 * findet „English" auch in der deutschen Oberfläche. Das lang-Attribut sagt
 * einem Screenreader, in welcher Sprache er das Wort vorlesen soll.
 */
const OPTIONS: Record<Locale, { short: string; name: string }> = {
  de: { short: 'DE', name: 'Deutsch' },
  en: { short: 'EN', name: 'English' },
};

const GROUP_LABEL: Record<Locale, string> = { de: 'Sprache', en: 'Language' };

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label={GROUP_LABEL[locale]}
      className="flex items-center gap-0.5 rounded-sm border border-line bg-surface p-[3px]"
    >
      {LOCALES.map((option) => {
        const active = locale === option;
        return (
          <button
            key={option}
            type="button"
            lang={option}
            onClick={() => setLocale(option)}
            aria-pressed={active}
            title={OPTIONS[option].name}
            className={[
              // Gleiche Masse wie der Themenschalter daneben.
              'font-condensed text-label flex h-11 w-9 items-center justify-center rounded-sm font-semibold tracking-[0.08em] transition-colors sm:h-8',
              active
                ? 'border border-line bg-raised text-ink'
                : 'border border-transparent text-muted hover:text-ink',
            ].join(' ')}
          >
            <span aria-hidden="true">{OPTIONS[option].short}</span>
            <span className="sr-only">{OPTIONS[option].name}</span>
          </button>
        );
      })}
    </div>
  );
}
