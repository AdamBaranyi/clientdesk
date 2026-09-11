import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ListResponse,
  Milestone,
  MilestoneInput,
  MilestoneUpdate,
  Project,
  ProjectInput,
  ProjectListQuery,
  ProjectUpdate,
} from '@tallyroom/contracts';
import { apiRequest } from '../../lib/api.ts';

interface ListParams extends Partial<ProjectListQuery> {
  page?: number;
  pageSize?: number;
}

function toSearchParams(params: ListParams): string {
  const search = new URLSearchParams();
  if (params.search) search.set('search', params.search);
  if (params.customerId) search.set('customerId', params.customerId);
  if (params.status) search.set('status', params.status);
  if (params.sort) search.set('sort', params.sort);
  if (params.direction) search.set('direction', params.direction);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  const query = search.toString();
  return query ? `?${query}` : '';
}

const key = (workspaceId: string) => ['projects', workspaceId] as const;

export function useProjects(workspaceId: string, params: ListParams) {
  return useQuery({
    queryKey: [...key(workspaceId), params],
    queryFn: () =>
      apiRequest<ListResponse<Project>>(
        `/workspaces/${workspaceId}/projects${toSearchParams(params)}`,
      ),
  });
}

export function useProject(workspaceId: string, projectId: string | undefined) {
  return useQuery({
    queryKey: [...key(workspaceId), 'detail', projectId],
    enabled: Boolean(projectId),
    queryFn: () =>
      apiRequest<Project>(`/workspaces/${workspaceId}/projects/${projectId as string}`),
  });
}

export function useMilestones(workspaceId: string, projectId: string | undefined) {
  return useQuery({
    queryKey: [...key(workspaceId), 'milestones', projectId],
    enabled: Boolean(projectId),
    queryFn: async () =>
      (
        await apiRequest<{ data: Milestone[] }>(
          `/workspaces/${workspaceId}/projects/${projectId as string}/milestones`,
        )
      ).data,
  });
}

function useInvalidate(workspaceId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: key(workspaceId) });
    void queryClient.invalidateQueries({ queryKey: ['customers', workspaceId] });
  };
}

export function useCreateProject(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: ProjectInput) =>
      apiRequest<Project>(`/workspaces/${workspaceId}/projects`, { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateProject(workspaceId: string, projectId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: ProjectUpdate) =>
      apiRequest<Project>(`/workspaces/${workspaceId}/projects/${projectId}`, {
        method: 'PATCH',
        body: input,
      }),
    onSuccess: invalidate,
  });
}

export function useAddMilestone(workspaceId: string, projectId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: MilestoneInput) =>
      apiRequest<{ data: Milestone[] }>(
        `/workspaces/${workspaceId}/projects/${projectId}/milestones`,
        { method: 'POST', body: input },
      ),
    onSuccess: invalidate,
  });
}

export function useUpdateMilestone(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (args: { milestoneId: string; input: MilestoneUpdate }) =>
      apiRequest<{ data: Milestone[] }>(
        `/workspaces/${workspaceId}/projects/milestones/${args.milestoneId}`,
        { method: 'PATCH', body: args.input },
      ),
    onSuccess: invalidate,
  });
}
