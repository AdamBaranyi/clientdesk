import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  sessionUserSchema,
  type ChangePasswordInput,
  type LoginInput,
  type SessionUser,
} from '@tallyroom/contracts';
import { apiRequest, ApiRequestError, resetCsrfToken } from '../../lib/api.ts';

const SESSION_KEY = ['session'] as const;

/** Ohne Anmeldung antwortet die API mit null, nicht mit einem Fehler. */
export function useSession() {
  return useQuery<SessionUser | null>({
    queryKey: SESSION_KEY,
    retry: false,
    staleTime: 30_000,
    queryFn: async () => sessionUserSchema.nullable().parse(await apiRequest<unknown>('/auth/me')),
  });
}

/**
 * Läuft eine Sitzung ab, während jemand arbeitet, antwortet die nächste
 * Anfrage mit 401. Ohne diese Stelle stünde dann auf der Seite nur
 * „Konnte nicht geladen werden", obwohl schlicht die Anmeldung fehlt. So wird
 * die Sitzung als beendet markiert, und die Routen schicken zur Anmeldung.
 *
 * Nur wenn vorher jemand angemeldet war: ein 401 bei einem falschen Passwort
 * ist keine abgelaufene Sitzung.
 */
export function endSessionOnUnauthenticated(queryClient: QueryClient, error: unknown): void {
  if (!(error instanceof ApiRequestError) || error.code !== 'UNAUTHENTICATED') return;
  if (!queryClient.getQueryData<SessionUser | null>(SESSION_KEY)) return;
  resetCsrfToken();
  queryClient.setQueryData(SESSION_KEY, null);
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

/**
 * Nach dem Abmelden geht es zur Startseite, nicht zur Anmeldung: wer sich
 * abmeldet, will gehen, nicht sich gleich wieder anmelden. Aus einer Demo
 * heraus steht dort auch gleich «Demo starten». Wunsch des Betreibers.
 *
 * Mit vollständigem Neuladen, nicht mit navigate(). Leert man zuerst die
 * Sitzung, zeichnet die geschützte Seite noch einmal und schickt zur
 * Anmeldung, bevor der Sprung zur Startseite greift. Das Neuladen lässt
 * ausserdem nichts vom vorherigen Konto im Speicher — wie beim Rollenwechsel.
 */
export function useLogout() {
  return useMutation({
    mutationFn: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      resetCsrfToken();
      window.location.assign('/');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      apiRequest<void>('/auth/password', { method: 'POST', body: input }),
    // Die Sitzungs-ID rotiert dabei, das alte CSRF-Token gilt nicht mehr.
    onSuccess: () => resetCsrfToken(),
  });
}
