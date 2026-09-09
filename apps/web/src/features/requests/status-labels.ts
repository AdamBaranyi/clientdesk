import type { RequestStatus } from '@clientdesk/contracts';

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  open: 'Offen',
  in_progress: 'In Arbeit',
  waiting_customer: 'Wartet auf Kunde',
  resolved: 'Erledigt',
};
