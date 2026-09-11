import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router';
import type { SessionUser, WorkspaceSummary } from '@tallyroom/contracts';
import { useLogout } from '../features/auth/use-session.ts';
import { DemoBanner } from '../features/demo/DemoBanner.tsx';
import { CommandPalette } from '../features/search/CommandPalette.tsx';
import { useCommandPalette } from '../features/search/use-command-palette.ts';
import { Sidebar } from './Sidebar.tsx';
import { Topbar } from './Topbar.tsx';
import { useMessages } from '../i18n/messages.ts';
import { shellMessages } from './messages.ts';

interface AppShellProps {
  user: SessionUser;
  workspace: WorkspaceSummary;
}

/**
 * Ab 1024 Pixeln steht die Seitenleiste fest, darunter wird sie zu einem
 * Panel über dem Inhalt. Bei 320 Pixeln bleibt damit die volle Breite für
 * Inhalte, ohne dass Navigation verloren geht.
 */
export function AppShell({ user, workspace }: AppShellProps) {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const palette = useCommandPalette();
  const navigate = useNavigate();
  const logout = useLogout();
  const m = useMessages(shellMessages);

  // Escape schliesst das Panel, damit es per Tastatur wieder verlassen werden kann.
  useEffect(() => {
    if (!navigationOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavigationOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigationOpen]);

  return (
    <div className="flex min-h-dvh">
      <a href="#inhalt" className="skip-link">
        {m.skipToContent}
      </a>

      {palette.open && <CommandPalette workspaceId={workspace.id} onClose={palette.close} />}

      <aside className="hidden w-[var(--sidebar-width)] shrink-0 border-r border-line lg:block">
        <Sidebar workspace={workspace} />
      </aside>

      {navigationOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={m.closeNavigation}
            onClick={() => setNavigationOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(272px,85vw)] flex-col border-r border-line">
            <button
              type="button"
              onClick={() => setNavigationOpen(false)}
              className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-sm text-muted hover:text-ink"
            >
              <X size={18} strokeWidth={1.8} aria-hidden="true" />
              <span className="sr-only">{m.closeNavigation}</span>
            </button>
            <Sidebar workspace={workspace} onNavigate={() => setNavigationOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          workspace={workspace}
          onOpenNavigation={() => setNavigationOpen(true)}
          onOpenSearch={() => palette.setOpen(true)}
          loggingOut={logout.isPending}
          onLogout={() => logout.mutate(undefined, { onSuccess: () => void navigate('/login') })}
        />
        <DemoBanner workspace={workspace} />
        <main id="inhalt" className="flex-1 px-3 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
