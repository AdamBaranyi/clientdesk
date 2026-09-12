import { Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router';
import { DEMO_LIFETIME_MINUTES } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { LanguageToggle } from '../../components/base/LanguageToggle.tsx';
import { ThemeToggle } from '../../components/base/ThemeToggle.tsx';
import { Wordmark } from '../../components/base/Wordmark.tsx';
import { ApiRequestError } from '../../lib/api.ts';
import { useMessages } from '../../i18n/messages.ts';
import { SITE_URL } from '../../lib/site.ts';
import { useDocumentTitle } from '../../lib/use-document-title.ts';
import { useStartDemo } from '../demo/api.ts';
import { SiteFooter } from '../legal/SiteFooter.tsx';
import { LandingFeatures } from './LandingFeatures.tsx';
import { landingMessages } from './messages.ts';

/*
 * Der Nebel kommt nach: die Überschrift steht sofort, der Nebel blendet
 * danach auf. Er liegt in einem eigenen Bündel und zählt nicht zur Erstlast.
 */
const HeroFog = lazy(() =>
  import('./fog/HeroFog.tsx').then((modul) => ({ default: modul.HeroFog })),
);

export function LandingPage() {
  const navigate = useNavigate();
  const startDemo = useStartDemo();
  const m = useMessages(landingMessages);
  useDocumentTitle(m.documentTitle);

  /** Kenndaten der Demo. Nachprüfbar, nichts davon behauptet. */
  const demoFacts = [
    { label: m.facts.runtime.label, value: m.facts.runtime.value(DEMO_LIFETIME_MINUTES) },
    m.facts.data,
    m.facts.after,
    m.facts.fictional,
  ];

  const message =
    startDemo.error instanceof ApiRequestError
      ? startDemo.error.message
      : startDemo.error
        ? m.demoFailed
        : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <link rel="canonical" href={`${SITE_URL}/`} />
      <header className="flex items-end justify-between gap-2 border-b border-line px-3 sm:gap-3 sm:px-6">
        <Wordmark name="Tallyroom" />
        <div className="flex items-center gap-2 pb-4">
          <LanguageToggle />
          <ThemeToggle />
          {/* Auf 320 Pixeln passt neben Wortmarke, Sprach- und Themenschalter
              nichts mehr. Der Anmelden-Link steht ohnehin direkt darunter im
              Hero — hier wegzulassen kostet nichts, überlaufen zu lassen schon. */}
          <Link
            to="/login"
            className="text-body hidden min-h-11 items-center rounded-sm border border-line px-3 font-medium text-muted hover:text-ink sm:inline-flex"
          >
            {m.signIn}
          </Link>
        </div>
      </header>

      <main id="inhalt" className="flex-1">
        {/*
          Text links auf ruhigem Grund, rechts ist der Nebel selbst das Bild —
          ohne Text darauf. Nur so darf er seine volle Farbe zeigen, ohne dass
          grauer Fliesstext unleserlich wird.
        */}
        <section className="relative isolate overflow-hidden border-b border-line px-4 pt-12 pb-24 sm:px-6 sm:pt-16 sm:pb-24 lg:pb-20">
          <Suspense fallback={null}>
            <HeroFog />
          </Suspense>
          <div className="mx-auto w-full max-w-[1180px]">
            <div data-fog-calm="" className="lg:max-w-[40rem] xl:max-w-[44rem]">
              {/* Links ausgerichtet, nicht mittig. Eine zentrierte Spalte ist
                  die Vorgabe jeder Startseitenvorlage — hier führt die Kante. */}
              <h1 className="text-page sm:text-figure lg:text-hero leading-tight font-semibold tracking-[-0.03em]">
                {m.headline}
              </h1>
              <p className="text-body mt-6 max-w-[58ch] text-muted">{m.lead}</p>

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
                  {startDemo.isPending ? m.preparingDemo : m.startDemo}
                </Button>
                <Link
                  to="/login"
                  className="text-body inline-flex min-h-11 items-center justify-center rounded-sm border border-line bg-bg px-4 font-medium"
                >
                  {m.signIn}
                </Link>
              </div>

              {message && (
                <p
                  role="alert"
                  className="text-body mt-6 border border-danger bg-bg px-4 py-3 text-danger"
                >
                  {message}
                </p>
              )}

              {/* Statt eines Werbebildes: was die Demo tatsächlich tut. */}
              <dl className="mt-8 grid border-t border-line sm:grid-cols-2 sm:gap-x-8">
                {demoFacts.map((fact) => (
                  <div
                    key={fact.label}
                    className="flex items-baseline justify-between gap-4 border-b border-line py-3"
                  >
                    <dt className="font-condensed text-body font-semibold tracking-[0.06em] text-muted uppercase">
                      {fact.label}
                    </dt>
                    <dd className="text-body text-right font-mono tabular-nums">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <div className="px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="mx-auto w-full max-w-[1180px]">
            <LandingFeatures />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
