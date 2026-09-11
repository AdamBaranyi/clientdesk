import {
  ERROR_STATUS,
  inCurrentLocale,
  type ErrorCode,
  type Localized,
} from '@tallyroom/contracts';

export type FieldErrors = Record<string, string[]>;
export type LocalizedFieldErrors = Record<string, Localized[]>;

/**
 * Einziger Weg, einen Fehler mit definiertem Code an den Client zu geben.
 * Alles andere landet als INTERNAL ohne Detailinformationen.
 *
 * Meldungen gibt es nur in allen Sprachen zugleich. Ein einzelner String wird
 * vom Compiler abgelehnt — sonst stünde irgendwann eine deutsche Meldung in
 * der englischen Oberfläche. Aufgelöst wird in der Sprache des Requests.
 */
export class HttpError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fieldErrors: FieldErrors | undefined;

  constructor(code: ErrorCode, message: Localized, fieldErrors?: LocalizedFieldErrors) {
    super(inCurrentLocale(message));
    this.name = 'HttpError';
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.fieldErrors = fieldErrors ? resolveFieldErrors(fieldErrors) : undefined;
  }
}

function resolveFieldErrors(fieldErrors: LocalizedFieldErrors): FieldErrors {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, messages]) => [field, messages.map(inCurrentLocale)]),
  );
}

export const unauthenticated = (
  message: Localized = {
    de: 'Nicht angemeldet.',
    fr: 'Non connecté.',
    it: 'Accesso non effettuato.',
    en: 'Not signed in.',
  },
): HttpError => new HttpError('UNAUTHENTICATED', message);

export const forbidden = (
  message: Localized = {
    de: 'Diese Aktion ist nicht erlaubt.',
    fr: "Cette action n'est pas autorisée.",
    it: 'Questa azione non è consentita.',
    en: 'This action is not allowed.',
  },
): HttpError => new HttpError('FORBIDDEN', message);

/**
 * Fremde und unbekannte Objekte liefern beide 404. Ein 403 würde verraten,
 * dass die ID existiert.
 */
export const notFound = (
  message: Localized = {
    de: 'Nicht gefunden.',
    fr: 'Introuvable.',
    it: 'Non trovato.',
    en: 'Not found.',
  },
): HttpError => new HttpError('NOT_FOUND', message);

export const validationFailed = (
  message: Localized,
  fieldErrors?: LocalizedFieldErrors,
): HttpError => new HttpError('VALIDATION_FAILED', message, fieldErrors);
