import type { Locale } from '@tallyroom/contracts';
import { useLocale } from './locale-context.ts';

/**
 * Die Form eines Textkatalogs, abgeleitet aus der deutschen Fassung: gleiche
 * Schlüssel, Texte als string, Texte mit Platzhaltern als Funktion mit
 * denselben Parametern.
 */
export type MessageShape<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : T[K] extends string
      ? string
      : MessageShape<T[K]>;
};

/**
 * Ein Textkatalog je Bereich, alle Sprachen nebeneinander in einer Datei.
 * Deutsch gibt die Form vor. Fehlt in einer anderen Sprache ein Schlüssel,
 * ist einer zu viel oder hat eine Funktion andere Parameter, bricht der
 * Typecheck — nicht erst die Anzeige.
 */
export function defineMessages<T extends object>(
  messages: { de: T } & Record<Exclude<Locale, 'de'>, MessageShape<T>>,
): Record<Locale, MessageShape<T>> {
  return messages as Record<Locale, MessageShape<T>>;
}

/** Der Katalog in der gerade gewählten Sprache. */
export function useMessages<T>(catalog: Record<Locale, T>): T {
  return catalog[useLocale().locale];
}
