import { useState } from 'react';
import { Plus } from 'lucide-react';
import { formatAmountMinor, parseAmountToMinor, type ContractRate } from '@clientdesk/contracts';
import { Button } from '../../components/base/Button.tsx';
import { TextField } from '../../components/base/Field.tsx';
import { ApiRequestError } from '../../lib/api.ts';
import { formatDate } from '../../lib/format.ts';
import { useAddRate } from './api.ts';

interface Props {
  workspaceId: string;
  contractId: string;
  rates: ContractRate[];
}

/**
 * Preisversionen statt Preisänderung: eine neue Zeile ersetzt die alte nicht,
 * sondern gilt ab ihrem Datum. Vergangene Monatswerte bleiben dadurch gleich.
 */
export function RateHistory({ workspaceId, contractId, rates }: Props) {
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>(undefined);
  const add = useAddRate(workspaceId, contractId);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const minor = parseAmountToMinor(amount);
    if (minor === null) {
      setAmountError('Betrag in Franken angeben, zum Beispiel 320 oder 320.50');
      return;
    }
    setAmountError(undefined);
    add.mutate(
      { effectiveFrom, monthlyAmountMinor: minor },
      {
        onSuccess: () => {
          setEffectiveFrom('');
          setAmount('');
        },
      },
    );
  }

  const message =
    add.error instanceof ApiRequestError
      ? add.error.message
      : add.error
        ? 'Die Preisversion konnte nicht ergänzt werden.'
        : null;

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col">
        {rates.map((rate, index) => (
          <li
            key={rate.id}
            className="flex flex-wrap items-baseline justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5"
          >
            <span className="flex items-baseline gap-3">
              <span className="font-mono text-sm">ab {formatDate(rate.effectiveFrom)}</span>
              {index === 0 && <span className="text-xs text-muted">Erste Version</span>}
            </span>
            <span className="font-mono text-sm font-medium">
              CHF {formatAmountMinor(rate.monthlyAmountMinor)}
            </span>
          </li>
        ))}
      </ul>

      <form
        onSubmit={submit}
        className="flex flex-col gap-3 border-t border-line-soft px-4 py-4 sm:flex-row sm:items-end sm:px-5"
      >
        <div className="sm:w-44">
          <TextField
            id="preis-ab"
            label="Neuer Preis ab"
            type="date"
            required
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
          />
        </div>
        <div className="flex-1">
          <TextField
            id="preis-betrag"
            label="Monatlich in CHF"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            error={amountError}
          />
        </div>
        <Button type="submit" disabled={add.isPending || effectiveFrom === '' || amount === ''}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          {add.isPending ? 'Wird ergänzt …' : 'Ergänzen'}
        </Button>
      </form>

      {message && (
        <p role="alert" className="px-4 pb-4 text-sm text-danger sm:px-5">
          {message}
        </p>
      )}
    </div>
  );
}
