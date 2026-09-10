import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SearchResult } from '@clientdesk/contracts';
import { apiRequest } from '../../lib/api.ts';

/** Unter zwei Zeichen fragt die Palette gar nicht erst — der Server lehnt ab. */
export const MIN_TERM_LENGTH = 2;

export function useSearch(workspaceId: string, term: string) {
  const trimmed = term.trim();
  return useQuery({
    queryKey: ['search', workspaceId, trimmed],
    queryFn: () =>
      apiRequest<SearchResult>(
        `/workspaces/${workspaceId}/search?q=${encodeURIComponent(trimmed)}`,
      ),
    enabled: trimmed.length >= MIN_TERM_LENGTH,
    // Beim Weitertippen bleibt die vorige Trefferliste stehen, statt zu
    // verschwinden und wiederzukommen. Ohne das flackert die Palette bei
    // jedem Buchstaben.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
