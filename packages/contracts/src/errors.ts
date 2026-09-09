import { z } from 'zod';

/**
 * Fehlercodes der API. Die Oberfläche schaltet auf den Code, nicht auf den
 * Meldungstext — der ist für Menschen und darf sich ändern.
 */
export const ERROR_CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'VERSION_CONFLICT',
  'IDEMPOTENCY_CONFLICT',
  'RATE_LIMITED',
  'CSRF_FAILED',
  'INTERNAL',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    /** Feldbezogene Meldungen für Formulare, Schlüssel ist der Feldpfad. */
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    requestId: z.string(),
  }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

/** Zuordnung Fehlercode zu HTTP-Status. Einzige Quelle für beide Seiten. */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  VERSION_CONFLICT: 409,
  IDEMPOTENCY_CONFLICT: 409,
  RATE_LIMITED: 429,
  CSRF_FAILED: 403,
  INTERNAL: 500,
};
