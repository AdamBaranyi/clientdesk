import { useEffect, useLayoutEffect, useRef } from 'react';
import { Button } from '../../components/base/Button.tsx';
import { shellMessages } from '../../components/messages.ts';
import { useMessages } from '../../i18n/messages.ts';
import { tourMessages } from './messages.ts';
import { TOUR_STEPS } from './tour-steps.ts';
import { useTourLayout } from './use-tour-layout.ts';

/** Die Bereiche, die der Schritt «Navigation» einzeln erklärt. Das Dashboard hat seinen eigenen. */
const SECTION_KEYS = [
  'customers',
  'projects',
  'contracts',
  'requests',
  'documents',
  'settings',
] as const;

interface TourDialogProps {
  step: number;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

/**
 * Der Rundgang als echter modaler Dialog, wie `Modal`: Fokusfalle, inerter
 * Hintergrund und Escape kommen vom Browser. Anders als dort liegt die Karte
 * nicht in der Mitte, sondern neben dem Element, um das es geht, und statt
 * einer gleichmässigen Abdunkelung bleibt dieses Element ausgespart.
 *
 * Ein Klick daneben beendet den Rundgang nicht. Er wäre sonst mit einem
 * versehentlichen Tippen weg, und wer ihn beenden will, hat einen Knopf dafür.
 */
export function TourDialog({ step, onNext, onBack, onClose }: TourDialogProps) {
  const m = useMessages(tourMessages);
  const sections = useMessages(shellMessages).sections;
  const dialog = useRef<HTMLDialogElement>(null);
  const card = useRef<HTMLElement>(null);

  const current = TOUR_STEPS[step] ?? TOUR_STEPS[0];
  const text = m.steps[current.id];
  const last = step === TOUR_STEPS.length - 1;
  const layout = useTourLayout(current.targets, card);

  // Layout-Effekt aus demselben Grund wie in Modal: so kommt der Fokus beim Schliessen zurück.
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return undefined;
    element.showModal();
    return () => element.close();
  }, []);

  /*
   * Nach jedem Schritt steht der Fokus auf «Weiter»; mit Enter geht es durch
   * den ganzen Rundgang. Erst nach der ersten Messung: bis dahin ist die Karte
   * unsichtbar, und ein unsichtbarer Knopf nimmt keinen Fokus an.
   */
  const { measured } = layout;
  useEffect(() => {
    if (!measured) return;
    dialog.current?.querySelector<HTMLButtonElement>('[data-tour-primary]')?.focus();
  }, [step, measured]);

  return (
    <dialog
      ref={dialog}
      aria-label={m.dialogLabel}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 backdrop:bg-transparent"
    >
      {layout.spotlight ? (
        <div
          aria-hidden="true"
          data-tour-spotlight=""
          className="fixed rounded-sm shadow-[0_0_0_2px_var(--focus-ring),0_0_0_100vmax_rgb(0_0_0/0.55)] transition-[top,left,width,height] duration-[var(--dur-shift)] ease-state motion-reduce:transition-none"
          style={{
            top: layout.spotlight.top,
            left: layout.spotlight.left,
            width: layout.spotlight.width,
            height: layout.spotlight.height,
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-black/55" />
      )}

      <section
        ref={card}
        className={[
          'fixed flex max-h-[calc(100dvh-24px)] w-[min(400px,calc(100vw-24px))] flex-col gap-3',
          'overflow-y-auto border border-line bg-surface p-4 text-ink sm:p-5',
          layout.measured ? 'visible' : 'invisible',
        ].join(' ')}
        style={{ top: layout.card.top, left: layout.card.left }}
      >
        <p className="text-micro font-mono text-muted">{m.progress(step + 1, TOUR_STEPS.length)}</p>

        {/* Ein Schrittwechsel ändert nur den Inhalt; der Screenreader liest ihn so neu vor. */}
        <div aria-live="polite" className="flex flex-col gap-2">
          <h2 className="text-body font-semibold">{text.title}</h2>
          <p className="text-dense text-muted">{text.body}</p>
          {current.id === 'navigation' && (
            <dl className="text-dense flex flex-col gap-1.5">
              {SECTION_KEYS.map((key) => (
                <div key={key}>
                  <dt className="inline font-medium">{sections[key]}</dt>{' '}
                  <dd className="inline text-muted">{m.sections[key]}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Button variant="ghost" className="px-2" onClick={onClose}>
            {m.skip}
          </Button>
          <div className="flex gap-2">
            {step > 0 && <Button onClick={onBack}>{m.back}</Button>}
            <Button variant="primary" data-tour-primary="" onClick={onNext}>
              {last ? m.finish : m.next}
            </Button>
          </div>
        </div>
      </section>
    </dialog>
  );
}
