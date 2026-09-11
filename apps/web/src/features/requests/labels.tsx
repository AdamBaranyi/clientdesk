import type { RequestPriority, RequestStatus } from '@tallyroom/contracts';
import { domainMessages } from '../../i18n/domain-messages.ts';
import { useMessages } from '../../i18n/messages.ts';

const STATUS_STYLE: Record<RequestStatus, { dot: string; text: string }> = {
  open: { dot: 'bg-faint', text: 'text-muted' },
  in_progress: { dot: 'bg-ink', text: 'text-ink' },
  waiting_customer: { dot: 'bg-[var(--warning-mark)]', text: 'text-warning' },
  resolved: { dot: 'bg-positive', text: 'text-positive' },
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const m = useMessages(domainMessages);
  const style = STATUS_STYLE[status];
  return (
    <span
      className={[
        'inline-flex items-center gap-2 text-body font-medium whitespace-nowrap',
        style.text,
      ].join(' ')}
    >
      <span className={['size-1.5 shrink-0', style.dot].join(' ')} aria-hidden="true" />
      {m.requestStatus[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  const m = useMessages(domainMessages);
  if (priority === 'normal') return null;
  // Versalien per CSS: Screenreader lesen „Hoch" als Wort, nicht buchstabiert.
  return (
    <span className="text-body inline-flex shrink-0 items-center rounded-sm border border-danger px-1.5 py-0.5 font-condensed font-semibold tracking-[0.06em] text-danger uppercase">
      {m.requestPriority.high}
    </span>
  );
}
