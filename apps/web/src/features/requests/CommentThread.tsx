import { useState } from 'react';
import { Lock, Send, Users } from 'lucide-react';
import type { CommentVisibility, RequestComment } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { languageTag } from '../../i18n/detect.ts';
import { useLocale } from '../../i18n/locale-context.ts';
import { useMessages } from '../../i18n/messages.ts';
import { useAddRequestComment } from './api.ts';
import { requestMessages } from './messages.ts';

interface Props {
  workspaceId: string;
  requestId: string;
  comments: RequestComment[];
}

function formatMoment(iso: string, tag: string): string {
  return new Date(iso).toLocaleString(tag, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Interne und öffentliche Kommentare stehen in einem Verlauf, aber deutlich
 * unterschieden — nicht nur farblich, sondern mit Symbol und Wort. Wer hier
 * schreibt, muss auf einen Blick sehen, wer es lesen wird.
 */
export function CommentThread({ workspaceId, requestId, comments }: Props) {
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<CommentVisibility>('internal');
  const add = useAddRequestComment(workspaceId, requestId);
  const m = useMessages(requestMessages).comments;
  const { locale } = useLocale();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (body.trim() === '') return;
    add.mutate({ body, visibility }, { onSuccess: () => setBody('') });
  }

  return (
    <div className="flex flex-col">
      {comments.length === 0 && <p className="px-4 pb-4 text-sm text-muted sm:px-5">{m.empty}</p>}

      <ul className="flex flex-col">
        {comments.map((comment) => {
          const isInternal = comment.visibility === 'internal';
          return (
            <li
              key={comment.id}
              className={[
                'border-t border-line-soft px-4 py-4 sm:px-5',
                isInternal ? 'bg-raised' : '',
              ].join(' ')}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">{comment.authorName ?? m.unknownAuthor}</span>
                <span
                  className={[
                    'inline-flex items-center gap-1.5 text-xs font-medium',
                    isInternal ? 'text-warning' : 'text-positive',
                  ].join(' ')}
                >
                  {isInternal ? (
                    <Lock size={12} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Users size={12} strokeWidth={2} aria-hidden="true" />
                  )}
                  {isInternal ? m.internalOnly : m.visibleToCustomer}
                </span>
                <span className="font-mono text-xs text-muted">
                  {formatMoment(comment.createdAt, languageTag(locale))}
                </span>
              </div>
              <p className="mt-2 max-w-[75ch] text-sm whitespace-pre-line">{comment.body}</p>
            </li>
          );
        })}
      </ul>

      <form
        onSubmit={submit}
        className="flex flex-col gap-3 border-t border-line-soft px-4 py-4 sm:px-5"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="kommentar-text" className="text-sm font-medium">
            {m.label}
          </label>
          <textarea
            id="kommentar-text"
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="text-body w-full resize-y rounded-sm border border-line bg-surface px-3 py-2.5 text-ink"
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-medium text-muted">{m.visibility}</legend>
          <div className="flex flex-col gap-2 sm:flex-row">
            {(['internal', 'public'] as const).map((option) => (
              <label
                key={option}
                className={[
                  'flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 rounded-sm border px-3 text-sm',
                  visibility === option ? 'border-ink bg-raised' : 'border-line',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="sichtbarkeit"
                  value={option}
                  checked={visibility === option}
                  onChange={() => setVisibility(option)}
                  className="size-4 accent-[var(--action-bg)]"
                />
                {option === 'internal' ? (
                  <>
                    <Lock size={14} strokeWidth={2} aria-hidden="true" />
                    {m.internalOnly}
                  </>
                ) : (
                  <>
                    <Users size={14} strokeWidth={2} aria-hidden="true" />
                    {m.visibleToCustomer}
                  </>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={add.isPending || body.trim() === ''}>
            <Send size={15} strokeWidth={2} aria-hidden="true" />
            {add.isPending ? m.saving : m.submit}
          </Button>
        </div>

        {add.isError && (
          <p role="alert" className="text-sm text-danger">
            {m.saveFailed}
          </p>
        )}
      </form>
    </div>
  );
}
