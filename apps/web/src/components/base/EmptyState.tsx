import type { ReactNode } from 'react';

/**
 * Jede Liste braucht einen echten Leerzustand. Er sagt, was fehlt und was zu
 * tun ist — statt einer leeren Fläche oder erfundener Beispielzeilen.
 */
export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 px-4 py-10 sm:items-center sm:px-5 sm:text-center">
      <p className="font-medium">{title}</p>
      <p className="max-w-[52ch] text-sm text-muted">{detail}</p>
      {action}
    </div>
  );
}

export function ErrorState({ detail }: { detail: string }) {
  return (
    <div role="alert" className="px-4 py-8 sm:px-5">
      <p className="font-medium text-danger">Konnte nicht geladen werden</p>
      <p className="mt-1 max-w-[60ch] text-sm text-muted">{detail}</p>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <p aria-live="polite" className="px-4 py-8 text-sm text-muted sm:px-5">
      {label}
    </p>
  );
}
