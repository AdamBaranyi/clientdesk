import { useState } from 'react';
import { Plus } from 'lucide-react';
import { formatAmountMinor, parseAmountToMinor, type ContractRate } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { TextField } from '../../components/base/Field.tsx';
import { ApiRequestError } from '../../lib/api.ts';
import { formatDate } from '../../lib/format.ts';
import { useAddRate } from './api.ts';
import { useMessages } from '../../i18n/messages.ts';
import { contractMessages } from './messages.ts';

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
  // Nur ob der Betrag ungültig ist, nicht der Text — so folgt die Meldung
  // einem Sprachwechsel.
  const [amountInvalid, setAmountInvalid] = useState(false);
  const add = useAddRate(workspaceId, contractId);
  const m = useMessages(contractMessages);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const minor = parseAmountToMinor(amount);
    if (minor === null) {
      setAmountInvalid(true);
      return;
    }
    setAmountInvalid(false);
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
    add.error instanceof ApiRequestError ? add.error.message : add.error ? m.rates.addFailed : null;

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col">
        {rates.map((rate, index) => (
          <li
            key={rate.id}
            className="flex flex-wrap items-baseline justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5"
          >
            <span className="flex items-baseline gap-3">
              <span className="font-mono text-body">
                {m.rates.effectiveFrom(formatDate(rate.effectiveFrom))}
              </span>
              {index === 0 && <span className="text-body text-muted">{m.rates.firstVersion}</span>}
            </span>
            <span className="font-mono text-body font-medium">
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
            label={m.rates.newPriceFrom}
            type="date"
            required
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
          />
        </div>
        <div className="flex-1">
          <TextField
            id="preis-betrag"
            label={m.rates.monthlyInChf}
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            error={amountInvalid ? m.rates.amountInvalid : undefined}
          />
        </div>
        <Button type="submit" disabled={add.isPending || effectiveFrom === '' || amount === ''}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          {add.isPending ? m.adding : m.add}
        </Button>
      </form>

      {message && (
        <p role="alert" className="px-4 pb-4 text-body text-danger sm:px-5">
          {message}
        </p>
      )}
    </div>
  );
}
