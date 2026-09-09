import { useState } from 'react';
import { Button } from '../../components/base/Button.tsx';
import { Dialog } from '../../components/base/Dialog.tsx';
import { TextAreaField } from '../../components/base/Field.tsx';

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
  const tooShort = reason.trim().length < MIN_LENGTH;

  return (
    <Dialog open={open} title="Projekt abschliessen" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {openMilestones === 1
            ? 'Ein Meilenstein ist noch offen.'
            : `${openMilestones} Meilensteine sind noch offen.`}{' '}
          Bitte kurz festhalten, warum das Projekt trotzdem abgeschlossen wird. Die Begründung
          erscheint im Aktivitätsprotokoll.
        </p>

        <TextAreaField
          id="abschluss-begruendung"
          label="Begründung"
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          hint={`Mindestens ${MIN_LENGTH} Zeichen`}
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={tooShort || pending}
            onClick={() => onConfirm(reason.trim())}
          >
            {pending ? 'Wird abgeschlossen …' : 'Abschliessen'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
