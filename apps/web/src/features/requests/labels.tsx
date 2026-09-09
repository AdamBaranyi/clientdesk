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
    <span className="inline-flex shrink-0 items-center rounded-[5px] bg-[color-mix(in_oklab,var(--danger)_16%,transparent)] px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.04em] text-danger">
      HOCH
    </span>
  );
}
