import type { ContractVisibleStatus } from '@tallyroom/contracts';
import { domainMessages } from '../../i18n/domain-messages.ts';
import { useMessages } from '../../i18n/messages.ts';

/**
 * Jeder Zustand trägt Punkt und Wort. Die Farbe allein dürfte den Unterschied
 * nicht tragen. Das Wort kommt aus domainMessages.
 */
const STYLES: Record<ContractVisibleStatus, { dot: string; text: string }> = {
  draft: { dot: 'bg-faint', text: 'text-muted' },
  planned: { dot: 'bg-[var(--warning-mark)]', text: 'text-warning' },
  active: { dot: 'bg-positive', text: 'text-positive' },
  ended: { dot: 'bg-faint', text: 'text-muted' },
};

export function ContractStatusBadge({ status }: { status: ContractVisibleStatus }) {
  const labels = useMessages(domainMessages).contractStatus;
  const entry = STYLES[status];
  return (
    <span
      className={[
        'inline-flex items-center gap-2 text-xs font-medium whitespace-nowrap',
        entry.text,
      ].join(' ')}
    >
      <span className={['size-1.5 shrink-0', entry.dot].join(' ')} aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
