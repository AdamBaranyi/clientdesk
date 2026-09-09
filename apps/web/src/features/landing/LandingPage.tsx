import { ArrowRight, FlaskConical, Layers } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/base/Button.tsx';
import { ThemeToggle } from '../../components/base/ThemeToggle.tsx';
import { ApiRequestError } from '../../lib/api.ts';
import { useStartDemo } from '../demo/api.ts';

const FEATURES = [
  {
    title: 'Kunden, Projekte, Meilensteine',
    detail:
      'Wer wird betreut, was läuft, was ist überfällig. Fortschritt entsteht aus erledigten Meilensteinen und nicht aus einer Schätzung.',
  },
  {
    title: 'Verträge mit Preisversionen',
    detail:
      'Eine Preisänderung gilt ab ihrem Datum und lässt vergangene Monatswerte unberührt. Der monatliche Vertragswert ist zu jedem Stichtag nachvollziehbar.',
  },
  {
    title: 'Getrenntes Kundenportal',
    detail:
      'Der Kunde sieht freigegebene Projekte, Unterlagen und den öffentlichen Teil des Verlaufs. Interne Notizen und Kommentare erreichen ihn nicht.',
  },
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
      <header className="flex items-center justify-between px-3 py-3 sm:px-6">
        <span className="flex items-center gap-2.5">
          <Layers size={18} strokeWidth={2.2} className="text-accent" aria-hidden="true" />
          <span className="font-bold">ClientDesk</span>
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center rounded-lg border border-line px-3 text-sm font-medium text-muted no-underline hover:text-ink"
          >
            Anmelden
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-3 py-10 sm:px-6">
        <div className="w-full max-w-[720px]">
          <h1 className="text-3xl leading-tight font-semibold tracking-[-0.03em] sm:text-4xl">
            Kundenübersicht und Kundenportal für kleine Agenturen
          </h1>
          <p className="mt-4 max-w-[62ch] text-base text-muted">
            Projektstände, monatliche Servicevereinbarungen, Unterlagen und Kundenanfragen an einem
            Ort — und ein getrenntes Portal, in dem der Kunde genau das sieht, was freigegeben ist.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="primary"
              disabled={startDemo.isPending}
              onClick={() =>
                startDemo.mutate(undefined, {
                  onSuccess: (session) => void navigate(`/app/${session.workspaceId}/dashboard`),
                })
              }
            >
              <FlaskConical size={16} strokeWidth={2} aria-hidden="true" />
              {startDemo.isPending ? 'Demo wird vorbereitet …' : 'Demo starten'}
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-medium no-underline"
            >
              Anmelden
            </Link>
          </div>

          <p className="mt-3 max-w-[62ch] text-xs text-faint">
            Die Demo legt einen eigenen Datenbestand nur für Sie an, läuft nach 60 Minuten ab und
            wird danach samt Dateien gelöscht. Alle Firmen, Personen und Zahlen sind erfunden.
          </p>

          {message && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-line bg-raised px-4 py-3 text-sm text-danger"
            >
              {message}
            </p>
          )}

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold">{feature.title}</h2>
                <p className="text-sm text-muted">{feature.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="px-3 py-6 text-xs text-faint sm:px-6">
        Portfolio-Projekt von Ádám Baranyi. Keine echten Kundendaten.
      </footer>
    </div>
  );
}
