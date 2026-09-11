import { z } from 'zod';
import { localized } from './i18n.ts';
import { VALIDATION } from './validation-messages.ts';

/** Nur Name ist Pflicht. Keine angenommenen Adresspflichten. */
export const customerInputSchema = z.object({
  name: z.string().trim().min(1, localized(VALIDATION.nameRequired)).max(200),
  contactName: z.string().trim().max(200).nullish(),
  email: z.union([z.email(localized(VALIDATION.invalidEmail)), z.literal('')]).nullish(),
  phone: z.string().trim().max(60).nullish(),
  website: z
    .union([
      z.url(
        localized({
          de: 'Keine gültige URL',
          fr: 'URL non valide',
          it: 'URL non valido',
          en: 'Not a valid URL',
        }),
      ),
      z.literal(''),
    ])
    .nullish(),
  internalNote: z.string().trim().max(4000).nullish(),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;

/** Änderungen tragen die gelesene Version mit, damit 409 erkennbar wird. */
export const customerUpdateSchema = customerInputSchema.partial().extend({
  version: z.number().int().min(1),
});

export type CustomerUpdate = z.infer<typeof customerUpdateSchema>;

/** Sicht für interne Rollen. Enthält die interne Notiz. */
export const customerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  contactName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  internalNote: z.string().nullable(),
  archivedAt: z.string().nullable(),
  activeProjectCount: z.number().int(),
  version: z.number().int(),
  createdAt: z.string(),
});

export type Customer = z.infer<typeof customerSchema>;

export const CUSTOMER_SORT_FIELDS = ['name', 'createdAt', 'activeProjectCount'] as const;
export type CustomerSortField = (typeof CUSTOMER_SORT_FIELDS)[number];

export const CUSTOMER_STATUS_FILTERS = ['active', 'archived', 'all'] as const;
export type CustomerStatusFilter = (typeof CUSTOMER_STATUS_FILTERS)[number];

export const customerListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(CUSTOMER_STATUS_FILTERS).default('active'),
  sort: z.enum(CUSTOMER_SORT_FIELDS).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;

/**
 * Ein Kunde mit laufendem Projekt, aktivem Vertrag oder offener Anfrage kann
 * nicht archiviert werden. Der Server nennt die konkreten Gründe, damit die
 * Oberfläche nicht raten muss.
 */
export const archiveBlockerSchema = z.object({
  runningProjects: z.number().int(),
  activeContracts: z.number().int(),
  openRequests: z.number().int(),
});

export type ArchiveBlockers = z.infer<typeof archiveBlockerSchema>;
