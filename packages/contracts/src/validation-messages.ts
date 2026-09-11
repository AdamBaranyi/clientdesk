import type { Localized } from './i18n.ts';

/**
 * Prüfmeldungen, die in mehreren Schemas vorkommen. Einmalige stehen direkt
 * am Schema. Aufgelöst wird erst beim Prüfen, siehe `localized` in i18n.ts.
 */
export const VALIDATION = {
  isoDate: {
    de: 'Datum im Format JJJJ-MM-TT erwartet',
    fr: 'Date attendue au format AAAA-MM-JJ',
    it: 'Data attesa nel formato AAAA-MM-GG',
    en: 'Expected a date as YYYY-MM-DD',
  },
  nameRequired: {
    de: 'Name ist erforderlich',
    fr: 'Le nom est obligatoire',
    it: 'Il nome è obbligatorio',
    en: 'Name is required',
  },
  invalidEmail: {
    de: 'Keine gültige E-Mail-Adresse',
    fr: 'Adresse e-mail non valide',
    it: 'Indirizzo e-mail non valido',
    en: 'Not a valid email address',
  },
  subjectRequired: {
    de: 'Betreff ist erforderlich',
    fr: "L'objet est obligatoire",
    it: "L'oggetto è obbligatorio",
    en: 'Subject is required',
  },
  messageRequired: {
    de: 'Nachricht ist erforderlich',
    fr: 'Le message est obligatoire',
    it: 'Il messaggio è obbligatorio',
    en: 'Message is required',
  },
} satisfies Record<string, Localized>;
