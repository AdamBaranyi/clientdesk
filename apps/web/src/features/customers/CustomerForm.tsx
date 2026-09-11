import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { customerInputSchema, type Customer, type CustomerInput } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { TextAreaField, TextField } from '../../components/base/Field.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { ApiRequestError } from '../../lib/api.ts';
import { customerMessages } from './messages.ts';

interface Props {
  customer?: Customer;
  pending: boolean;
  error: unknown;
  onSubmit: (values: CustomerInput) => void;
  onCancel: () => void;
}

function messageFor(error: unknown, fallback: string): string | null {
  if (error instanceof ApiRequestError) {
    if (error.code === 'VERSION_CONFLICT') return error.message;
    return error.message;
  }
  return error ? fallback : null;
}

/**
 * Ein Formular für Anlegen und Bearbeiten. Bei einem Fehler bleiben die
 * Eingaben stehen — react-hook-form hält den Zustand, es wird nichts geleert.
 */
export function CustomerForm({ customer, pending, error, onSubmit, onCancel }: Props) {
  const m = useMessages(customerMessages);
  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerInputSchema),
    defaultValues: {
      name: customer?.name ?? '',
      contactName: customer?.contactName ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      website: customer?.website ?? '',
      internalNote: customer?.internalNote ?? '',
    },
  });

  const message = messageFor(error, m.form.saveFailed);
  const errors = form.formState.errors;

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      {message && (
        <p
          role="alert"
          className="rounded-sm border border-line bg-raised px-3 py-2.5 text-sm text-danger"
        >
          {message}
        </p>
      )}

      <TextField
        id="kunde-name"
        label={m.fields.name}
        autoComplete="organization"
        error={errors.name?.message}
        {...form.register('name')}
      />
      <TextField
        id="kunde-kontakt"
        label={m.fields.mainContact}
        hint={m.form.optional}
        autoComplete="name"
        error={errors.contactName?.message}
        {...form.register('contactName')}
      />
      <TextField
        id="kunde-email"
        label={m.fields.email}
        type="email"
        hint={m.form.optional}
        autoComplete="email"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <TextField
        id="kunde-telefon"
        label={m.fields.phone}
        type="tel"
        hint={m.form.optional}
        autoComplete="tel"
        error={errors.phone?.message}
        {...form.register('phone')}
      />
      <TextField
        id="kunde-website"
        label={m.fields.website}
        type="url"
        hint={m.form.websiteHint}
        error={errors.website?.message}
        {...form.register('website')}
      />
      <TextAreaField
        id="kunde-notiz"
        label={m.fields.internalNote}
        hint={m.form.internalNoteHint}
        error={errors.internalNote?.message}
        {...form.register('internalNote')}
      />

      <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {m.form.cancel}
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? m.form.saving : customer ? m.form.saveChanges : m.createCustomer}
        </Button>
      </div>
    </form>
  );
}
