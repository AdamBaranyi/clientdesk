import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { customerInputSchema, type Customer, type CustomerInput } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { TextAreaField, TextField } from '../../components/base/Field.tsx';
import { ApiRequestError } from '../../lib/api.ts';

interface Props {
  customer?: Customer;
  pending: boolean;
  error: unknown;
  onSubmit: (values: CustomerInput) => void;
  onCancel: () => void;
}

function messageFor(error: unknown): string | null {
  if (error instanceof ApiRequestError) {
    if (error.code === 'VERSION_CONFLICT') return error.message;
    return error.message;
  }
  return error ? 'Speichern derzeit nicht möglich. Bitte später erneut versuchen.' : null;
}

/**
 * Ein Formular für Anlegen und Bearbeiten. Bei einem Fehler bleiben die
 * Eingaben stehen — react-hook-form hält den Zustand, es wird nichts geleert.
 */
export function CustomerForm({ customer, pending, error, onSubmit, onCancel }: Props) {
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

  const message = messageFor(error);
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
        label="Name"
        autoComplete="organization"
        error={errors.name?.message}
        {...form.register('name')}
      />
      <TextField
        id="kunde-kontakt"
        label="Hauptkontakt"
        hint="Optional"
        autoComplete="name"
        error={errors.contactName?.message}
        {...form.register('contactName')}
      />
      <TextField
        id="kunde-email"
        label="E-Mail"
        type="email"
        hint="Optional"
        autoComplete="email"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <TextField
        id="kunde-telefon"
        label="Telefon"
        type="tel"
        hint="Optional"
        autoComplete="tel"
        error={errors.phone?.message}
        {...form.register('phone')}
      />
      <TextField
        id="kunde-website"
        label="Webseite"
        type="url"
        hint="Optional, mit https:// beginnen"
        error={errors.website?.message}
        {...form.register('website')}
      />
      <TextAreaField
        id="kunde-notiz"
        label="Interne Notiz"
        hint="Nur für das Team sichtbar, nie im Kundenportal"
        error={errors.internalNote?.message}
        {...form.register('internalNote')}
      />

      <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'Wird gespeichert …' : customer ? 'Änderungen speichern' : 'Kunde anlegen'}
        </Button>
      </div>
    </form>
  );
}
