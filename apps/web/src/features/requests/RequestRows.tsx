import { Link } from 'react-router';
import type { ServiceRequest } from '@clientdesk/contracts';
import { PriorityBadge, RequestStatusBadge } from './labels.tsx';

interface Props {
  requests: ServiceRequest[];
  basePath: string;
  showCustomer?: boolean;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return `vor ${Math.max(1, minutes)} Min.`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'gestern' : `vor ${days} Tagen`;
}

export function RequestRows({ requests, basePath, showCustomer = true }: Props) {
  return (
    <>
      <ul className="flex flex-col sm:hidden">
        {requests.map((request) => (
          <li key={request.id} className="border-t border-line-soft">
            <Link
              to={`${basePath}/${request.id}`}
              className="flex flex-col gap-2 px-4 py-4 no-underline hover:bg-raised"
            >
              <span className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={request.priority} />
                <span className="font-medium text-ink">{request.subject}</span>
              </span>
              {showCustomer && <span className="text-sm text-muted">{request.customerName}</span>}
              <span className="flex flex-wrap items-center gap-3">
                <RequestStatusBadge status={request.status} />
                <span className="text-xs text-faint">{relativeTime(request.updatedAt)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <table className="hidden w-full border-collapse sm:table">
        <thead>
          <tr className="text-left text-[10px] font-semibold tracking-[0.09em] text-faint uppercase">
            <th className="px-5 pb-2 font-semibold">Betreff</th>
            {showCustomer && <th className="px-5 pb-2 font-semibold">Kunde</th>}
            <th className="px-5 pb-2 font-semibold">Status</th>
            <th className="px-5 pb-2 font-semibold">Zuständig</th>
            <th className="px-5 pb-2 text-right font-semibold">Aktualisiert</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className="border-t border-line-soft hover:bg-raised">
              <td className="px-5 py-3">
                <span className="flex items-center gap-2">
                  <PriorityBadge priority={request.priority} />
                  <Link to={`${basePath}/${request.id}`} className="font-medium no-underline">
                    {request.subject}
                  </Link>
                </span>
              </td>
              {showCustomer && (
                <td className="px-5 py-3 text-sm text-muted">{request.customerName}</td>
              )}
              <td className="px-5 py-3">
                <RequestStatusBadge status={request.status} />
              </td>
              <td className="px-5 py-3 text-sm text-muted">
                {request.assignedToName ?? <span className="text-faint">— nicht zugewiesen</span>}
              </td>
              <td className="px-5 py-3 text-right font-mono text-xs text-faint">
                {relativeTime(request.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
