import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router';
import { loginSchema, type LoginInput } from '@tallyroom/contracts';
import { ApiRequestError } from '../../lib/api.ts';
import { ThemeToggle } from '../../components/base/ThemeToggle.tsx';
import { useLogin, useSession } from './use-session.ts';
import { Wordmark } from '../../components/base/Wordmark.tsx';
import { Button } from '../../components/base/Button.tsx';
import { CONTROL_BASE } from '../../components/base/control-style.ts';
import { SiteFooter } from '../legal/SiteFooter.tsx';

export function LoginPage() {
  const session = useSession();
  const login = useLogin();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (session.data) return <Navigate to="/app" replace />;

  const submitError = login.error;
  const message =
    submitError instanceof ApiRequestError
      ? submitError.message
      : submitError
        ? 'Anmeldung derzeit nicht möglich. Bitte später erneut versuchen.'
        : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-end justify-between gap-3 border-b border-line px-3 sm:px-6">
        <Wordmark name="Tallyroom" />
        <span className="pb-4">
          <ThemeToggle />
        </span>
      </div>

      <main className="flex flex-1 items-center justify-center px-3 py-6 sm:px-6">
        <div className="w-full max-w-[400px] border border-line bg-surface p-5 sm:p-7">
          <h1 className="text-xl font-semibold tracking-[-0.02em]">Anmelden</h1>
          <p className="mt-1.5 text-sm text-muted">
            Interne Konten werden über den Admin-Befehl eingerichtet.
          </p>

          <form
            noValidate
            className="mt-6 flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => login.mutate(values))}
          >
            {/* Eine allgemeine Meldung — sie verrät nicht, ob die E-Mail existiert. */}
            {message && (
              <p
                role="alert"
                className="rounded-sm border border-line bg-raised px-3 py-2.5 text-sm text-danger"
              >
                {message}
              </p>
            )}

            <Field
              label="E-Mail"
              type="email"
              autoComplete="username"
              error={form.formState.errors.email?.message}
              registration={form.register('email')}
            />
            <Field
              label="Passwort"
              type="password"
              autoComplete="current-password"
              error={form.formState.errors.password?.message}
              registration={form.register('password')}
            />

            <Button type="submit" variant="primary" disabled={login.isPending}>
              {login.isPending ? 'Wird geprüft …' : 'Anmelden'}
            </Button>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

interface FieldProps {
  label: string;
  type: 'email' | 'password';
  autoComplete: string;
  error: string | undefined;
  registration: ReturnType<ReturnType<typeof useForm<LoginInput>>['register']>;
}

function Field({ label, type, autoComplete, error, registration }: FieldProps) {
  const id = `feld-${registration.name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-dense font-medium">
        {label}
      </label>
      <input
        {...registration}
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-fehler` : undefined}
        className={`min-h-11 ${CONTROL_BASE}`}
      />
      {error && (
        <p id={`${id}-fehler`} className="text-dense text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
