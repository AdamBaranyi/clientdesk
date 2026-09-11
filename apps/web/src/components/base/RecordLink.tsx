import type { MouseEvent, ReactNode } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { awaitRecordHeading, signalRecordHeading } from '../../lib/record-transition.ts';
import { LoadingState } from './EmptyState.tsx';

/**
 * Der Name eines Datensatzes wandert von der Tabellenzeile in die Überschrift
 * der Detailseite, statt dass eine Seite gegen die andere blendet.
 *
 * `<Link viewTransition>` und `useViewTransitionState` gibt es in React Router,
 * beide setzen aber einen Data-Router voraus. Diese Anwendung läuft auf
 * `BrowserRouter` mit verschachtelten `<Routes>`, und der Umbau auf
 * `createBrowserRouter` wäre ein Routing-Umbau für einen Übergang — der falsche
 * Handel. Der Browser kann es ohnehin selbst; React Router nimmt einem hier nur
 * die drei Zeilen ab, die unten stehen.
 *
 * Der Übergang wartet, bis die neue Überschrift steht — warum das nötig ist,
 * steht in lib/record-transition.ts.
 *
 * Ohne Unterstützung im Browser — Firefox kann dokumentinterne Übergänge noch
 * nicht — bleibt der Link ein gewöhnlicher Link. Kein Sonderpfad, kein Fehler.
 */
const RECORD_TITLE = 'record-title';

function nurEinfacherKlick(event: MouseEvent<HTMLAnchorElement>): boolean {
  // Mittelklick, Cmd- und Ctrl-Klick öffnen einen neuen Tab. Da gibt es nichts
  // zu überblenden, und ein preventDefault würde das Verhalten kaputt machen.
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function RecordLink({ to, title }: { to: string; title: string }) {
  const navigate = useNavigate();
  const anchor = useRef<HTMLAnchorElement>(null);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const start = document.startViewTransition?.bind(document);
    if (!start || !nurEinfacherKlick(event)) return;

    event.preventDefault();
    const element = anchor.current;
    if (element) element.style.viewTransitionName = RECORD_TITLE;

    const transition = start(() => {
      const ueberschriftSteht = awaitRecordHeading();
      navigate(to, { state: { recordTitle: title } });
      return ueberschriftSteht;
    });

    /*
     * Ein Übergang bricht im Alltag ab — ein zweiter Klick, ein Zurück, ein
     * Tabwechsel. Dann weist der Browser `ready` und `finished` zurück, und
     * ohne Behandlung landet das als unbehandelte Zurückweisung in der
     * Konsole. Gemessen: eine `InvalidStateError` je Navigation.
     *
     * Ein Abbruch ist hier kein Fehler, sondern der Normalfall. Er wird
     * geschluckt, aber der Name muss trotzdem vom Link verschwinden — sonst
     * bliebe er beim nächsten Übergang doppelt vergeben.
     */
    const abgebrochenIstInOrdnung = () => undefined;
    void transition.ready.catch(abgebrochenIstInOrdnung);
    void transition.finished.catch(abgebrochenIstInOrdnung).finally(() => {
      if (element) element.style.viewTransitionName = 'none';
    });
  }

  return (
    <Link ref={anchor} to={to} onClick={handleClick} className="text-ink">
      {title}
    </Link>
  );
}

export function RecordHeading({ children }: { children: ReactNode }) {
  // Vor dem Zeichnen, damit der Übergang den neuen Zustand auch sieht.
  useLayoutEffect(signalRecordHeading);

  return (
    <h1
      className="text-section font-semibold tracking-[-0.02em]"
      style={{ viewTransitionName: RECORD_TITLE }}
    >
      {children}
    </h1>
  );
}

/**
 * Der Ladezustand einer Detailseite. Trägt schon die Überschrift, damit der
 * wandernde Name irgendwo ankommt.
 */
export function PendingRecord({
  title,
  label,
}: {
  // Beim direkten Aufruf einer URL gibt es keinen Namen aus der Zeile.
  title: string | undefined;
  label: string;
}) {
  if (!title) return <LoadingState label={label} />;
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <RecordHeading>{title}</RecordHeading>
      <LoadingState label={label} />
    </div>
  );
}
