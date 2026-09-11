import { useState } from 'react';
import { changePasswordSchema } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { TextField } from '../../components/base/Field.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { ApiRequestError } from '../../lib/api.ts';
import { authMessages } from './messages.ts';
import { useChangePassword } from './use-session.ts';

type FieldErrors = Partial<Record<'currentPassword' | 'newPassword', string>>;

/**
 * Für Team und Kundenzugang gleich. Geprüft wird zweimal mit demselben Schema:
 * hier, damit ein zu kurzes Passwort gar nicht erst abgeschickt wird, und auf
 * dem Server, der allein über das bisherige Passwort urteilt.
 */
export function ChangePasswordCard({ isDemo }: { isDemo: boolean }) {
  const m = useMessages(authMessages).password;
  const change = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setDone(false);
    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!parsed.success) {
      setErrors(firstErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    change.mutate(parsed.data, {
      onSuccess: () => {
        setDone(true);
        setCurrentPassword('');
        setNewPassword('');
      },
      onError: (error) => {
        if (error instanceof ApiRequestError && error.fieldErrors) {
          const fields = error.fieldErrors;
          setErrors(
            firstErrors(
              Object.entries(fields).flatMap(([path, messages]) =>
                messages.map((message) => ({ path: [path], message })),
              ),
            ),
          );
        }
      },
    });
  }

  const failure =
    change.error instanceof ApiRequestError && !change.error.fieldErrors
      ? change.error.message
      : change.error && !(change.error instanceof ApiRequestError)
        ? m.failed
        : null;

  return (
    <Card>
      <CardHeader title={m.title} />
      {isDemo ? (
        <p className="px-4 pb-5 text-body text-muted sm:px-5">{m.demo}</p>
      ) : (
        <form
          noValidate
          onSubmit={submit}
          className="flex max-w-[420px] flex-col gap-4 px-4 pb-5 sm:px-5"
        >
          {done && (
            <p role="status" className="text-body text-positive">
              {m.done}
            </p>
          )}
          {failure && (
            <p role="alert" className="text-body text-danger">
              {failure}
            </p>
          )}
          <TextField
            id="passwort-bisher"
            label={m.current}
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            error={errors.currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <TextField
            id="passwort-neu"
            label={m.next}
            type="password"
            autoComplete="new-password"
            hint={m.nextHint}
            value={newPassword}
            error={errors.newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={change.isPending}
            className="self-start"
          >
            {change.isPending ? m.saving : m.submit}
          </Button>
        </form>
      )}
    </Card>
  );
}

function firstErrors(issues: readonly { path: PropertyKey[]; message: string }[]): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if ((field === 'currentPassword' || field === 'newPassword') && !result[field]) {
      result[field] = issue.message;
    }
  }
  return result;
}
