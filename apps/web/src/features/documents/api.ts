import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TallyroomDocument, DocumentListQuery } from '@tallyroom/contracts';
import { apiRequest } from '../../lib/api.ts';

const key = (workspaceId: string) => ['documents', workspaceId] as const;

export function useDocuments(workspaceId: string, query: DocumentListQuery = {}) {
  return useQuery({
    queryKey: [...key(workspaceId), query],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (query.customerId) search.set('customerId', query.customerId);
      if (query.projectId) search.set('projectId', query.projectId);
      const suffix = search.toString() ? `?${search.toString()}` : '';
      return (
        await apiRequest<{ data: TallyroomDocument[] }>(
          `/workspaces/${workspaceId}/documents${suffix}`,
        )
      ).data;
    },
  });
}

function useInvalidate(workspaceId: string) {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: key(workspaceId) });
}

export function useUploadDocument(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: async (args: { file: File; customerId: string; projectId?: string }) => {
      const search = new URLSearchParams({
        customerId: args.customerId,
        filename: args.file.name,
      });
      if (args.projectId) search.set('projectId', args.projectId);

      // Rohes PDF im Body statt Multipart — dasselbe Format erwartet die API.
      return apiRequest<TallyroomDocument>(
        `/workspaces/${workspaceId}/documents?${search.toString()}`,
        {
          method: 'POST',
          rawBody: await args.file.arrayBuffer(),
          contentType: 'application/pdf',
        },
      );
    },
    onSuccess: invalidate,
  });
}

/** In der Demo der einzige Weg, ein Dokument anzulegen. */
export function useAddSampleDocument(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (customerId: string) =>
      apiRequest<TallyroomDocument>(
        `/workspaces/${workspaceId}/documents/sample?customerId=${customerId}`,
        { method: 'POST' },
      ),
    onSuccess: invalidate,
  });
}

export function useSetDocumentVisibility(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (args: { documentId: string; clientVisible: boolean }) =>
      apiRequest<TallyroomDocument>(
        `/workspaces/${workspaceId}/documents/${args.documentId}/visibility`,
        {
          method: 'PATCH',
          body: { clientVisible: args.clientVisible },
        },
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteDocument(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (documentId: string) =>
      apiRequest<void>(`/workspaces/${workspaceId}/documents/${documentId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

/** Der Download läuft über die autorisierte API, nicht über eine Speicher-URL. */
export function documentDownloadUrl(workspaceId: string, documentId: string): string {
  return `/api/v1/workspaces/${workspaceId}/documents/${documentId}/download`;
}
