import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionUserSchema, type LoginInput, type SessionUser } from '@tallyroom/contracts';
import { apiRequest, ApiRequestError, resetCsrfToken } from '../../lib/api.ts';

const SESSION_KEY = ['session'] as const;

/**
 * Ein 401 ist hier kein Fehlerzustand, sondern die Antwort „nicht angemeldet".
 * Deshalb wird er zu null und nicht an die Fehlergrenze weitergereicht.
 */
export function useSession() {
  return useQuery<SessionUser | null>({
    queryKey: SESSION_KEY,
    retry: false,
    staleTime: 30_000,
    queryFn: async () => {
      try {
        return sessionUserSchema.parse(await apiRequest<unknown>('/auth/me'));
      } catch (error) {
        if (error instanceof ApiRequestError && error.code === 'UNAUTHENTICATED') return null;
        throw error;
      }
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const payload = await apiRequest<unknown>('/auth/login', { method: 'POST', body: input });
      return sessionUserSchema.parse(payload);
    },
    onSuccess: (user) => {
      // Die Sitzung wurde serverseitig rotiert, das alte Token ist ungültig.
      resetCsrfToken();
      queryClient.setQueryData(SESSION_KEY, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      resetCsrfToken();
      queryClient.setQueryData(SESSION_KEY, null);
      void queryClient.invalidateQueries();
    },
  });
}
