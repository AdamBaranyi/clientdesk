import type { ReactNode } from 'react';
import { useMessages } from '../../i18n/messages.ts';
import { shellMessages } from '../messages.ts';

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
      <p className="max-w-[52ch] text-body text-muted">{detail}</p>
      {action}
    </div>
  );
}

export function ErrorState({ detail }: { detail: string }) {
  const m = useMessages(shellMessages);

  return (
    <div role="alert" className="px-4 py-8 sm:px-5">
      <p className="font-medium text-danger">{m.loadFailed}</p>
      <p className="mt-1 max-w-[60ch] text-body text-muted">{detail}</p>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <p aria-live="polite" className="px-4 py-8 text-body text-muted sm:px-5">
      {label}
    </p>
  );
}
