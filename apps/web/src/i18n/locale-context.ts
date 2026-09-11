import { createContext, useContext } from 'react';
import type { Locale } from '@tallyroom/contracts';

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale muss innerhalb von LocaleProvider verwendet werden.');
  return context;
}
