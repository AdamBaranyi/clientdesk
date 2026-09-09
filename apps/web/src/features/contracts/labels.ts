import type { ContractVisibleStatus } from '@clientdesk/contracts';

export const CONTRACT_STATUS_LABELS: Record<ContractVisibleStatus, string> = {
  draft: 'Entwurf',
  planned: 'Geplant',
  active: 'Aktiv',
  ended: 'Beendet',
};
