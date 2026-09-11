import { useState } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import {
  MEMBERSHIP_ROLES,
  type CreatedInvitation,
  type MembershipRole,
  type WorkspaceSummary,
} from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { TextField } from '../../components/base/Field.tsx';
import { domainMessages } from '../../i18n/domain-messages.ts';
import { useMessages } from '../../i18n/messages.ts';
import { ApiRequestError } from '../../lib/api.ts';
import { formatDate } from '../../lib/format.ts';
import { useCustomers } from '../customers/api.ts';
import { useCreateInvitation, useInvitations, useRevokeInvitation } from './api.ts';
import { settingsMessages } from './messages.ts';

export function SettingsPage({ workspace }: { workspace: WorkspaceSummary }) {
  const m = useMessages(settingsMessages);
  const roleName = useMessages(domainMessages).role;
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
        ? m.invite.createFailed
        : null;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.02em]">{m.heading}</h1>
        <p className="mt-1 text-sm text-muted">
          {m.workspaceFacts(workspace.name, workspace.timezone, workspace.currency)}
        </p>
      </div>

      <Card>
        <CardHeader
          title={m.invite.title}
          action={<span className="text-xs text-muted">{m.invite.validity}</span>}
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
            label={m.invite.email}
            type="email"
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="einladung-rolle" className="text-sm font-medium">
              {m.invite.role}
            </label>
            <select
              id="einladung-rolle"
              value={role}
              onChange={(event) => setRole(event.target.value as MembershipRole)}
              className="text-body min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-ink"
            >
              {MEMBERSHIP_ROLES.map((option) => (
                <option key={option} value={option}>
                  {`${roleName[option]} — ${m.roleDescription[option]}`}
                </option>
              ))}
            </select>
          </div>

          {role === 'client' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="einladung-kunde" className="text-sm font-medium">
                {m.invite.customer}
              </label>
              <select
                id="einladung-kunde"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                className="text-body min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-ink"
              >
                <option value="">{m.invite.chooseCustomer}</option>
                {available.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">{m.invite.clientHint}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={create.isPending || email.trim() === ''}
            >
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
              {create.isPending ? m.invite.creating : m.invite.submit}
            </Button>
          </div>
        </form>

        {created && (
          <div className="border-t border-line-soft bg-raised px-4 py-4 sm:px-5">
            <p className="text-sm font-medium">{m.created.linkFor(created.email)}</p>
            <p className="mt-1 text-xs text-muted">{m.created.shownOnce}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <code className="min-w-0 flex-1 overflow-x-auto rounded-sm border border-line bg-surface px-3 py-2.5 font-mono text-xs">
                {created.inviteUrl}
              </code>
              <Button onClick={() => void copyLink(created.inviteUrl)}>
                <Copy size={15} strokeWidth={1.8} aria-hidden="true" />
                {copied ? m.created.copied : m.created.copy}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={m.list.title} />
        {invitations.isPending && <LoadingState label={m.list.loading} />}
        {invitations.isError && <ErrorState detail={m.list.loadFailed} />}
        {invitations.data?.length === 0 && (
          <EmptyState title={m.list.emptyTitle} detail={m.list.emptyDetail} />
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
                  {roleName[invitation.role]}
                  {invitation.role === 'client'
                    ? ` · ${invitation.customerName ?? m.list.unknownCustomer}`
                    : ''}
                  {' · '}
                  {invitation.acceptedAt
                    ? m.list.acceptedOn(formatDate(invitation.acceptedAt.slice(0, 10)))
                    : m.list.validUntil(formatDate(invitation.expiresAt.slice(0, 10)))}
                </p>
              </div>
              {!invitation.acceptedAt && (
                <Button
                  variant="danger"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(invitation.id)}
                >
                  <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
                  <span className="sr-only">{m.list.revoke(invitation.email)}</span>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
