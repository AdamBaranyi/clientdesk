import type { ProjectStatus } from '@tallyroom/contracts';
import { domainMessages } from '../../i18n/domain-messages.ts';
import { useMessages } from '../../i18n/messages.ts';
import { shellMessages } from '../messages.ts';

/**
 * Status nie nur über die Farbe: jeder Zustand trägt Punkt und Wort.
 * Der Punkt hilft beim Scannen, das Wort trägt die Bedeutung.
 */
const PROJECT_STYLES: Record<ProjectStatus, { dot: string; text: string }> = {
  planned: { dot: 'bg-faint', text: 'text-muted' },
  active: { dot: 'bg-ink', text: 'text-ink' },
  paused: { dot: 'bg-[var(--warning-mark)]', text: 'text-warning' },
  completed: { dot: 'bg-positive', text: 'text-positive' },
  archived: { dot: 'bg-faint', text: 'text-muted' },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const entry = PROJECT_STYLES[status];
  const label = useMessages(domainMessages).projectStatus[status];
  return (
    <span className={['inline-flex items-center gap-2 text-xs font-medium', entry.text].join(' ')}>
      <span className={['size-1.5 shrink-0', entry.dot].join(' ')} aria-hidden="true" />
      {label}
    </span>
  );
}

export function ArchivedBadge() {
  const m = useMessages(shellMessages);

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
      <span className="size-1.5 shrink-0 bg-faint" aria-hidden="true" />
      {m.archived}
    </span>
  );
}
