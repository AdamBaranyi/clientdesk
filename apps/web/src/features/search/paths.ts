import type { SearchHit } from '@tallyroom/contracts';
import { workspacePath } from '../../lib/paths.ts';

const SEGMENT: Record<SearchHit['kind'], string> = {
  customer: 'customers',
  project: 'projects',
  contract: 'contracts',
  request: 'requests',
};

export function hitPath(workspaceId: string, hit: SearchHit): string {
  return workspacePath(workspaceId, SEGMENT[hit.kind], hit.id);
}
