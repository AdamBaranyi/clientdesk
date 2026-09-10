import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import {
  ALLOWED_TRANSITIONS,
  type RequestStatus,
  type WorkspaceSummary,
} from '@clientdesk/contracts';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { ApiRequestError } from '../../lib/api.ts';
import { workspacePath } from '../../lib/paths.ts';
import { CommentThread } from './CommentThread.tsx';
import { PriorityBadge, RequestStatusBadge } from './labels.tsx';
import { REQUEST_STATUS_LABELS } from './status-labels.ts';
import { useChangeRequestStatus, useRequest, useRequestComments } from './api.ts';
import { PendingRecord, RecordHeading } from '../../components/base/RecordLink.tsx';
import { useRecordTitlePreview } from '../../lib/use-record-title.ts';

export function RequestDetailPage({ workspace }: { workspace: WorkspaceSummary }) {
  const { requestId } = useParams();
  const query = useRequest(workspace.id, requestId);
  const comments = useRequestComments(workspace.id, requestId);
  const changeStatus = useChangeRequestStatus(workspace.id, requestId ?? '');

  const preview = useRecordTitlePreview();
  if (query.isPending) return <PendingRecord title={preview} label="Anfrage wird geladen …" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState detail="Diese Anfrage existiert nicht oder gehört zu einem anderen Workspace." />
    );
  }

  const request = query.data;
  const conflict =
    changeStatus.error instanceof ApiRequestError && changeStatus.error.code === 'VERSION_CONFLICT';

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
      <Link
        to={workspacePath(workspace.id, 'requests')}
        className="inline-flex items-center gap-1.5 text-sm text-muted no-underline hover:text-ink"
      >
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Alle Anfragen
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={request.priority} />
            <RecordHeading>{request.subject}</RecordHeading>
          </span>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span>{request.customerName}</span>
            {request.projectName && <span>· {request.projectName}</span>}
            <RequestStatusBadge status={request.status} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Nur die vom Server erlaubten Übergänge stehen zur Wahl. */}
          {(ALLOWED_TRANSITIONS[request.status] ?? []).map((next: RequestStatus) => (
            <button
              key={next}
              type="button"
              disabled={changeStatus.isPending}
              onClick={() => changeStatus.mutate({ status: next, version: request.version })}
              className="min-h-11 rounded-sm border border-line px-3 text-sm font-medium text-muted transition-colors hover:text-ink disabled:opacity-60"
            >
              {REQUEST_STATUS_LABELS[next]}
            </button>
          ))}
        </div>
      </div>

      {conflict && (
        <p
          role="alert"
          className="rounded-sm border border-line bg-raised px-4 py-3 text-sm text-danger"
        >
          Die Anfrage wurde inzwischen geändert. Bitte Seite neu laden.
        </p>
      )}

      <Card>
        <CardHeader
          title="Anliegen"
          action={
            <span className="text-xs text-faint">
              {request.createdByName ? `Erfasst von ${request.createdByName}` : 'Aus dem Portal'}
            </span>
          }
        />
        <p className="max-w-[75ch] px-4 pb-5 text-sm whitespace-pre-line sm:px-5">{request.body}</p>
      </Card>

      <Card>
        <CardHeader
          title="Verlauf"
          action={
            <span className="text-xs text-faint">
              Interne Kommentare erreichen das Kundenportal nie
            </span>
          }
        />
        {comments.isPending && <LoadingState label="Kommentare werden geladen …" />}
        {comments.data && requestId && (
          <CommentThread
            workspaceId={workspace.id}
            requestId={requestId}
            comments={comments.data}
          />
        )}
      </Card>
    </div>
  );
}
