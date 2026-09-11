import { useState } from 'react';
import { Button } from '../../components/base/Button.tsx';
import { Dialog } from '../../components/base/Dialog.tsx';
import { TextAreaField } from '../../components/base/Field.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { projectMessages } from './messages.ts';

interface Props {
  open: boolean;
  openMilestones: number;
  pending: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

const MIN_LENGTH = 10;

/**
 * Ein Projekt mit offenen Meilensteinen abzuschliessen ist erlaubt, aber nur
 * mit dokumentierter Begründung. Der Server prüft dieselbe Bedingung.
 */
export function CompletionDialog({ open, openMilestones, pending, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('');
  const m = useMessages(projectMessages);
  const tooShort = reason.trim().length < MIN_LENGTH;

  return (
    <Dialog open={open} title={m.completion.title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {m.completion.openMilestones(openMilestones)} {m.completion.explain}
        </p>

        <TextAreaField
          id="abschluss-begruendung"
          label={m.completion.reason}
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          hint={m.completion.minLength(MIN_LENGTH)}
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            {m.cancel}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={tooShort || pending}
            onClick={() => onConfirm(reason.trim())}
          >
            {pending ? m.completion.completing : m.completion.complete}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
