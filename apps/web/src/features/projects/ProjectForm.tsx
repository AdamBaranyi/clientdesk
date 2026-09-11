import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  projectInputSchema,
  type Customer,
  type ProjectFormValues,
  type ProjectInput,
} from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { TextAreaField, TextField } from '../../components/base/Field.tsx';
import { ApiRequestError } from '../../lib/api.ts';
import { useMessages } from '../../i18n/messages.ts';
import { projectMessages } from './messages.ts';

interface Props {
  customers: Customer[];
  presetCustomerId?: string;
  pending: boolean;
  error: unknown;
  onSubmit: (values: ProjectInput) => void;
  onCancel: () => void;
}

/**
 * Die Kundenauswahl kommt vom Server und enthält nur nicht archivierte Kunden
 * dieses Workspace. Der Server prüft die Zuordnung beim Anlegen erneut.
 */
export function ProjectForm({
  customers,
  presetCustomerId,
  pending,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const form = useForm<ProjectFormValues, unknown, ProjectInput>({
    resolver: zodResolver(projectInputSchema),
    defaultValues: {
      customerId: presetCustomerId ?? customers[0]?.id ?? '',
      name: '',
      description: '',
      internalNote: '',
      startDate: new Date().toISOString().slice(0, 10),
      targetDate: '',
      clientVisible: false,
    },
  });

  const m = useMessages(projectMessages);
  const errors = form.formState.errors;
  const message =
    error instanceof ApiRequestError ? error.message : error ? m.form.saveFailed : null;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit((values) =>
        onSubmit({ ...values, targetDate: values.targetDate || null }),
      )}
    >
      {message && (
        <p
          role="alert"
          className="rounded-sm border border-line bg-raised px-3 py-2.5 text-body text-danger"
        >
          {message}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="projekt-kunde" className="text-body font-medium">
          {m.customer}
        </label>
        <select
          id="projekt-kunde"
          {...form.register('customerId')}
          className="text-body min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-ink"
        >
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        {errors.customerId && <p className="text-body text-danger">{errors.customerId.message}</p>}
      </div>

      <TextField
        id="projekt-name"
        label={m.form.name}
        error={errors.name?.message}
        {...form.register('name')}
      />
      <TextAreaField
        id="projekt-beschreibung"
        label={m.description}
        hint={m.form.descriptionHint}
        error={errors.description?.message}
        {...form.register('description')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="projekt-start"
          label={m.form.startDate}
          type="date"
          error={errors.startDate?.message}
          {...form.register('startDate')}
        />
        <TextField
          id="projekt-ziel"
          label={m.targetDate}
          type="date"
          hint={m.optional}
          error={errors.targetDate?.message}
          {...form.register('targetDate')}
        />
      </div>

      <TextAreaField
        id="projekt-notiz"
        label={m.internalNote}
        hint={m.form.internalNoteHint}
        error={errors.internalNote?.message}
        {...form.register('internalNote')}
      />

      <label className="flex items-start gap-3 text-body">
        <input
          type="checkbox"
          {...form.register('clientVisible')}
          className="mt-0.5 size-5 shrink-0 accent-[var(--action-bg)]"
        />
        <span>
          {m.form.clientVisible}
          <span className="mt-0.5 block text-body text-muted">{m.form.clientVisibleHint}</span>
        </span>
      </label>

      <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {m.cancel}
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? m.form.creating : m.createProject}
        </Button>
      </div>
    </form>
  );
}
