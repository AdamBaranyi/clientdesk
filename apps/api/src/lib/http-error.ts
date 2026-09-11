import { ERROR_STATUS, type ErrorCode } from '@tallyroom/contracts';

export type FieldErrors = Record<string, string[]>;

/**
 * Einziger Weg, einen Fehler mit definiertem Code an den Client zu geben.
 * Alles andere landet als INTERNAL ohne Detailinformationen.
 */
export class HttpError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fieldErrors: FieldErrors | undefined;

  constructor(code: ErrorCode, message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = 'HttpError';
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.fieldErrors = fieldErrors;
  }
}

export const unauthenticated = (message = 'Nicht angemeldet.'): HttpError =>
  new HttpError('UNAUTHENTICATED', message);

export const forbidden = (message = 'Diese Aktion ist nicht erlaubt.'): HttpError =>
  new HttpError('FORBIDDEN', message);

/**
 * Fremde und unbekannte Objekte liefern beide 404. Ein 403 würde verraten,
 * dass die ID existiert.
 */
export const notFound = (message = 'Nicht gefunden.'): HttpError =>
  new HttpError('NOT_FOUND', message);

export const validationFailed = (message: string, fieldErrors?: FieldErrors): HttpError =>
  new HttpError('VALIDATION_FAILED', message, fieldErrors);
