import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pagination as PaginationInfo } from '@tallyroom/contracts';
import { useMessages } from '../../i18n/messages.ts';
import { shellMessages } from '../messages.ts';

interface Props {
  pagination: PaginationInfo;
  onChange: (page: number) => void;
}

export function Pagination({ pagination, onChange }: Props) {
  const m = useMessages(shellMessages);
  if (pagination.totalPages <= 1) return null;

  const { page, totalPages, totalItems } = pagination;

  return (
    <nav
      aria-label={m.pages}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5"
    >
      <p className="text-xs text-muted">{m.pageOf(page, totalPages, totalItems)}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex min-h-11 items-center gap-1 rounded-sm border border-line px-3 text-sm text-muted disabled:opacity-40"
        >
          <ChevronLeft size={16} strokeWidth={1.8} aria-hidden="true" />
          {m.previous}
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="flex min-h-11 items-center gap-1 rounded-sm border border-line px-3 text-sm text-muted disabled:opacity-40"
        >
          {m.next}
          <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
