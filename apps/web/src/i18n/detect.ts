import { isLocale, negotiateLocale, type Locale } from '@tallyroom/contracts';

export const LOCALE_STORAGE_KEY = 'tallyroom.locale';

/**
 * Die Sprache beim Start: zuerst eine frühere Wahl, sonst die Wünsche des
 * Browsers. Wer Französisch oder Italienisch eingestellt hat, bekommt Englisch,
 * bis es diese Sprachen gibt — siehe negotiateLocale.
 */
export function initialLocale(): Locale {
  const stored = readStoredLocale();
  if (stored) return stored;
  return negotiateLocale(
    navigator.languages.length > 0 ? navigator.languages : [navigator.language],
  );
}

/** Ein nicht lesbarer Speicher (privates Fenster) darf die App nicht stoppen. */
function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Kein Speicher verfügbar: die Wahl gilt für diese Sitzung.
  }
}

/** Sprachkennung für Intl und das lang-Attribut. Formate bleiben schweizerisch. */
export function languageTag(locale: Locale): string {
  return locale === 'de' ? 'de-CH' : 'en-CH';
}
