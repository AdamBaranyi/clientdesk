import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DemoStatus } from '@clientdesk/contracts';
import { apiRequest, resetCsrfToken } from '../../lib/api.ts';

export function useStartDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiRequest<{ workspaceId: string; expiresAt: string }>('/demo/sessions', {
        method: 'POST',
      }),
    onSuccess: async () => {
      // Die Sitzung wurde serverseitig neu erzeugt; das alte Token gilt nicht
      // mehr. Der Anmeldestatus muss neu geladen werden, bevor weitergeleitet
      // wird — sonst gilt der Besucher noch als abgemeldet und landet auf der
      // Anmeldeseite.
      resetCsrfToken();
      await queryClient.refetchQueries({ queryKey: ['session'] });
    },
  });
}

export function useDemoStatus(workspaceId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['demo', workspaceId],
    enabled,
    // Die verbleibende Zeit läuft ab; einmal pro Minute reicht dafür.
    refetchInterval: 60_000,
    queryFn: () => apiRequest<DemoStatus>(`/demo/${workspaceId}/status`),
  });
}

export function useSwitchIdentity(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiRequest<DemoStatus>(`/demo/${workspaceId}/switch`, {
        method: 'POST',
        body: { userId },
      }),
    onSuccess: () => {
      resetCsrfToken();
      queryClient.clear();
    },
  });
}
