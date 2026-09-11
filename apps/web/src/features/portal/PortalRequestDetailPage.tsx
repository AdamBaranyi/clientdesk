import { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Link, useParams } from 'react-router';
import type { Locale, WorkspaceSummary } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { languageTag } from '../../i18n/detect.ts';
import { useLocale } from '../../i18n/locale-context.ts';
import { useMessages } from '../../i18n/messages.ts';
import { portalPath } from '../../lib/portal-paths.ts';
import { RequestStatusBadge } from '../requests/labels.tsx';
import { useAddPortalComment, usePortalRequest } from './api.ts';
import { portalMessages } from './messages.ts';

function formatMoment(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(languageTag(locale), {
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
  const { locale } = useLocale();
  const { requests: r, requestDetail: m } = useMessages(portalMessages);

  if (query.isPending) return <LoadingState label={m.loading} />;
  if (query.isError || !query.data) {
    return <ErrorState detail={m.notFound} />;
  }

  const { request, comments } = query.data;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (body.trim() === '') return;
    addComment.mutate(body, { onSuccess: () => setBody('') });
  }

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8">
      <Link
        to={portalPath(workspace.id, 'requests')}
        className="inline-flex items-center gap-1.5 text-sm text-muted no-underline hover:text-ink"
      >
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        {r.all}
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-[-0.02em]">{request.subject}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <RequestStatusBadge status={request.status} />
          {request.projectName && <span className="text-sm text-muted">{request.projectName}</span>}
        </div>
      </div>

      <Card>
        <CardHeader title={r.body} />
        <p className="max-w-[75ch] px-4 pb-5 text-sm whitespace-pre-line sm:px-5">{request.body}</p>
      </Card>

      <Card>
        <CardHeader title={m.history} />
        {comments.length === 0 && (
          <p className="px-4 pb-4 text-sm text-muted sm:px-5">{m.noReply}</p>
        )}
        <ul className="flex flex-col">
          {comments.map((comment) => (
            <li key={comment.id} className="border-t border-line-soft px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">{comment.authorName ?? m.teamFallback}</span>
                <span className="font-mono text-xs text-muted">
                  {formatMoment(comment.createdAt, locale)}
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
              {m.reply}
            </label>
            <textarea
              id="portal-antwort"
              rows={3}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="text-body w-full resize-y rounded-sm border border-line bg-surface px-3 py-2.5 text-ink"
            />
            {request.status === 'waiting_customer' && (
              <p className="text-xs text-warning">{m.waitingHint}</p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={addComment.isPending || body.trim() === ''}
            >
              <Send size={15} strokeWidth={2} aria-hidden="true" />
              {addComment.isPending ? r.sending : m.sendReply}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
