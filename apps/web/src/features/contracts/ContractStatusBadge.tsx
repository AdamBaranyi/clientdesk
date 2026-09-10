import type { ContractVisibleStatus } from '@clientdesk/contracts';

/**
 * Jeder Zustand trägt Punkt und Wort. Die Farbe allein dürfte den Unterschied
 * nicht tragen.
 */
const LABELS: Record<ContractVisibleStatus, { label: string; dot: string; text: string }> = {
  draft: { label: 'Entwurf', dot: 'bg-faint', text: 'text-muted' },
  planned: { label: 'Geplant', dot: 'bg-[var(--warning-mark)]', text: 'text-warning' },
  active: { label: 'Aktiv', dot: 'bg-positive', text: 'text-positive' },
  ended: { label: 'Beendet', dot: 'bg-faint', text: 'text-faint' },
};

export function ContractStatusBadge({ status }: { status: ContractVisibleStatus }) {
  const entry = LABELS[status];
  return (
    <span
      className={[
        'inline-flex items-center gap-2 text-xs font-medium whitespace-nowrap',
        entry.text,
      ].join(' ')}
    >
      <span className={['size-1.5 shrink-0', entry.dot].join(' ')} aria-hidden="true" />
      {entry.label}
    </span>
  );
}
