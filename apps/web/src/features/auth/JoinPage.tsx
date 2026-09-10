import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import type { InvitationPreview } from '@clientdesk/contracts';
import { Button } from '../../components/base/Button.tsx';
import { TextField } from '../../components/base/Field.tsx';
import { ApiRequestError, apiRequest } from '../../lib/api.ts';
import { ThemeToggle } from '../../components/base/ThemeToggle.tsx';
import { Wordmark } from '../../components/base/Wordmark.tsx';

const ROLE_TEXT: Record<string, string> = {
  owner: 'als Owner',
  member: 'als Mitglied',
  client: 'als Kundenzugang',
};

/**
 * Einladung annehmen. Rolle und Kundenbezug stehen nicht zur Wahl — sie hängen
 * an der Einladung und werden hier nur angezeigt.
 */
export function JoinPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const preview = useQuery({
    queryKey: ['invitation', token],
    retry: false,
    queryFn: () => apiRequest<InvitationPreview>(`/invitations/${token as string}`),
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await apiRequest<{ workspaceId: string }>(`/invitations/${token}/accept`, {
        method: 'POST',
        body: { displayName: displayName || undefined, password },
      });
      const target = preview.data?.role === 'client' ? '/portal' : '/app';
      void navigate(`${target}/${result.workspaceId}`);
    } catch (caught) {
      setError(
        caught instanceof ApiRequestError
          ? caught.message
          : 'Die Einladung konnte nicht angenommen werden.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-end justify-between gap-3 border-b border-line px-3 sm:px-6">
        <Wordmark name="ClientDesk" />
        <span className="pb-4">
          <ThemeToggle />
        </span>
      </div>

      <main className="flex flex-1 items-center justify-center px-3 py-6 sm:px-6">
        <div className="w-full max-w-[440px] border border-line bg-surface p-5 sm:p-7">
          {preview.isPending && <p className="text-sm text-muted">Einladung wird geprüft …</p>}

          {preview.isError && (
            <>
              <h1 className="text-xl font-semibold tracking-[-0.02em]">Einladung ungültig</h1>
              <p className="mt-2 text-sm text-muted">
                Dieser Link ist abgelaufen, wurde bereits verwendet oder existiert nicht. Bitte um
                eine neue Einladung bitten.
              </p>
            </>
          )}

          {preview.data && (
            <>
              <h1 className="text-xl font-semibold tracking-[-0.02em]">
                Beitreten zu {preview.data.workspaceName}
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                Eingeladen {ROLE_TEXT[preview.data.role] ?? ''} als {preview.data.email}.
              </p>

              <form noValidate onSubmit={submit} className="mt-6 flex flex-col gap-4">
                {error && (
                  <p
                    role="alert"
                    className="rounded-md border border-line bg-raised px-3 py-2.5 text-sm text-danger"
                  >
                    {error}
                  </p>
                )}

                {preview.data.accountExists ? (
                  <p className="rounded-md border border-line bg-raised px-3 py-2.5 text-sm text-muted">
                    Zu dieser E-Mail gibt es bereits ein Konto. Melden Sie sich zuerst damit an und
                    öffnen Sie den Link erneut.
                  </p>
                ) : (
                  <>
                    <TextField
                      id="join-name"
                      label="Ihr Name"
                      autoComplete="name"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                    />
                    <TextField
                      id="join-passwort"
                      label="Passwort"
                      type="password"
                      autoComplete="new-password"
                      hint="Mindestens 12 Zeichen"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={pending || (!preview.data.accountExists && password.length < 12)}
                >
                  {pending ? 'Wird angenommen …' : 'Einladung annehmen'}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
