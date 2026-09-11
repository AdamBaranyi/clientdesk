import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import type { WorkspaceSummary } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card } from '../../components/base/Card.tsx';
import { Dialog } from '../../components/base/Dialog.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { TextAreaField, TextField } from '../../components/base/Field.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { ApiRequestError } from '../../lib/api.ts';
import { portalPath } from '../../lib/portal-paths.ts';
import { RequestStatusBadge } from '../requests/labels.tsx';
import { useAssignableProjects, useCreatePortalRequest, usePortalRequests } from './api.ts';
import { portalMessages } from './messages.ts';

export function PortalRequestsPage({ workspace }: { workspace: WorkspaceSummary }) {
  const m = useMessages(portalMessages).requests;
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [projectId, setProjectId] = useState('');

  const query = usePortalRequests(workspace.id);
  const projects = useAssignableProjects(workspace.id);
  const create = useCreatePortalRequest(workspace.id);

  // Ein Schlüssel je geöffnetem Formular schützt vor dem Doppelklick.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  function openDialog() {
    setIdempotencyKey(crypto.randomUUID());
    setOpen(true);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (subject.trim() === '' || body.trim() === '') return;
    create.mutate(
      { input: { subject, body, projectId: projectId || null }, idempotencyKey },
      {
        onSuccess: () => {
          setSubject('');
          setBody('');
          setProjectId('');
          create.reset();
          setOpen(false);
        },
      },
    );
  }

  const message =
    create.error instanceof ApiRequestError
      ? create.error.message
      : create.error
        ? m.sendFailed
        : null;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em]">{m.heading}</h1>
          <p className="mt-1 max-w-[62ch] text-sm text-muted">{m.lead}</p>
        </div>
        <Button variant="primary" onClick={openDialog}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          {m.create}
        </Button>
      </div>

      <Card>
        {query.isPending && <LoadingState label={m.loading} />}
        {query.isError && <ErrorState detail={m.loadFailed} />}
        {query.data?.length === 0 && <EmptyState title={m.emptyTitle} detail={m.emptyDetail} />}

        <ul className="flex flex-col">
          {(query.data ?? []).map((request) => (
            <li key={request.id} className="border-t border-line-soft first:border-t-0">
              <Link
                to={portalPath(workspace.id, 'requests', request.id)}
                className="flex flex-col gap-2 px-4 py-4 no-underline hover:bg-raised sm:px-5"
              >
                <span className="font-medium text-ink">{request.subject}</span>
                <span className="flex flex-wrap items-center gap-3">
                  <RequestStatusBadge status={request.status} />
                  {request.projectName && (
                    <span className="text-xs text-muted">{request.projectName}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Dialog open={open} title={m.create} onClose={() => setOpen(false)}>
        <form noValidate onSubmit={submit} className="flex flex-col gap-4">
          {message && (
            <p
              role="alert"
              className="rounded-sm border border-line bg-raised px-3 py-2.5 text-sm text-danger"
            >
              {message}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="portal-projekt" className="text-sm font-medium">
              {m.project}
            </label>
            <select
              id="portal-projekt"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="text-body min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-ink"
            >
              <option value="">{m.noProject}</option>
              {/* Die Auswahl kommt vom Server — hier steht nichts, was nicht erlaubt wäre. */}
              {(projects.data ?? []).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <TextField
            id="portal-betreff"
            label={m.subject}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
          <TextAreaField
            id="portal-text"
            label={m.body}
            rows={5}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {m.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={create.isPending || subject.trim() === '' || body.trim() === ''}
            >
              {create.isPending ? m.sending : m.send}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
