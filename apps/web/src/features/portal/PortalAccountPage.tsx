import type { WorkspaceSummary } from '@tallyroom/contracts';
import { useMessages } from '../../i18n/messages.ts';
import { ChangePasswordCard } from '../auth/ChangePasswordCard.tsx';
import { portalMessages } from './messages.ts';

/** Was ein Kundenzugang an seinem Konto selbst ändern kann: das Passwort. */
export function PortalAccountPage({ workspace }: { workspace: WorkspaceSummary }) {
  const m = useMessages(portalMessages).account;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.02em]">{m.title}</h1>
        <p className="mt-1 text-sm text-muted">{m.lead}</p>
      </div>
      <ChangePasswordCard isDemo={workspace.isDemo} />
    </div>
  );
}
