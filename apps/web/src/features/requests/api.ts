import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CommentInput,
  ListResponse,
  RequestComment,
  RequestInput,
  RequestListQuery,
  RequestStatus,
  ServiceRequest,
} from '@tallyroom/contracts';
import { apiRequest } from '../../lib/api.ts';

interface ListParams extends Partial<RequestListQuery> {
  page?: number;
}

function toSearchParams(params: ListParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    if (key === 'page' && value === 1) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

const key = (workspaceId: string) => ['requests', workspaceId] as const;

export function useRequests(workspaceId: string, params: ListParams) {
  return useQuery({
    queryKey: [...key(workspaceId), params],
    queryFn: () =>
      apiRequest<ListResponse<ServiceRequest>>(
        `/workspaces/${workspaceId}/requests${toSearchParams(params)}`,
      ),
  });
}

export function useRequest(workspaceId: string, requestId: string | undefined) {
  return useQuery({
    queryKey: [...key(workspaceId), 'detail', requestId],
    enabled: Boolean(requestId),
    queryFn: () =>
      apiRequest<ServiceRequest>(`/workspaces/${workspaceId}/requests/${requestId as string}`),
  });
}

export function useRequestComments(workspaceId: string, requestId: string | undefined) {
  return useQuery({
    queryKey: [...key(workspaceId), 'comments', requestId],
    enabled: Boolean(requestId),
    queryFn: async () =>
      (
        await apiRequest<{ data: RequestComment[] }>(
          `/workspaces/${workspaceId}/requests/${requestId as string}/comments`,
        )
      ).data,
  });
}

function useInvalidate(workspaceId: string) {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: key(workspaceId) });
}

export function useCreateRequest(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (args: { input: RequestInput; idempotencyKey: string }) =>
      apiRequest<ServiceRequest>(`/workspaces/${workspaceId}/requests`, {
        method: 'POST',
        body: args.input,
        // Schützt gegen den Doppelklick: derselbe Schlüssel liefert dieselbe Anfrage.
        idempotencyKey: args.idempotencyKey,
      }),
    onSuccess: invalidate,
  });
}

export function useChangeRequestStatus(workspaceId: string, requestId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (args: { status: RequestStatus; version: number }) =>
      apiRequest<ServiceRequest>(`/workspaces/${workspaceId}/requests/${requestId}/status`, {
        method: 'POST',
        body: args,
      }),
    onSuccess: invalidate,
  });
}

export function useAddRequestComment(workspaceId: string, requestId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: CommentInput) =>
      apiRequest<{ data: RequestComment[] }>(
        `/workspaces/${workspaceId}/requests/${requestId}/comments`,
        { method: 'POST', body: input },
      ),
    onSuccess: invalidate,
  });
}
