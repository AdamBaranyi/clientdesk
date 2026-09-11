import { Link } from 'react-router';
import type { ServiceRequest } from '@tallyroom/contracts';
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
import { useMessages } from '../../i18n/messages.ts';
import { PriorityBadge, RequestStatusBadge } from './labels.tsx';
import { requestMessages } from './messages.ts';

interface Props {
  requests: ServiceRequest[];
  basePath: string;
  showCustomer?: boolean;
}

type RowMessages = (typeof requestMessages)['de']['rows'];

function relativeTime(iso: string, m: RowMessages): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return m.minutesAgo(Math.max(1, minutes));
  const hours = Math.round(minutes / 60);
  if (hours < 24) return m.hoursAgo(hours);
  return m.daysAgo(Math.round(hours / 24));
}

export function RequestRows({ requests, basePath, showCustomer = true }: Props) {
  const m = useMessages(requestMessages).rows;
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
              {showCustomer && <span className="text-body text-muted">{request.customerName}</span>}
              <span className="flex flex-wrap items-center gap-3">
                <RequestStatusBadge status={request.status} />
                <span className="text-body text-muted">{relativeTime(request.updatedAt, m)}</span>
              </span>
            </Link>
          </CardItem>
        ))}
      </CardList>

      <DataTable>
        <TableHead>
          <Th>{m.subject}</Th>
          {showCustomer && <Th>{m.customer}</Th>}
          <Th>{m.status}</Th>
          <Th>{m.assignee}</Th>
          <Th right>{m.updated}</Th>
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
              <Cell>{request.assignedToName ?? m.unassigned}</Cell>
              <Cell right>{relativeTime(request.updatedAt, m)}</Cell>
            </Row>
          ))}
        </tbody>
      </DataTable>
    </>
  );
}
