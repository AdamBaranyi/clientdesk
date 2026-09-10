import type { ProjectStatus } from '@clientdesk/contracts';

/**
 * Status nie nur über die Farbe: jeder Zustand trägt Punkt und Wort.
 * Der Punkt hilft beim Scannen, das Wort trägt die Bedeutung.
 */
const PROJECT_LABELS: Record<ProjectStatus, { label: string; dot: string; text: string }> = {
  planned: { label: 'Geplant', dot: 'bg-faint', text: 'text-muted' },
  active: { label: 'Aktiv', dot: 'bg-accent', text: 'text-accent' },
  paused: { label: 'Pausiert', dot: 'bg-[var(--warning-mark)]', text: 'text-warning' },
  completed: { label: 'Abgeschlossen', dot: 'bg-positive', text: 'text-positive' },
  archived: { label: 'Archiviert', dot: 'bg-faint', text: 'text-faint' },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const entry = PROJECT_LABELS[status];
  return (
    <span className={['inline-flex items-center gap-2 text-xs font-medium', entry.text].join(' ')}>
      <span className={['size-1.5 shrink-0', entry.dot].join(' ')} aria-hidden="true" />
      {entry.label}
    </span>
  );
}

export function ArchivedBadge() {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-faint">
      <span className="size-1.5 shrink-0 bg-faint" aria-hidden="true" />
      Archiviert
    </span>
  );
}
