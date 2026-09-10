import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/base/Button.tsx';
import { ThemeToggle } from '../../components/base/ThemeToggle.tsx';
import { Wordmark } from '../../components/base/Wordmark.tsx';
import { ApiRequestError } from '../../lib/api.ts';
import { useStartDemo } from '../demo/api.ts';
import { LandingFeatures } from './LandingFeatures.tsx';

/** Kenndaten der Demo. Nachprüfbar, nichts davon behauptet. */
const DEMO_FACTS = [
  { label: 'Laufzeit', value: '60 Minuten' },
  { label: 'Datenbestand', value: 'eigener je Besucher' },
  { label: 'Danach', value: 'gelöscht, samt Dateien' },
  { label: 'Firmen und Zahlen', value: 'erfunden' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const startDemo = useStartDemo();

  const message =
    startDemo.error instanceof ApiRequestError
      ? startDemo.error.message
      : startDemo.error
        ? 'Die Demo konnte nicht gestartet werden. Bitte später erneut versuchen.'
        : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-end justify-between gap-3 border-b border-line px-3 sm:px-6">
        <Wordmark name="ClientDesk" />
        <div className="flex items-center gap-2 pb-4">
          <ThemeToggle />
          {/* Auf 320 Pixeln passt neben Wortmarke und Themenschalter nichts
              mehr. Der Anmelden-Link steht ohnehin direkt darunter im Hero —
              hier wegzulassen kostet nichts, überlaufen zu lassen schon. */}
          <Link
            to="/login"
            className="text-dense hidden min-h-11 items-center rounded-sm border border-line px-3 font-medium text-muted hover:text-ink sm:inline-flex"
          >
            Anmelden
          </Link>
        </div>
      </header>

      <main id="inhalt" className="flex-1 px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-[1180px]">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-20">
            <div>
              {/* Links ausgerichtet, nicht mittig. Eine zentrierte Spalte ist
                  die Vorgabe jeder Startseitenvorlage — hier führt die Kante. */}
              <h1 className="text-page sm:text-figure lg:text-hero leading-tight font-semibold tracking-[-0.03em]">
                Kundenübersicht und Kundenportal für kleine Agenturen
              </h1>
              <p className="text-body mt-6 max-w-[58ch] text-muted">
                Projektstände, monatliche Servicevereinbarungen, Unterlagen und Kundenanfragen an
                einem Ort — und ein getrenntes Portal, in dem der Kunde genau das sieht, was
                freigegeben ist.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="primary"
                  disabled={startDemo.isPending}
                  onClick={() =>
                    startDemo.mutate(undefined, {
                      onSuccess: (session) =>
                        void navigate(`/app/${session.workspaceId}/dashboard`),
                    })
                  }
                >
                  {startDemo.isPending ? 'Demo wird vorbereitet …' : 'Demo starten'}
                </Button>
                <Link
                  to="/login"
                  className="text-body inline-flex min-h-11 items-center justify-center rounded-sm border border-line px-4 font-medium"
                >
                  Anmelden
                </Link>
              </div>

              {message && (
                <p
                  role="alert"
                  className="text-body mt-6 border border-danger px-4 py-3 text-danger"
                >
                  {message}
                </p>
              )}
            </div>

            {/* Statt eines Werbebildes: was die Demo tatsächlich tut. */}
            <dl className="flex flex-col self-start border-t border-line">
              {DEMO_FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-3"
                >
                  <dt className="font-condensed text-label font-semibold tracking-[0.12em] text-muted uppercase">
                    {fact.label}
                  </dt>
                  <dd className="text-dense text-right font-mono tabular-nums">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <LandingFeatures />
        </div>
      </main>

      <footer className="text-micro border-t border-line px-4 py-6 text-muted sm:px-6">
        Portfolio-Projekt von Ádám Baranyi. Keine echten Kundendaten.
      </footer>
    </div>
  );
}
