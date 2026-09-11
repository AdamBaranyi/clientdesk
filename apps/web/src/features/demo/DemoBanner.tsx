import { Clock, FlaskConical, Signpost, UserRound, Users } from 'lucide-react';
import type { WorkspaceSummary } from '@tallyroom/contracts';
import { workspacePath } from '../../lib/paths.ts';
import { portalPath } from '../../lib/portal-paths.ts';
import { useMessages } from '../../i18n/messages.ts';
import { tourMessages } from '../tour/messages.ts';
import { useTourRestart } from '../tour/tour-state.ts';
import { useDemoStatus, useSwitchIdentity } from './api.ts';
import { demoMessages } from './messages.ts';

/**
 * Die Demo ist als solche gekennzeichnet, überall und dauerhaft. Der
 * Rollenwechsel steht daneben — er wirkt nur innerhalb dieser einen Demo.
 */
export function DemoBanner({ workspace }: { workspace: WorkspaceSummary }) {
  const status = useDemoStatus(workspace.id, workspace.isDemo);
  const switchIdentity = useSwitchIdentity(workspace.id);
  const m = useMessages(demoMessages);
  const tour = useMessages(tourMessages);
  const restartTour = useTourRestart();

  /**
   * Nach dem Wechsel wird die Seite vollständig neu geladen, nicht nur
   * umgeleitet. Ein Rollenwechsel tauscht die Identität aus; ein Neuladen ist
   * der einzige Weg, bei dem garantiert nichts aus der vorherigen Ansicht
   * stehen bleibt — weder im Zwischenspeicher noch in den Komponenten.
   */
  function switchTo(userId: string, role: 'owner' | 'member' | 'client') {
    switchIdentity.mutate(userId, {
      onSuccess: () => {
        window.location.assign(
          role === 'client'
            ? portalPath(workspace.id, 'overview')
            : workspacePath(workspace.id, 'dashboard'),
        );
      },
    });
  }

  if (!workspace.isDemo || !status.data) return null;

  const team = status.data.identities.filter((entry) => entry.role !== 'client');
  const clients = status.data.identities.filter((entry) => entry.role === 'client');

  return (
    <div className="flex flex-col gap-3 border-b border-line bg-raised px-3 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body">
          <span className="font-condensed text-body inline-flex items-center gap-1.5 font-semibold tracking-[0.06em] uppercase">
            <FlaskConical size={14} strokeWidth={2} aria-hidden="true" />
            {m.label}
          </span>
          <span className="text-muted">{m.notice}</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-muted">
            <Clock size={12} strokeWidth={2} aria-hidden="true" />
            {m.minutesLeft(status.data.minutesLeft)}
          </span>
        </p>
        {/* Nur in der Teamansicht; im Kundenportal gibt es keinen Rundgang. */}
        {restartTour && (
          <button
            type="button"
            onClick={restartTour}
            data-tour="tour-restart"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-line px-2.5 text-body font-medium text-muted transition-colors hover:text-ink"
          >
            <Signpost size={13} strokeWidth={2} aria-hidden="true" />
            {tour.restart}
          </button>
        )}
      </div>

      <div data-tour="role-switch" className="flex flex-wrap items-center gap-2">
        <span className="text-body font-medium text-muted">{m.view}</span>
        {[...team, ...clients].map((identity) => (
          <button
            key={identity.userId}
            type="button"
            disabled={identity.current || switchIdentity.isPending}
            onClick={() => switchTo(identity.userId, identity.role)}
            aria-pressed={identity.current}
            className={[
              'inline-flex min-h-11 items-center gap-1.5 rounded-sm border px-2.5 text-body font-medium transition-colors',
              identity.current
                ? 'border-ink bg-surface text-ink'
                : 'border-line text-muted hover:text-ink',
            ].join(' ')}
          >
            {identity.role === 'client' ? (
              <UserRound size={13} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Users size={13} strokeWidth={2} aria-hidden="true" />
            )}
            {identity.role === 'client'
              ? m.client(identity.customerName ?? identity.displayName)
              : identity.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
