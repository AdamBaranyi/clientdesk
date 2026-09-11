import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { THEME_CHOICES, type ThemeChoice } from '@tallyroom/contracts';
import { ThemeContext, type ThemeContextValue } from './theme-context.ts';

const STORAGE_KEY = 'tallyroom.theme';

function isThemeChoice(value: unknown): value is ThemeChoice {
  return typeof value === 'string' && (THEME_CHOICES as readonly string[]).includes(value);
}

/** Ein nicht lesbarer Speicher (privates Fenster) darf die App nicht stoppen. */
function readStoredChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isThemeChoice(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(readStoredChoice);
  const [systemDark, setSystemDark] = useState<boolean>(prefersDark);

  // Wechselt der Nutzer die Systemeinstellung, kippt die App ohne Neuladen mit.
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const resolved = choice === 'system' ? (systemDark ? 'dark' : 'light') : choice;

  useEffect(() => {
    const root = document.documentElement;
    // Bei „Gerät" bleibt das Attribut weg, damit die Media Query greift.
    if (choice === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', choice);
  }, [choice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Kein Speicher verfügbar: die Wahl gilt für diese Sitzung.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ choice, resolved, setChoice }),
    [choice, resolved, setChoice],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
