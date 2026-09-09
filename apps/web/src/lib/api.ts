import { apiErrorSchema, type ApiError, type ErrorCode } from '@clientdesk/contracts';

const BASE = '/api/v1';

/** Fehler mit Code aus der API. Die Oberfläche schaltet auf den Code. */
export class ApiRequestError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fieldErrors: Record<string, string[]> | undefined;
  readonly requestId: string;

  constructor(status: number, payload: ApiError['error']) {
    super(payload.message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = payload.code;
    this.fieldErrors = payload.fieldErrors;
    this.requestId = payload.requestId;
  }
}

let csrfToken: string | null = null;

/**
 * Das CSRF-Token hängt an der Sitzung und wird einmal geholt. Nach Anmeldung
 * oder Abmeldung rotiert die Sitzung, deshalb wird es dort verworfen.
 */
async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const response = await fetch(`${BASE}/auth/csrf`, { credentials: 'same-origin' });
  if (!response.ok) throw new Error('CSRF-Token konnte nicht geladen werden.');
  const body: unknown = await response.json();
  const token = (body as { csrfToken?: unknown }).csrfToken;
  if (typeof token !== 'string') throw new Error('CSRF-Antwort hat ein unerwartetes Format.');
  csrfToken = token;
  return token;
}

export function resetCsrfToken(): void {
  csrfToken = null;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Schützt gegen doppelt abgeschickte Formulare. */
  idempotencyKey?: string;
  /** Für Uploads: roher Inhalt statt JSON. */
  rawBody?: BodyInit;
  contentType?: string;
}

async function toError(response: Response): Promise<ApiRequestError> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }
  const parsed = apiErrorSchema.safeParse(payload);
  if (parsed.success) return new ApiRequestError(response.status, parsed.data.error);
  return new ApiRequestError(response.status, {
    code: 'INTERNAL',
    message: 'Unerwartete Antwort vom Server.',
    requestId: response.headers.get('X-Request-Id') ?? 'unbekannt',
  });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {};

  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.contentType) headers['Content-Type'] = options.contentType;
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
  if (method !== 'GET') headers['X-CSRF-Token'] = await getCsrfToken();

  const body =
    options.rawBody ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined);

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    ...(body !== undefined ? { body } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  });

  if (!response.ok) throw await toError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
