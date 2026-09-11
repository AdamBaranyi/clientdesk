import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import {
  ALLOWED_TRANSITIONS,
  type RequestStatus,
  type WorkspaceSummary,
} from '@tallyroom/contracts';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { domainMessages } from '../../i18n/domain-messages.ts';
import { useMessages } from '../../i18n/messages.ts';
import { ApiRequestError } from '../../lib/api.ts';
import { workspacePath } from '../../lib/paths.ts';
import { CommentThread } from './CommentThread.tsx';
import { PriorityBadge, RequestStatusBadge } from './labels.tsx';
import { requestMessages } from './messages.ts';
import { useChangeRequestStatus, useRequest, useRequestComments } from './api.ts';
import { PendingRecord, RecordHeading } from '../../components/base/RecordLink.tsx';
import { useRecordTitlePreview } from '../../lib/use-record-title.ts';

export function RequestDetailPage({ workspace }: { workspace: WorkspaceSummary }) {
  const { requestId } = useParams();
  const query = useRequest(workspace.id, requestId);
  const comments = useRequestComments(workspace.id, requestId);
  const changeStatus = useChangeRequestStatus(workspace.id, requestId ?? '');
  const m = useMessages(requestMessages).detail;
  const statusLabels = useMessages(domainMessages).requestStatus;

  const preview = useRecordTitlePreview();
  if (query.isPending) return <PendingRecord title={preview} label={m.loading} />;
  if (query.isError || !query.data) {
    return <ErrorState detail={m.notFound} />;
  }

  const request = query.data;
  const conflict =
    changeStatus.error instanceof ApiRequestError && changeStatus.error.code === 'VERSION_CONFLICT';

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <Link
        to={workspacePath(workspace.id, 'requests')}
        className="inline-flex items-center gap-1.5 text-body text-muted no-underline hover:text-ink"
      >
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        {m.backToList}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={request.priority} />
            <RecordHeading>{request.subject}</RecordHeading>
          </span>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-body text-muted">
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
              className="min-h-11 rounded-sm border border-line px-3 text-body font-medium text-muted transition-colors hover:text-ink disabled:opacity-60"
            >
              {statusLabels[next]}
            </button>
          ))}
        </div>
      </div>

      {conflict && (
        <p
          role="alert"
          className="rounded-sm border border-line bg-raised px-4 py-3 text-body text-danger"
        >
          {m.conflict}
        </p>
      )}

      <Card>
        <CardHeader
          title={m.concern}
          action={
            <span className="text-body text-muted">
              {request.createdByName ? m.recordedBy(request.createdByName) : m.fromPortal}
            </span>
          }
        />
        <p className="max-w-[75ch] px-4 pb-5 text-body whitespace-pre-line sm:px-5">
          {request.body}
        </p>
      </Card>

      <Card>
        <CardHeader
          title={m.history}
          action={<span className="text-body text-muted">{m.historyHint}</span>}
        />
        {comments.isPending && <LoadingState label={m.commentsLoading} />}
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
