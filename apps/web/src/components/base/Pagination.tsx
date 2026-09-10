import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pagination as PaginationInfo } from '@clientdesk/contracts';

interface Props {
  pagination: PaginationInfo;
  onChange: (page: number) => void;
}

export function Pagination({ pagination, onChange }: Props) {
  if (pagination.totalPages <= 1) return null;

  const { page, totalPages, totalItems } = pagination;

  return (
    <nav
      aria-label="Seiten"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5"
    >
      <p className="text-xs text-muted">
        Seite {page} von {totalPages} · {totalItems} Einträge
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex min-h-11 items-center gap-1 rounded-sm border border-line px-3 text-sm text-muted disabled:opacity-40"
        >
          <ChevronLeft size={16} strokeWidth={1.8} aria-hidden="true" />
          Zurück
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="flex min-h-11 items-center gap-1 rounded-sm border border-line px-3 text-sm text-muted disabled:opacity-40"
        >
          Weiter
          <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
