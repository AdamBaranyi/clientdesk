import { FolderKanban, LayoutGrid, Layers, Users } from 'lucide-react';
import { NavLink } from 'react-router';
import type { WorkspaceSummary } from '@clientdesk/contracts';
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
] as const;

interface SidebarProps {
  workspace: WorkspaceSummary;
  onNavigate?: () => void;
}

export function Sidebar({ workspace, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-[var(--sidebar-bg)] p-[13px]">
      <div className="flex items-center gap-2.5 px-2.5 pt-0.5 pb-4">
        <Layers size={17} strokeWidth={2.2} className="shrink-0 text-accent" aria-hidden="true" />
        <span className="text-sm font-bold tracking-[0.01em]">ClientDesk</span>
      </div>

      <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-2.5 py-2.5">
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-on-accent"
          aria-hidden="true"
        >
          {initials(workspace.name)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[12.5px] font-semibold">{workspace.name}</span>
          <span className="text-[10.5px] text-faint">{roleLabel(workspace.role)}</span>
        </span>
      </div>

      <nav aria-label="Hauptnavigation" className="mt-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={workspacePath(workspace.id, item.to)}
            onClick={onNavigate}
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
