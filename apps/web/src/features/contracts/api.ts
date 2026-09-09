import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ContractInput,
  ContractListQuery,
  ContractRate,
  ContractUpdate,
  Dashboard,
  ListResponse,
  RateInput,
  ServiceContract,
} from '@clientdesk/contracts';
import { apiRequest } from '../../lib/api.ts';

interface ListParams extends Partial<ContractListQuery> {
  page?: number;
  pageSize?: number;
}

function toSearchParams(params: ListParams): string {
  const search = new URLSearchParams();
  if (params.search) search.set('search', params.search);
  if (params.customerId) search.set('customerId', params.customerId);
  if (params.status) search.set('status', params.status);
  if (params.onDate) search.set('onDate', params.onDate);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  const query = search.toString();
  return query ? `?${query}` : '';
}

const key = (workspaceId: string) => ['contracts', workspaceId] as const;

export function useContracts(workspaceId: string, params: ListParams) {
  return useQuery({
    queryKey: [...key(workspaceId), params],
    queryFn: () =>
      apiRequest<ListResponse<ServiceContract>>(
        `/workspaces/${workspaceId}/contracts${toSearchParams(params)}`,
      ),
  });
}

export function useContract(workspaceId: string, contractId: string | undefined) {
  return useQuery({
    queryKey: [...key(workspaceId), 'detail', contractId],
    enabled: Boolean(contractId),
    queryFn: () =>
      apiRequest<ServiceContract>(`/workspaces/${workspaceId}/contracts/${contractId as string}`),
  });
}

export function useRates(workspaceId: string, contractId: string | undefined) {
  return useQuery({
    queryKey: [...key(workspaceId), 'rates', contractId],
    enabled: Boolean(contractId),
    queryFn: async () =>
      (
        await apiRequest<{ data: ContractRate[] }>(
          `/workspaces/${workspaceId}/contracts/${contractId as string}/rates`,
        )
      ).data,
  });
}

/** Eine Vertragsänderung verschiebt die Kennzahlen, deshalb auch das Dashboard. */
function useInvalidate(workspaceId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: key(workspaceId) });
    void queryClient.invalidateQueries({ queryKey: ['dashboard', workspaceId] });
  };
}

export function useCreateContract(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: ContractInput) =>
      apiRequest<ServiceContract>(`/workspaces/${workspaceId}/contracts`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateContract(workspaceId: string, contractId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: ContractUpdate) =>
      apiRequest<ServiceContract>(`/workspaces/${workspaceId}/contracts/${contractId}`, {
        method: 'PATCH',
        body: input,
      }),
    onSuccess: invalidate,
  });
}

export function useAddRate(workspaceId: string, contractId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: RateInput) =>
      apiRequest<{ data: ContractRate[] }>(
        `/workspaces/${workspaceId}/contracts/${contractId}/rates`,
        { method: 'POST', body: input },
      ),
    onSuccess: invalidate,
  });
}

export function useDashboard(workspaceId: string, contractDate?: string) {
  return useQuery({
    queryKey: ['dashboard', workspaceId, contractDate ?? 'heute'] as const,
    queryFn: () =>
      apiRequest<Dashboard>(
        `/workspaces/${workspaceId}/dashboard${contractDate ? `?contractDate=${contractDate}` : ''}`,
      ),
  });
}
