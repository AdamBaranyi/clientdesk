import { z } from 'zod';

/**
 * Sprachen von Oberfläche und API-Meldungen. Kommt eine dazu, meldet der
 * Compiler jede Stelle, an der ihr Text fehlt — `Localized` verlangt alle.
 */
export const LOCALES = ['de', 'fr', 'it', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'de';

/** Ein Text in jeder unterstützten Sprache. */
export type Localized = Record<Locale, string>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Wählt aus einer Liste von Sprachwünschen die erste unterstützte. Nimmt
 * `navigator.languages` ebenso wie die Einträge eines Accept-Language-Headers,
 * also `de-CH`, `fr;q=0.8` oder `it`. Ohne passenden Wunsch gilt Deutsch.
 */
export function negotiateLocale(preferences: readonly string[]): Locale {
  for (const preference of preferences) {
    const base = preference.split(';')[0]?.trim().toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

let resolveLocale: () => Locale = () => DEFAULT_LOCALE;

/**
 * Wer die gerade gültige Sprache kennt, trägt sich hier ein: die Oberfläche
 * mit der gewählten Sprache, die API mit der Sprache des laufenden Requests.
 */
export function setLocaleResolver(resolver: () => Locale): void {
  resolveLocale = resolver;
}

export function currentLocale(): Locale {
  return resolveLocale();
}

/** Der Text in der gerade gültigen Sprache. */
export function inCurrentLocale(text: Localized): string {
  return text[resolveLocale()];
}

/**
 * Für Werte, die keine Sprache haben, etwa eine Anzahl in einem Fehlerfeld.
 */
export function sameInAllLocales(text: string): Localized {
  return Object.fromEntries(LOCALES.map((locale) => [locale, text])) as Localized;
}

/**
 * Eine Zod-Meldung, die erst beim Prüfen aufgelöst wird. So passt sie zur
 * Sprache der Oberfläche beziehungsweise des Requests, obwohl das Schema nur
 * einmal entsteht.
 */
export function localized(text: Localized): { error: () => string } {
  return { error: () => text[resolveLocale()] };
}

/*
 * Zods eigene Meldungen, wo ein Schema keine setzt. Ohne diese Zeilen waren
 * sie englisch, auch in der deutschen Oberfläche. Das deutsche Paket schreibt
 * ß; hier gilt Schweizer Schreibweise.
 */
const zodLocales = {
  de: z.locales.de(),
  fr: z.locales.fr(),
  it: z.locales.it(),
  en: z.locales.en(),
} satisfies Record<Locale, { localeError: unknown }>;

z.config({
  localeError: (issue) => {
    const locale = resolveLocale();
    const message = zodLocales[locale].localeError(issue);
    return locale === 'de' && typeof message === 'string' ? message.replaceAll('ß', 'ss') : message;
  },
});
