import { Link } from 'react-router';
import type { ServiceRequest } from '@clientdesk/contracts';
import {
  CardItem,
  CardList,
  Cell,
  DataTable,
  Row,
  TableHead,
  Th,
} from '../../components/base/DataTable.tsx';
import { RecordLink } from '../../components/base/RecordLink.tsx';
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
      <CardList>
        {requests.map((request) => (
          <CardItem key={request.id}>
            <Link
              to={`${basePath}/${request.id}`}
              className="flex flex-col gap-2 px-4 py-4 text-ink hover:bg-raised"
            >
              <span className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={request.priority} />
                <span className="font-medium">{request.subject}</span>
              </span>
              {showCustomer && (
                <span className="text-dense text-muted">{request.customerName}</span>
              )}
              <span className="flex flex-wrap items-center gap-3">
                <RequestStatusBadge status={request.status} />
                <span className="text-micro text-muted">{relativeTime(request.updatedAt)}</span>
              </span>
            </Link>
          </CardItem>
        ))}
      </CardList>

      <DataTable>
        <TableHead>
          <Th>Betreff</Th>
          {showCustomer && <Th>Kunde</Th>}
          <Th>Status</Th>
          <Th>Zuständig</Th>
          <Th right>Aktualisiert</Th>
        </TableHead>
        <tbody>
          {requests.map((request) => (
            <Row key={request.id}>
              <Cell lead>
                <span className="flex items-center gap-2">
                  <PriorityBadge priority={request.priority} />
                  <RecordLink to={`${basePath}/${request.id}`} title={request.subject} />
                </span>
              </Cell>
              {showCustomer && <Cell>{request.customerName}</Cell>}
              <Cell>
                <RequestStatusBadge status={request.status} />
              </Cell>
              <Cell>{request.assignedToName ?? '— nicht zugewiesen'}</Cell>
              <Cell right>{relativeTime(request.updatedAt)}</Cell>
            </Row>
          ))}
        </tbody>
      </DataTable>
    </>
  );
}
