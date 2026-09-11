import type { Localized } from './i18n.ts';

/**
 * Prüfmeldungen, die in mehreren Schemas vorkommen. Einmalige stehen direkt
 * am Schema. Aufgelöst wird erst beim Prüfen, siehe `localized` in i18n.ts.
 */
export const VALIDATION = {
  isoDate: { de: 'Datum im Format JJJJ-MM-TT erwartet', en: 'Expected a date as YYYY-MM-DD' },
  nameRequired: { de: 'Name ist erforderlich', en: 'Name is required' },
  invalidEmail: { de: 'Keine gültige E-Mail-Adresse', en: 'Not a valid email address' },
  subjectRequired: { de: 'Betreff ist erforderlich', en: 'Subject is required' },
  messageRequired: { de: 'Nachricht ist erforderlich', en: 'Message is required' },
} satisfies Record<string, Localized>;
