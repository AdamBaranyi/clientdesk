import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatedInvitation, Invitation, InvitationInput } from '@tallyroom/contracts';
import { apiRequest } from '../../lib/api.ts';

const key = (workspaceId: string) => ['invitations', workspaceId] as const;

export function useInvitations(workspaceId: string) {
  return useQuery({
    queryKey: key(workspaceId),
    queryFn: async () =>
      (await apiRequest<{ data: Invitation[] }>(`/workspaces/${workspaceId}/invitations`)).data,
  });
}

export function useCreateInvitation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InvitationInput) =>
      apiRequest<CreatedInvitation>(`/workspaces/${workspaceId}/invitations`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key(workspaceId) }),
  });
}

export function useRevokeInvitation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      apiRequest<void>(`/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key(workspaceId) }),
  });
}
