import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ArchiveBlockers,
  Customer,
  CustomerInput,
  CustomerListQuery,
  CustomerUpdate,
  ListResponse,
} from '@clientdesk/contracts';
import { apiRequest } from '../../lib/api.ts';

interface ListParams extends Partial<CustomerListQuery> {
  page?: number;
  /** Für Auswahllisten, die alle Kunden auf einmal brauchen. */
  pageSize?: number;
}

function toSearchParams(params: ListParams): string {
  const search = new URLSearchParams();
  if (params.search) search.set('search', params.search);
  if (params.status) search.set('status', params.status);
  if (params.sort) search.set('sort', params.sort);
  if (params.direction) search.set('direction', params.direction);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  const query = search.toString();
  return query ? `?${query}` : '';
}

const key = (workspaceId: string) => ['customers', workspaceId] as const;

export function useCustomers(workspaceId: string, params: ListParams) {
  return useQuery({
    queryKey: [...key(workspaceId), params],
    queryFn: () =>
      apiRequest<ListResponse<Customer>>(
        `/workspaces/${workspaceId}/customers${toSearchParams(params)}`,
      ),
  });
}

export function useCustomer(workspaceId: string, customerId: string | undefined) {
  return useQuery({
    queryKey: [...key(workspaceId), 'detail', customerId],
    enabled: Boolean(customerId),
    queryFn: () =>
      apiRequest<Customer>(`/workspaces/${workspaceId}/customers/${customerId as string}`),
  });
}

export function useArchiveBlockers(workspaceId: string, customerId: string | undefined) {
  return useQuery({
    queryKey: [...key(workspaceId), 'blockers', customerId],
    enabled: Boolean(customerId),
    queryFn: () =>
      apiRequest<ArchiveBlockers>(
        `/workspaces/${workspaceId}/customers/${customerId as string}/archive-blockers`,
      ),
  });
}

/** Nach jeder Änderung wird die gesamte Kundenabfrage verworfen — die
 *  Projektzähler und Listen hängen daran. */
function useInvalidate(workspaceId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: key(workspaceId) });
    void queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
  };
}

export function useCreateCustomer(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: CustomerInput) =>
      apiRequest<Customer>(`/workspaces/${workspaceId}/customers`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateCustomer(workspaceId: string, customerId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: CustomerUpdate) =>
      apiRequest<Customer>(`/workspaces/${workspaceId}/customers/${customerId}`, {
        method: 'PATCH',
        body: input,
      }),
    onSuccess: invalidate,
  });
}

export function useArchiveCustomer(workspaceId: string, customerId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (action: 'archive' | 'restore') =>
      apiRequest<Customer>(`/workspaces/${workspaceId}/customers/${customerId}/${action}`, {
        method: 'POST',
      }),
    onSuccess: invalidate,
  });
}
