import { useEffect, useState } from 'react';
import {
  FileText,
  FolderKanban,
  LayoutGrid,
  Layers,
  LogOut,
  Menu,
  MessageSquare,
  Paperclip,
  X,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import type { SessionUser, WorkspaceSummary } from '@clientdesk/contracts';
import { ThemeToggle } from '../../components/base/ThemeToggle.tsx';
import { portalPath } from '../../lib/portal-paths.ts';
import { useLogout } from '../auth/use-session.ts';

/**
 * Reduzierte Navigation. Es gibt hier bewusst keinen Workspace-Umschalter:
 * ein Kundenzugang gehört zu genau einem Mandanten, und ein Umschalter würde
 * suggerieren, dass es mehr zu sehen gäbe.
 */
const NAV_ITEMS = [
  { to: 'overview', label: 'Übersicht', icon: LayoutGrid },
  { to: 'projects', label: 'Projekte', icon: FolderKanban },
  { to: 'contracts', label: 'Verträge', icon: FileText },
  { to: 'requests', label: 'Anfragen', icon: MessageSquare },
  { to: 'documents', label: 'Dokumente', icon: Paperclip },
] as const;

interface Props {
  user: SessionUser;
  workspace: WorkspaceSummary;
}

export function PortalShell({ user, workspace }: Props) {
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const logout = useLogout();

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);

  const navigation = (
    <nav aria-label="Portalnavigation" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={portalPath(workspace.id, item.to)}
          onClick={() => setNavOpen(false)}
          className={({ isActive }) =>
            [
              'flex min-h-11 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-raised text-ink shadow-[inset_2px_0_0_var(--accent)]'
                : 'text-muted hover:text-ink',
            ].join(' ')
          }
        >
          <item.icon size={17} strokeWidth={1.8} aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-dvh">
      <a href="#portal-inhalt" className="skip-link">
        Zum Inhalt springen
      </a>

      <aside className="hidden w-[var(--sidebar-width)] shrink-0 border-r border-line bg-[var(--sidebar-bg)] p-[13px] lg:block">
        <div className="flex items-center gap-2.5 px-2.5 pt-0.5 pb-4">
          <Layers size={17} strokeWidth={2.2} className="shrink-0 text-accent" aria-hidden="true" />
          <span className="text-sm font-bold">Kundenportal</span>
        </div>
        <div className="mb-4 rounded-lg border border-line bg-surface px-2.5 py-2.5">
          <p className="truncate text-[12.5px] font-semibold">{workspace.name}</p>
          <p className="text-[10.5px] text-faint">Ihr Zugang</p>
        </div>
        {navigation}
      </aside>

      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Navigation schliessen"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(272px,85vw)] flex-col border-r border-line bg-[var(--sidebar-bg)] p-[13px] shadow-[var(--shadow-raised)]">
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-md text-muted hover:text-ink"
            >
              <X size={18} strokeWidth={1.8} aria-hidden="true" />
              <span className="sr-only">Schliessen</span>
            </button>
            <div className="flex items-center gap-2.5 px-2.5 pt-0.5 pb-4">
              <Layers size={17} strokeWidth={2.2} className="text-accent" aria-hidden="true" />
              <span className="text-sm font-bold">Kundenportal</span>
            </div>
            {navigation}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[var(--topbar-height)] shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:text-ink lg:hidden"
            >
              <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
              <span className="sr-only">Navigation öffnen</span>
            </button>
            <span className="truncate text-[13px] text-muted">{workspace.name}</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <span className="hidden text-[13px] text-muted md:inline">{user.displayName}</span>
            <button
              type="button"
              onClick={() => logout.mutate(undefined, { onSuccess: () => void navigate('/login') })}
              disabled={logout.isPending}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-[13px] font-medium text-muted hover:text-ink disabled:opacity-60"
            >
              <LogOut size={15} strokeWidth={1.8} aria-hidden="true" />
              <span className="hidden sm:inline">Abmelden</span>
              <span className="sr-only sm:hidden">Abmelden</span>
            </button>
          </div>
        </header>

        <main id="portal-inhalt" className="flex-1 px-3 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
