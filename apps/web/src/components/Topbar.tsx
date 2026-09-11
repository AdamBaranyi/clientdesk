import { LogOut, Menu, Search } from 'lucide-react';
import { useLocation } from 'react-router';
import type { SessionUser, WorkspaceSummary } from '@tallyroom/contracts';
import { ThemeToggle } from './base/ThemeToggle.tsx';

interface TopbarProps {
  user: SessionUser;
  workspace: WorkspaceSummary;
  onOpenNavigation: () => void;
  onOpenSearch: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Kunden',
  projects: 'Projekte',
  contracts: 'Verträge',
  requests: 'Anfragen',
  documents: 'Dokumente',
  settings: 'Einstellungen',
};

export function Topbar({
  user,
  workspace,
  onOpenNavigation,
  onOpenSearch,
  onLogout,
  loggingOut,
}: TopbarProps) {
  const location = useLocation();
  const section = location.pathname.split('/')[3] ?? 'dashboard';
  const label = SECTION_LABELS[section] ?? 'Übersicht';

  return (
    <header className="flex h-[var(--topbar-height)] shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenNavigation}
          className="flex size-11 shrink-0 items-center justify-center rounded-sm text-muted hover:text-ink lg:hidden"
        >
          <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
          <span className="sr-only">Navigation öffnen</span>
        </button>

        {/* Auf schmalen Geräten trägt die Kopfzeile nur den aktuellen Ort. */}
        <nav aria-label="Brotkrumen" className="text-dense flex min-w-0 items-center gap-2">
          <span className="hidden truncate text-muted sm:inline">{workspace.name}</span>
          <span className="hidden text-muted sm:inline" aria-hidden="true">
            /
          </span>
          <span className="font-condensed text-label truncate font-semibold tracking-[0.12em] uppercase">
            {label}
          </span>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/*
          Ohne sichtbaren Griff wäre die Palette ein Geheimnis für alle, die
          das Kürzel nicht kennen. Das Kürzel steht daneben statt in einer
          Hilfeseite — dort liest es niemand.
        */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="text-dense flex min-h-11 items-center gap-2 rounded-sm border border-line px-3 font-medium text-muted transition-colors hover:text-ink"
        >
          <Search size={15} strokeWidth={1.8} aria-hidden="true" />
          <span className="hidden sm:inline">Springen zu</span>
          <kbd className="text-micro hidden border border-line px-1 font-mono md:inline">⌘K</kbd>
          <span className="sr-only">Suche öffnen, Tastenkürzel Befehl K</span>
        </button>
        <ThemeToggle />
        <span className="text-dense hidden text-muted md:inline" title={user.email}>
          {user.displayName}
        </span>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="text-dense flex min-h-11 items-center gap-2 rounded-sm border border-line px-3 font-medium text-muted transition-colors hover:text-ink disabled:opacity-60"
        >
          <LogOut size={15} strokeWidth={1.8} aria-hidden="true" />
          <span className="hidden sm:inline">{loggingOut ? 'Abmelden …' : 'Abmelden'}</span>
          <span className="sr-only sm:hidden">Abmelden</span>
        </button>
      </div>
    </header>
  );
}
