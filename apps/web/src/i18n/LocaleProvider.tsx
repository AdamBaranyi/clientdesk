import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setLocaleResolver, type Locale } from '@tallyroom/contracts';
import { initialLocale, languageTag, storeLocale } from './detect.ts';
import { LocaleContext, type LocaleContextValue } from './locale-context.ts';

/*
 * Die Sprache gilt ausserhalb von React an zwei Stellen: in den gemeinsamen
 * Zod-Schemas, deren Meldungen erst beim Prüfen aufgelöst werden, und im
 * API-Client, der sie als Accept-Language mitschickt. Beide fragen über
 * currentLocale() aus @tallyroom/contracts nach, und das liest diesen Wert.
 */
let activeLocale: Locale = initialLocale();
setLocaleResolver(() => activeLocale);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(activeLocale);
  const queryClient = useQueryClient();

  useEffect(() => {
    document.documentElement.lang = languageTag(locale);
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === activeLocale) return;
      activeLocale = next;
      storeLocale(next);
      setLocaleState(next);
      // Was der Server schon geschickt hat, etwa Monatsnamen, kam in der alten
      // Sprache. Neu holen statt stehen lassen.
      void queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
