import { useState } from 'react';
import { AlertCircle, Check, Plus } from 'lucide-react';
import type { Milestone } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { TextField } from '../../components/base/Field.tsx';
import { useAddMilestone, useUpdateMilestone } from './api.ts';
import { formatDate } from '../../lib/format.ts';
import { useMessages } from '../../i18n/messages.ts';
import { projectMessages } from './messages.ts';

interface Props {
  workspaceId: string;
  projectId: string;
  milestones: Milestone[];
}

export function MilestoneList({ workspaceId, projectId, milestones }: Props) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const add = useAddMilestone(workspaceId, projectId);
  const update = useUpdateMilestone(workspaceId);
  const m = useMessages(projectMessages);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim() === '') return;
    add.mutate(
      { title, dueDate: dueDate || null },
      {
        onSuccess: () => {
          setTitle('');
          setDueDate('');
        },
      },
    );
  }

  return (
    <div className="flex flex-col">
      {milestones.length === 0 && (
        <p className="px-4 pb-4 text-body text-muted sm:px-5">{m.milestones.empty}</p>
      )}

      <ul className="flex flex-col">
        {milestones.map((milestone) => (
          <li
            key={milestone.id}
            className="flex items-start gap-3 border-t border-line-soft px-4 py-3 sm:px-5"
          >
            <button
              type="button"
              disabled={update.isPending}
              onClick={() =>
                update.mutate({
                  milestoneId: milestone.id,
                  input: { status: milestone.status === 'done' ? 'open' : 'done' },
                })
              }
              aria-pressed={milestone.status === 'done'}
              className={[
                'mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-sm border transition-colors',
                milestone.status === 'done'
                  ? 'border-ink bg-action text-action-fg'
                  : 'border-line text-transparent hover:border-faint',
              ].join(' ')}
            >
              <Check size={16} strokeWidth={2.4} aria-hidden="true" />
              <span className="sr-only">
                {milestone.status === 'done'
                  ? m.milestones.reopen(milestone.title)
                  : m.milestones.markDone(milestone.title)}
              </span>
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pt-2">
              <span
                className={[
                  'text-body font-medium',
                  milestone.status === 'done' ? 'text-muted line-through' : '',
                ].join(' ')}
              >
                {milestone.title}
              </span>
              <span className="flex flex-wrap items-center gap-3 text-body">
                {milestone.dueDate ? (
                  <span className="font-mono text-muted">{formatDate(milestone.dueDate)}</span>
                ) : (
                  <span className="text-muted">{m.milestones.noDueDate}</span>
                )}
                {milestone.overdue && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-danger">
                    <AlertCircle size={13} strokeWidth={2} aria-hidden="true" />
                    {m.milestones.overdue}
                  </span>
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <form
        onSubmit={submit}
        className="flex flex-col gap-3 border-t border-line-soft px-4 py-4 sm:flex-row sm:items-end sm:px-5"
      >
        <div className="flex-1">
          <TextField
            id="meilenstein-titel"
            label={m.milestones.newMilestone}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={m.milestones.titlePlaceholder}
          />
        </div>
        <div className="sm:w-44">
          <TextField
            id="meilenstein-termin"
            label={m.milestones.dueDate}
            type="date"
            hint={m.optional}
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={add.isPending || title.trim() === ''}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          {add.isPending ? m.milestones.adding : m.milestones.add}
        </Button>
      </form>

      {add.isError && (
        <p role="alert" className="px-4 pb-4 text-body text-danger sm:px-5">
          {m.milestones.addFailed}
        </p>
      )}
    </div>
  );
}
