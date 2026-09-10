import {
  FileText,
  FolderKanban,
  LayoutGrid,
  MessageSquare,
  Paperclip,
  Settings,
  Users,
} from 'lucide-react';
import type { WorkspaceSummary } from '@clientdesk/contracts';
import { NavItem } from './base/NavItem.tsx';
import { Wordmark } from './base/Wordmark.tsx';
import { workspacePath } from '../lib/paths.ts';

/**
 * Es stehen nur Einträge in der Navigation, deren Seite es tatsächlich gibt.
 * Weitere kommen mit den nächsten Meilensteinen dazu — ein Menüpunkt ohne
 * Funktion wäre ein Versprechen, das die Anwendung nicht hält.
 */
const NAV_ITEMS = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: 'customers', label: 'Kunden', icon: Users },
  { to: 'projects', label: 'Projekte', icon: FolderKanban },
  { to: 'contracts', label: 'Verträge', icon: FileText },
  { to: 'requests', label: 'Anfragen', icon: MessageSquare },
  { to: 'documents', label: 'Dokumente', icon: Paperclip },
  { to: 'settings', label: 'Einstellungen', icon: Settings },
] as const;

interface SidebarProps {
  workspace: WorkspaceSummary;
  onNavigate?: () => void;
}

export function Sidebar({ workspace, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-[var(--sidebar-bg)] p-3">
      <Wordmark name="ClientDesk" />

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
            {roleLabel(workspace.role)}
          </span>
        </span>
      </div>

      <nav aria-label="Hauptnavigation" className="mt-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.to}
            to={workspacePath(workspace.id, item.to)}
            label={item.label}
            icon={item.icon}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
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

function roleLabel(role: WorkspaceSummary['role']): string {
  if (role === 'owner') return 'Owner';
  if (role === 'member') return 'Mitglied';
  return 'Kundenzugang';
}
