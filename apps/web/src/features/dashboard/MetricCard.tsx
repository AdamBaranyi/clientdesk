import { Link } from 'react-router';

interface Props {
  label: string;
  value: string;
  hint: string;
  to: string;
  highlight?: boolean;
}

/** Führt zur entsprechend gefilterten Detailansicht — Kennzahlen sind Einstiege. */
export function MetricCard({ label, value, hint, to, highlight = false }: Props) {
  return (
    <Link
      to={to}
      className={[
        'flex flex-col rounded-lg border bg-surface p-5 no-underline shadow-[var(--shadow-card)] transition-colors',
        highlight ? 'border-accent/40 hover:border-accent' : 'border-line hover:border-faint',
      ].join(' ')}
    >
      <span
        className={[
          'text-[10px] font-semibold tracking-[0.09em] uppercase',
          highlight ? 'text-accent' : 'text-faint',
        ].join(' ')}
      >
        {label}
      </span>
      <span className="mt-3 font-mono text-2xl leading-none font-medium break-words text-ink">
        {value}
      </span>
      <span className="mt-2 text-xs text-faint">{hint}</span>
    </Link>
  );
}
