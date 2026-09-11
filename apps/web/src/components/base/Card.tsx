import type { ReactNode } from 'react';

/** Eine Fläche mit Kante, ohne Rundung und ohne Schatten. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={['border border-line bg-surface', className].join(' ')}>{children}</div>;
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
      <h2 className="text-body font-semibold">{title}</h2>
      {action}
    </div>
  );
}
