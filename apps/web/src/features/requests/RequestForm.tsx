import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  requestInputSchema,
  type Customer,
  type RequestFormValues,
  type RequestInput,
} from '@clientdesk/contracts';
import { Button } from '../../components/base/Button.tsx';
import { TextAreaField, TextField } from '../../components/base/Field.tsx';
import { ApiRequestError } from '../../lib/api.ts';
import { useProjects } from '../projects/api.ts';

interface Props {
  customers: Customer[];
  workspaceId: string;
  pending: boolean;
  error: unknown;
  onSubmit: (values: RequestInput) => void;
  onCancel: () => void;
}

export function RequestForm({ customers, workspaceId, pending, error, onSubmit, onCancel }: Props) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  // Nur Projekte des gewählten Kunden — der Server prüft die Zuordnung erneut.
  const projects = useProjects(workspaceId, { customerId, pageSize: 100 });

  const form = useForm<RequestFormValues, unknown, RequestInput>({
    resolver: zodResolver(requestInputSchema),
    defaultValues: { customerId, subject: '', body: '', priority: 'normal', projectId: '' },
  });

  const errors = form.formState.errors;
  const message =
    error instanceof ApiRequestError
      ? error.message
      : error
        ? 'Speichern derzeit nicht möglich. Bitte später erneut versuchen.'
        : null;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit((values) =>
        onSubmit({ ...values, projectId: values.projectId || null }),
      )}
    >
      {message && (
        <p
          role="alert"
          className="rounded-sm border border-line bg-raised px-3 py-2.5 text-sm text-danger"
        >
          {message}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="anfrage-kunde" className="text-sm font-medium">
          Kunde
        </label>
        <select
          id="anfrage-kunde"
          {...form.register('customerId', {
            onChange: (event: { target: { value: string } }) => {
              setCustomerId(event.target.value);
              form.setValue('projectId', '');
            },
          })}
          className="min-h-11 w-full rounded-sm border border-line bg-bg px-3 text-base text-ink outline-none focus-visible:border-accent"
        >
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        {errors.customerId && <p className="text-sm text-danger">{errors.customerId.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="anfrage-projekt" className="text-sm font-medium">
          Projekt
        </label>
        <select
          id="anfrage-projekt"
          {...form.register('projectId')}
          className="min-h-11 w-full rounded-sm border border-line bg-bg px-3 text-base text-ink outline-none focus-visible:border-accent"
        >
          <option value="">Ohne Projekt</option>
          {(projects.data?.data ?? []).map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <TextField
        id="anfrage-betreff"
        label="Betreff"
        error={errors.subject?.message}
        {...form.register('subject')}
      />
      <TextAreaField
        id="anfrage-text"
        label="Nachricht"
        rows={5}
        error={errors.body?.message}
        {...form.register('body')}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="anfrage-prio" className="text-sm font-medium">
          Priorität
        </label>
        <select
          id="anfrage-prio"
          {...form.register('priority')}
          className="min-h-11 w-full rounded-sm border border-line bg-bg px-3 text-base text-ink outline-none focus-visible:border-accent"
        >
          <option value="normal">Normal</option>
          <option value="high">Hoch</option>
        </select>
      </div>

      <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'Wird angelegt …' : 'Anfrage anlegen'}
        </Button>
      </div>
    </form>
  );
}
