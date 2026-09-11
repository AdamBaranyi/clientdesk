import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ClientComment,
  ClientContract,
  ClientDocument,
  ClientProject,
  ClientRequest,
  ClientRequestInput,
  PortalOverview,
} from '@tallyroom/contracts';
import { apiRequest } from '../../lib/api.ts';

const key = (workspaceId: string) => ['portal', workspaceId] as const;
const base = (workspaceId: string) => `/portal/${workspaceId}`;

export function usePortalOverview(workspaceId: string) {
  return useQuery({
    queryKey: [...key(workspaceId), 'overview'],
    queryFn: () => apiRequest<PortalOverview>(`${base(workspaceId)}/overview`),
  });
}

export function usePortalProjects(workspaceId: string) {
  return useQuery({
    queryKey: [...key(workspaceId), 'projects'],
    queryFn: async () =>
      (await apiRequest<{ data: ClientProject[] }>(`${base(workspaceId)}/projects`)).data,
  });
}

export function usePortalContracts(workspaceId: string) {
  return useQuery({
    queryKey: [...key(workspaceId), 'contracts'],
    queryFn: async () =>
      (await apiRequest<{ data: ClientContract[] }>(`${base(workspaceId)}/contracts`)).data,
  });
}

export function usePortalRequests(workspaceId: string) {
  return useQuery({
    queryKey: [...key(workspaceId), 'requests'],
    queryFn: async () =>
      (await apiRequest<{ data: ClientRequest[] }>(`${base(workspaceId)}/requests`)).data,
  });
}

export function usePortalRequest(workspaceId: string, requestId: string | undefined) {
  return useQuery({
    queryKey: [...key(workspaceId), 'request', requestId],
    enabled: Boolean(requestId),
    queryFn: () =>
      apiRequest<{ request: ClientRequest; comments: ClientComment[] }>(
        `${base(workspaceId)}/requests/${requestId as string}`,
      ),
  });
}

/** Die zulässige Projektliste kommt vom Server, nicht aus der Oberfläche. */
export function useAssignableProjects(workspaceId: string) {
  return useQuery({
    queryKey: [...key(workspaceId), 'assignable-projects'],
    queryFn: async () =>
      (
        await apiRequest<{ data: { id: string; name: string }[] }>(
          `${base(workspaceId)}/requests/assignable-projects`,
        )
      ).data,
  });
}

export function usePortalDocuments(workspaceId: string) {
  return useQuery({
    queryKey: [...key(workspaceId), 'documents'],
    queryFn: async () =>
      (await apiRequest<{ data: ClientDocument[] }>(`${base(workspaceId)}/documents`)).data,
  });
}

function useInvalidate(workspaceId: string) {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: key(workspaceId) });
}

export function useCreatePortalRequest(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (args: { input: ClientRequestInput; idempotencyKey: string }) =>
      apiRequest<ClientRequest>(`${base(workspaceId)}/requests`, {
        method: 'POST',
        body: args.input,
        idempotencyKey: args.idempotencyKey,
      }),
    onSuccess: invalidate,
  });
}

export function useAddPortalComment(workspaceId: string, requestId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (body: string) =>
      apiRequest<{ request: ClientRequest; comments: ClientComment[] }>(
        `${base(workspaceId)}/requests/${requestId}/comments`,
        { method: 'POST', body: { body } },
      ),
    onSuccess: invalidate,
  });
}

export function portalDownloadUrl(workspaceId: string, documentId: string): string {
  return `/api/v1/portal/${workspaceId}/documents/${documentId}/download`;
}
