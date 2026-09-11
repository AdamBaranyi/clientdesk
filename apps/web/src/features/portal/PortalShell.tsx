import { useEffect, useState } from 'react';
import {
  FileText,
  FolderKanban,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Paperclip,
  X,
} from 'lucide-react';
import { Outlet, useNavigate } from 'react-router';
import type { SessionUser, WorkspaceSummary } from '@tallyroom/contracts';
import { LanguageToggle } from '../../components/base/LanguageToggle.tsx';
import { ThemeToggle } from '../../components/base/ThemeToggle.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { portalPath } from '../../lib/portal-paths.ts';
import { useLogout } from '../auth/use-session.ts';
import { DemoBanner } from '../demo/DemoBanner.tsx';
import { LegalLinks } from '../legal/LegalLinks.tsx';
import { NavItem } from '../../components/base/NavItem.tsx';
import { Wordmark } from '../../components/base/Wordmark.tsx';
import { portalMessages } from './messages.ts';

/**
 * Reduzierte Navigation. Es gibt hier bewusst keinen Workspace-Umschalter:
 * ein Kundenzugang gehört zu genau einem Mandanten, und ein Umschalter würde
 * suggerieren, dass es mehr zu sehen gäbe.
 */
const NAV_ITEMS = [
  { to: 'overview', icon: LayoutGrid },
  { to: 'projects', icon: FolderKanban },
  { to: 'contracts', icon: FileText },
  { to: 'requests', icon: MessageSquare },
  { to: 'documents', icon: Paperclip },
] as const;

interface Props {
  user: SessionUser;
  workspace: WorkspaceSummary;
}

export function PortalShell({ user, workspace }: Props) {
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const logout = useLogout();
  const m = useMessages(portalMessages);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);

  const navigation = (
    <nav aria-label={m.shell.navLabel} className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => (
        <NavItem
          key={item.to}
          to={portalPath(workspace.id, item.to)}
          label={m.nav[item.to]}
          icon={item.icon}
          onNavigate={() => setNavOpen(false)}
        />
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-dvh">
      <a href="#portal-inhalt" className="skip-link">
        {m.shell.skipToContent}
      </a>

      <aside className="hidden w-[var(--sidebar-width)] shrink-0 border-r border-line bg-[var(--sidebar-bg)] p-3 lg:flex lg:flex-col">
        <Wordmark name={m.shell.wordmark} />
        <div className="mb-4 border border-line bg-surface px-2.5 py-2.5">
          <p className="text-dense truncate font-medium">{workspace.name}</p>
          <p className="font-condensed text-micro tracking-[0.14em] text-muted uppercase">
            {m.shell.yourAccess}
          </p>
        </div>
        {navigation}
        <div className="mt-auto flex flex-col items-start gap-1 px-2.5 pt-4">
          <LanguageToggle />
          <LegalLinks />
        </div>
      </aside>

      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={m.shell.closeNavigation}
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(272px,85vw)] flex-col border-r border-line bg-[var(--sidebar-bg)] p-3">
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-sm text-muted hover:text-ink"
            >
              <X size={18} strokeWidth={1.8} aria-hidden="true" />
              <span className="sr-only">{m.shell.close}</span>
            </button>
            <Wordmark name={m.shell.wordmark} />
            {navigation}
            <div className="mt-auto flex flex-col items-start gap-1 px-2.5 pt-4">
              <LanguageToggle />
              <LegalLinks />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[var(--topbar-height)] shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="flex size-11 shrink-0 items-center justify-center rounded-sm text-muted hover:text-ink lg:hidden"
            >
              <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
              <span className="sr-only">{m.shell.openNavigation}</span>
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
              className="flex min-h-11 items-center gap-2 rounded-sm border border-line px-3 text-[13px] font-medium text-muted hover:text-ink disabled:opacity-60"
            >
              <LogOut size={15} strokeWidth={1.8} aria-hidden="true" />
              <span className="hidden sm:inline">{m.shell.signOut}</span>
              <span className="sr-only sm:hidden">{m.shell.signOut}</span>
            </button>
          </div>
        </header>

        <DemoBanner workspace={workspace} />
        <main id="portal-inhalt" className="flex-1 px-3 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
