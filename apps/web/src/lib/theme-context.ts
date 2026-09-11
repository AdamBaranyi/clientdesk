import { createContext, useContext } from 'react';
import type { ThemeChoice } from '@tallyroom/contracts';

export interface ThemeContextValue {
  /** Was der Nutzer gewählt hat: Gerät, Hell oder Dunkel. */
  choice: ThemeChoice;
  /** Was daraus tatsächlich angezeigt wird. */
  resolved: 'light' | 'dark';
  setChoice: (choice: ThemeChoice) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme muss innerhalb von ThemeProvider verwendet werden.');
  return context;
}
