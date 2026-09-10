import type { RequestPriority, RequestStatus } from '@clientdesk/contracts';
import { REQUEST_STATUS_LABELS } from './status-labels.ts';

const STATUS_STYLE: Record<RequestStatus, { dot: string; text: string }> = {
  open: { dot: 'bg-faint', text: 'text-muted' },
  in_progress: { dot: 'bg-accent', text: 'text-accent' },
  waiting_customer: { dot: 'bg-[var(--warning-mark)]', text: 'text-warning' },
  resolved: { dot: 'bg-positive', text: 'text-positive' },
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={[
        'inline-flex items-center gap-2 text-xs font-medium whitespace-nowrap',
        style.text,
      ].join(' ')}
    >
      <span
        className={['size-1.5 shrink-0 rounded-full', style.dot].join(' ')}
        aria-hidden="true"
      />
      {REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  if (priority === 'normal') return null;
  return (
    <span className="text-micro inline-flex shrink-0 items-center rounded-sm border border-danger px-1.5 py-0.5 font-condensed font-semibold tracking-[0.12em] text-danger">
      HOCH
    </span>
  );
}
