import { createContext, useCallback, useContext, useState } from 'react';
import { TOUR_STEPS } from './tour-steps.ts';

export const TOUR_STORAGE_KEY = 'tallyroom.tour';

/**
 * Einmal von selbst, danach nur auf Wunsch. Gemerkt wird das im Browser,
 * nicht je Demo: wer wiederkommt und eine neue Demo startet, kennt den Weg
 * schon und findet den Knopf im Banner.
 *
 * Ein nicht lesbarer Speicher (privates Fenster) darf die App nicht stoppen.
 */
function wasCompleted(): boolean {
  try {
    return window.localStorage.getItem(TOUR_STORAGE_KEY) === 'done';
  } catch {
    return false;
  }
}

function markCompleted(): void {
  try {
    window.localStorage.setItem(TOUR_STORAGE_KEY, 'done');
  } catch {
    // Kein Speicher: der Rundgang käme beim nächsten Laden wieder, mehr nicht.
  }
}

export interface TourState {
  open: boolean;
  step: number;
  next: () => void;
  back: () => void;
  close: () => void;
  restart: () => void;
}

export function useTourState(enabled: boolean): TourState {
  const [open, setOpen] = useState(() => enabled && !wasCompleted());
  const [step, setStep] = useState(0);

  const close = useCallback(() => {
    markCompleted();
    setOpen(false);
    setStep(0);
  }, []);

  const next = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) setStep(step + 1);
    else close();
  }, [step, close]);

  const back = useCallback(() => setStep((current) => Math.max(0, current - 1)), []);

  const restart = useCallback(() => {
    setStep(0);
    setOpen(true);
  }, []);

  return { open, step, next, back, close, restart };
}

/** Für den Knopf im Demo-Banner. Im Kundenportal gibt es keinen Rundgang, dort bleibt er leer. */
export const TourContext = createContext<(() => void) | null>(null);

export function useTourRestart(): (() => void) | null {
  return useContext(TourContext);
}
