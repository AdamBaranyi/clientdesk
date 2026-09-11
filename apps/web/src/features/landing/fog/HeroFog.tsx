import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause } from 'lucide-react';
import { useMessages } from '../../../i18n/messages.ts';
import { useTheme } from '../../../lib/theme-context.ts';
import { landingMessages } from '../messages.ts';
import { createFog, type Fog, type FogColors, type FogOptions } from './fog-renderer.ts';

/** Kobalt als Stimmung, nur hier — siehe den Kommentar zu --data-mark in tokens.css. */
const COLORS: Record<'light' | 'dark', FogColors> = {
  light: ['#f0efeb', '#dce2f2', '#98aef0', '#4a72e8'],
  dark: ['#141310', '#161c2e', '#22377a', '#3d63d8'],
};

const MOTION_KEY = 'tallyroom.motion';
const REDUCE = '(prefers-reduced-motion: reduce)';

function readPaused(): boolean {
  try {
    return window.localStorage.getItem(MOTION_KEY) === 'paused';
  } catch {
    return false;
  }
}

function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/**
 * Der Nebel hinter dem Hero. Wird nachgeladen: die Überschrift steht sofort,
 * der Nebel blendet danach auf. So bleibt der Moment, den Lighthouse als
 * grössten Inhalt misst, unberührt.
 *
 * Er bewegt sich länger als fünf Sekunden und braucht deshalb einen Knopf
 * zum Anhalten (WCAG 2.2.2). Die Wahl gilt für diesen Browser. Bei
 * reduzierter Bewegung steht er still, dann gibt es auch keinen Knopf.
 */
export function HeroFog() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const fog = useRef<Fog | null>(null);
  const { resolved } = useTheme();
  const m = useMessages(landingMessages);
  const reduce = useMedia(REDUCE);
  const [paused, setPaused] = useState(readPaused);
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(true);

  const options = useMemo<FogOptions>(
    () => ({ colors: COLORS[resolved], animate: !paused && !reduce }),
    [resolved, paused, reduce],
  );
  const initial = useRef(options);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return undefined;
    let instance: Fog | null = null;
    let frame = 0;

    /*
     * Erst wenn der Browser nichts mehr zu tun hat: das Übersetzen des
     * Shaders hält den Hauptthread kurz fest, auf einem langsamen Telefon
     * gemessen 140 ms. Mitten im Laden zählt das als Blockade, danach nicht.
     */
    const start = () => {
      instance = createFog(element, initial.current);
      if (!instance) {
        setSupported(false);
        return;
      }
      fog.current = instance;
      // Erst das erste Bild, dann aufblenden — sonst blendet ein leeres Feld auf.
      frame = requestAnimationFrame(() => setReady(true));
    };
    const idle = 'requestIdleCallback' in window;
    const handle = idle
      ? window.requestIdleCallback(start, { timeout: 2000 })
      : window.setTimeout(start, 300);

    return () => {
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      cancelAnimationFrame(frame);
      instance?.destroy();
      fog.current = null;
    };
  }, []);

  useEffect(() => {
    fog.current?.update(options);
  }, [options]);

  function togglePaused() {
    const next = !paused;
    setPaused(next);
    try {
      window.localStorage.setItem(MOTION_KEY, next ? 'paused' : 'running');
    } catch {
      // Ohne Speicher gilt die Wahl bis zum Neuladen.
    }
  }

  if (!supported) return null;

  return (
    <>
      <canvas
        ref={canvas}
        aria-hidden="true"
        data-fog=""
        className={[
          'absolute inset-0 -z-10 size-full',
          'ease-enter transition-opacity duration-[900ms] motion-reduce:transition-none',
          ready ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />
      {!reduce && (
        <button
          type="button"
          aria-pressed={paused}
          onClick={togglePaused}
          // Deckender Grund: auf 70 Prozent kam grauer Text über dem kräftigsten
          // Nebel rechnerisch nur auf 4.2:1.
          className={[
            'text-dense absolute right-[max(1rem,calc((100%-1180px)/2))] bottom-6 inline-flex min-h-11 items-center gap-2',
            'rounded-sm border px-3 font-medium sm:min-h-9',
            'ease-state transition-colors duration-[var(--dur-snap)]',
            paused
              ? 'border-ink bg-raised text-ink'
              : 'border-line bg-bg text-muted hover:text-ink',
          ].join(' ')}
        >
          <Pause size={13} strokeWidth={2} aria-hidden="true" />
          {m.motionToggle}
        </button>
      )}
    </>
  );
}
