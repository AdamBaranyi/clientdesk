import { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Link, useParams } from 'react-router';
import type { WorkspaceSummary } from '@clientdesk/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { portalPath } from '../../lib/portal-paths.ts';
import { RequestStatusBadge } from '../requests/labels.tsx';
import { useAddPortalComment, usePortalRequest } from './api.ts';

function formatMoment(iso: string): string {
  return new Date(iso).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PortalRequestDetailPage({ workspace }: { workspace: WorkspaceSummary }) {
  const { requestId } = useParams();
  const [body, setBody] = useState('');
  const query = usePortalRequest(workspace.id, requestId);
  const addComment = useAddPortalComment(workspace.id, requestId ?? '');

  if (query.isPending) return <LoadingState label="Anfrage wird geladen …" />;
  if (query.isError || !query.data) {
    return <ErrorState detail="Diese Anfrage gehört nicht zu Ihrem Zugang." />;
  }

  const { request, comments } = query.data;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (body.trim() === '') return;
    addComment.mutate(body, { onSuccess: () => setBody('') });
  }

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-5">
      <Link
        to={portalPath(workspace.id, 'requests')}
        className="inline-flex items-center gap-1.5 text-sm text-muted no-underline hover:text-ink"
      >
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Alle Anfragen
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-[-0.02em]">{request.subject}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <RequestStatusBadge status={request.status} />
          {request.projectName && <span className="text-sm text-muted">{request.projectName}</span>}
        </div>
      </div>

      <Card>
        <CardHeader title="Ihr Anliegen" />
        <p className="max-w-[75ch] px-4 pb-5 text-sm whitespace-pre-line sm:px-5">{request.body}</p>
      </Card>

      <Card>
        <CardHeader title="Verlauf" />
        {comments.length === 0 && (
          <p className="px-4 pb-4 text-sm text-muted sm:px-5">Noch keine Antwort.</p>
        )}
        <ul className="flex flex-col">
          {comments.map((comment) => (
            <li key={comment.id} className="border-t border-line-soft px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">{comment.authorName ?? 'Team'}</span>
                <span className="font-mono text-xs text-faint">
                  {formatMoment(comment.createdAt)}
                </span>
              </div>
              <p className="mt-2 max-w-[75ch] text-sm whitespace-pre-line">{comment.body}</p>
            </li>
          ))}
        </ul>

        <form
          onSubmit={submit}
          className="flex flex-col gap-3 border-t border-line-soft px-4 py-4 sm:px-5"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="portal-antwort" className="text-sm font-medium">
              Antworten
            </label>
            <textarea
              id="portal-antwort"
              rows={3}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2.5 text-base text-ink outline-none focus-visible:border-accent"
            />
            {request.status === 'waiting_customer' && (
              <p className="text-xs text-warning">
                Diese Anfrage wartet auf Ihre Rückmeldung. Ihre Antwort öffnet sie wieder.
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={addComment.isPending || body.trim() === ''}
            >
              <Send size={15} strokeWidth={2} aria-hidden="true" />
              {addComment.isPending ? 'Wird gesendet …' : 'Antwort senden'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
