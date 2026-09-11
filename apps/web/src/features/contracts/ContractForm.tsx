import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  contractInputSchema,
  parseAmountToMinor,
  type ContractFormValues,
  type ContractInput,
  type Customer,
} from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { TextAreaField, TextField } from '../../components/base/Field.tsx';
import { ApiRequestError } from '../../lib/api.ts';
import { useMessages } from '../../i18n/messages.ts';
import { contractMessages } from './messages.ts';

interface Props {
  customers: Customer[];
  pending: boolean;
  error: unknown;
  onSubmit: (values: ContractInput) => void;
  onCancel: () => void;
}

export function ContractForm({ customers, pending, error, onSubmit, onCancel }: Props) {
  // Der Betrag wird als Text erfasst und erst beim Absenden in Rappen gewandelt.
  const [amount, setAmount] = useState('');
  // Nur ob der Betrag ungültig ist, nicht der Text — so folgt die Meldung
  // einem Sprachwechsel.
  const [amountInvalid, setAmountInvalid] = useState(false);
  const m = useMessages(contractMessages);

  const form = useForm<ContractFormValues, unknown, ContractInput>({
    resolver: zodResolver(contractInputSchema),
    defaultValues: {
      customerId: customers[0]?.id ?? '',
      name: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      confirmationStatus: 'confirmed',
      publicDescription: '',
      internalNote: '',
      clientVisible: false,
      monthlyAmountMinor: 0,
    },
  });

  const errors = form.formState.errors;
  const message =
    error instanceof ApiRequestError ? error.message : error ? m.form.saveFailed : null;

  function submit(values: ContractInput) {
    const minor = parseAmountToMinor(amount);
    if (minor === null) {
      setAmountInvalid(true);
      return;
    }
    setAmountInvalid(false);
    onSubmit({ ...values, monthlyAmountMinor: minor, endDate: values.endDate || null });
  }

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit(submit)}>
      {message && (
        <p
          role="alert"
          className="rounded-sm border border-line bg-raised px-3 py-2.5 text-sm text-danger"
        >
          {message}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="vertrag-kunde" className="text-sm font-medium">
          {m.customer}
        </label>
        <select
          id="vertrag-kunde"
          {...form.register('customerId')}
          className="text-body min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-ink"
        >
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        {errors.customerId && <p className="text-sm text-danger">{errors.customerId.message}</p>}
      </div>

      <TextField
        id="vertrag-name"
        label={m.name}
        placeholder={m.form.namePlaceholder}
        error={errors.name?.message}
        {...form.register('name')}
      />

      <TextField
        id="vertrag-betrag"
        label={m.form.monthlyAmount}
        inputMode="decimal"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        hint={m.form.monthlyAmountHint}
        error={amountInvalid ? m.form.amountInvalid : undefined}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="vertrag-start"
          label={m.start}
          type="date"
          error={errors.startDate?.message}
          {...form.register('startDate')}
        />
        <TextField
          id="vertrag-ende"
          label={m.form.end}
          type="date"
          hint={m.form.endHint}
          error={errors.endDate?.message}
          {...form.register('endDate')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="vertrag-status" className="text-sm font-medium">
          {m.form.confirmationStatus}
        </label>
        <select
          id="vertrag-status"
          {...form.register('confirmationStatus')}
          className="text-body min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-ink"
        >
          <option value="confirmed">{m.form.confirmed}</option>
          <option value="draft">{m.form.draft}</option>
        </select>
      </div>

      <TextAreaField
        id="vertrag-leistung"
        label={m.form.publicDescription}
        hint={m.form.publicDescriptionHint}
        error={errors.publicDescription?.message}
        {...form.register('publicDescription')}
      />
      <TextAreaField
        id="vertrag-notiz"
        label={m.internalNote}
        hint={m.form.internalNoteHint}
        error={errors.internalNote?.message}
        {...form.register('internalNote')}
      />

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          {...form.register('clientVisible')}
          className="mt-0.5 size-5 shrink-0 accent-[var(--action-bg)]"
        />
        <span>
          {m.form.clientVisible}
          <span className="mt-0.5 block text-xs text-muted">{m.form.clientVisibleHint}</span>
        </span>
      </label>

      <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {m.cancel}
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? m.form.creating : m.createContract}
        </Button>
      </div>
    </form>
  );
}
