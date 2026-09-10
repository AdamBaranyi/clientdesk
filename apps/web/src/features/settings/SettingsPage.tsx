import { useState } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import {
  MEMBERSHIP_ROLES,
  type CreatedInvitation,
  type MembershipRole,
  type WorkspaceSummary,
} from '@clientdesk/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { TextField } from '../../components/base/Field.tsx';
import { ApiRequestError } from '../../lib/api.ts';
import { formatDate } from '../../lib/format.ts';
import { useCustomers } from '../customers/api.ts';
import { useCreateInvitation, useInvitations, useRevokeInvitation } from './api.ts';

const ROLE_LABELS: Record<MembershipRole, string> = {
  owner: 'Owner — verwaltet Workspace und Mitgliedschaften',
  member: 'Mitglied — arbeitet an Kunden, Projekten und Anfragen',
  client: 'Kundenzugang — sieht nur freigegebene Inhalte eines Kunden',
};

export function SettingsPage({ workspace }: { workspace: WorkspaceSummary }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MembershipRole>('member');
  const [customerId, setCustomerId] = useState('');
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const [copied, setCopied] = useState(false);

  const invitations = useInvitations(workspace.id);
  const customers = useCustomers(workspace.id, { status: 'active', pageSize: 100 });
  const create = useCreateInvitation(workspace.id);
  const revoke = useRevokeInvitation(workspace.id);

  const available = customers.data?.data ?? [];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    create.mutate(
      { email, role, customerId: role === 'client' ? customerId || null : null },
      {
        onSuccess: (invitation) => {
          setCreated(invitation);
          setCopied(false);
          setEmail('');
        },
      },
    );
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Kein Zugriff auf die Zwischenablage: der Link steht daneben zum Markieren.
      setCopied(false);
    }
  }

  const message =
    create.error instanceof ApiRequestError
      ? create.error.message
      : create.error
        ? 'Die Einladung konnte nicht erstellt werden.'
        : null;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Einstellungen</h1>
        <p className="mt-1 text-sm text-muted">
          {workspace.name} · Zeitzone {workspace.timezone} · Währung {workspace.currency}
        </p>
      </div>

      <Card>
        <CardHeader
          title="Einladen"
          action={
            <span className="text-xs text-muted">Der Link gilt sieben Tage und genau einmal</span>
          }
        />
        <form onSubmit={submit} className="flex flex-col gap-4 px-4 pb-5 sm:px-5">
          {message && (
            <p
              role="alert"
              className="rounded-sm border border-line bg-raised px-3 py-2.5 text-sm text-danger"
            >
              {message}
            </p>
          )}

          <TextField
            id="einladung-email"
            label="E-Mail"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="einladung-rolle" className="text-sm font-medium">
              Rolle
            </label>
            <select
              id="einladung-rolle"
              value={role}
              onChange={(event) => setRole(event.target.value as MembershipRole)}
              className="text-body min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-ink"
            >
              {MEMBERSHIP_ROLES.map((option) => (
                <option key={option} value={option}>
                  {ROLE_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          {role === 'client' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="einladung-kunde" className="text-sm font-medium">
                Zugeordneter Kunde
              </label>
              <select
                id="einladung-kunde"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                className="text-body min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-ink"
              >
                <option value="">Bitte wählen</option>
                {available.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">
                Ein Kundenzugang sieht ausschliesslich freigegebene Inhalte dieses einen Kunden.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={create.isPending || email.trim() === ''}
            >
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
              {create.isPending ? 'Wird erstellt …' : 'Einladung erstellen'}
            </Button>
          </div>
        </form>

        {created && (
          <div className="border-t border-line-soft bg-raised px-4 py-4 sm:px-5">
            <p className="text-sm font-medium">Link für {created.email}</p>
            <p className="mt-1 text-xs text-muted">
              Dieser Link wird nur jetzt angezeigt. Gespeichert ist nur sein Hash — er lässt sich
              später nicht erneut aufrufen.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <code className="min-w-0 flex-1 overflow-x-auto rounded-sm border border-line bg-surface px-3 py-2.5 font-mono text-xs">
                {created.inviteUrl}
              </code>
              <Button onClick={() => void copyLink(created.inviteUrl)}>
                <Copy size={15} strokeWidth={1.8} aria-hidden="true" />
                {copied ? 'Kopiert' : 'Kopieren'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Offene Einladungen" />
        {invitations.isPending && <LoadingState label="Einladungen werden geladen …" />}
        {invitations.isError && (
          <ErrorState detail="Die Einladungen konnten nicht geladen werden." />
        )}
        {invitations.data?.length === 0 && (
          <EmptyState
            title="Keine Einladungen"
            detail="Erstellte Einladungen erscheinen hier, bis sie angenommen werden oder ablaufen."
          />
        )}

        <ul className="flex flex-col">
          {(invitations.data ?? []).map((invitation) => (
            <li
              key={invitation.id}
              className="flex flex-col gap-2 border-t border-line-soft px-4 py-4 sm:flex-row sm:items-center sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium break-words">{invitation.email}</p>
                <p className="mt-1 text-xs text-muted">
                  {invitation.role === 'client'
                    ? `Kundenzugang · ${invitation.customerName ?? 'unbekannt'}`
                    : invitation.role === 'owner'
                      ? 'Owner'
                      : 'Mitglied'}
                  {' · '}
                  {invitation.acceptedAt
                    ? `angenommen am ${formatDate(invitation.acceptedAt.slice(0, 10))}`
                    : `gültig bis ${formatDate(invitation.expiresAt.slice(0, 10))}`}
                </p>
              </div>
              {!invitation.acceptedAt && (
                <Button
                  variant="danger"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(invitation.id)}
                >
                  <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
                  <span className="sr-only">Einladung für {invitation.email} zurückziehen</span>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
