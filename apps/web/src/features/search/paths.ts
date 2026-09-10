import type { SearchHit } from '@clientdesk/contracts';
import { workspacePath } from '../../lib/paths.ts';

const SEGMENT: Record<SearchHit['kind'], string> = {
  customer: 'customers',
  project: 'projects',
  contract: 'contracts',
  request: 'requests',
};

export const KIND_LABEL: Record<SearchHit['kind'], string> = {
  customer: 'Kunde',
  project: 'Projekt',
  contract: 'Vertrag',
  request: 'Anfrage',
};

export function hitPath(workspaceId: string, hit: SearchHit): string {
  return workspacePath(workspaceId, SEGMENT[hit.kind], hit.id);
}
