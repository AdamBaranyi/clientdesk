import {
  FileText,
  FolderKanban,
  LayoutGrid,
  MessageSquare,
  Paperclip,
  Settings,
  Users,
} from 'lucide-react';
import type { WorkspaceSummary } from '@tallyroom/contracts';
import { LanguageToggle } from './base/LanguageToggle.tsx';
import { NavItem } from './base/NavItem.tsx';
import { Wordmark } from './base/Wordmark.tsx';
import { LegalLinks } from '../features/legal/LegalLinks.tsx';
import { domainMessages } from '../i18n/domain-messages.ts';
import { useMessages } from '../i18n/messages.ts';
import { workspacePath } from '../lib/paths.ts';
import { shellMessages } from './messages.ts';

/**
 * Es stehen nur Einträge in der Navigation, deren Seite es tatsächlich gibt.
 * Weitere kommen mit den nächsten Meilensteinen dazu — ein Menüpunkt ohne
 * Funktion wäre ein Versprechen, das die Anwendung nicht hält.
 */
const NAV_ITEMS = [
  { to: 'dashboard', icon: LayoutGrid },
  { to: 'customers', icon: Users },
  { to: 'projects', icon: FolderKanban },
  { to: 'contracts', icon: FileText },
  { to: 'requests', icon: MessageSquare },
  { to: 'documents', icon: Paperclip },
  { to: 'settings', icon: Settings },
] as const;

interface SidebarProps {
  workspace: WorkspaceSummary;
  onNavigate?: () => void;
}

export function Sidebar({ workspace, onNavigate }: SidebarProps) {
  const m = useMessages(shellMessages);
  const roles = useMessages(domainMessages).role;

  return (
    <div className="flex h-full flex-col bg-[var(--sidebar-bg)] p-3">
      <Wordmark name="Tallyroom" />

      <div className="flex items-center gap-2.5 border border-line bg-surface px-2.5 py-2.5">
        <span
          className="text-micro flex size-6 shrink-0 items-center justify-center border border-line font-mono font-medium text-muted"
          aria-hidden="true"
        >
          {initials(workspace.name)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-dense truncate font-medium">{workspace.name}</span>
          <span className="font-condensed text-micro tracking-[0.14em] text-muted uppercase">
            {roles[workspace.role]}
          </span>
        </span>
      </div>

      <nav
        aria-label={m.mainNavigation}
        data-tour="navigation"
        className="mt-4 flex flex-col gap-0.5"
      >
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.to}
            to={workspacePath(workspace.id, item.to)}
            label={m.sections[item.to]}
            icon={item.icon}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col items-start gap-1 px-2.5 pt-4">
        <LanguageToggle />
        <LegalLinks />
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
