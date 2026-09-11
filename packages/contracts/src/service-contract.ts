import { z } from 'zod';
import { amountMinorSchema } from './money.ts';
import { localized } from './i18n.ts';
import { VALIDATION } from './validation-messages.ts';

export const CONTRACT_CONFIRMATION = ['draft', 'confirmed'] as const;
export type ContractConfirmation = (typeof CONTRACT_CONFIRMATION)[number];

/**
 * Abgeleiteter Zustand für einen Stichtag — nicht gespeichert, sondern aus
 * Freigabestatus und Gültigkeitsintervall berechnet.
 */
export const CONTRACT_VISIBLE_STATUS = ['draft', 'planned', 'active', 'ended'] as const;
export type ContractVisibleStatus = (typeof CONTRACT_VISIBLE_STATUS)[number];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, localized(VALIDATION.isoDate));

export const contractInputSchema = z
  .object({
    customerId: z.uuid(),
    name: z
      .string()
      .trim()
      .min(
        1,
        localized({
          de: 'Bezeichnung ist erforderlich',
          fr: 'La désignation est obligatoire',
          it: 'La denominazione è obbligatoria',
          en: 'Name is required',
        }),
      )
      .max(200),
    startDate: isoDate,
    /** Exklusiv: am Enddatum selbst zählt der Vertrag nicht mehr. */
    endDate: isoDate.nullish(),
    confirmationStatus: z.enum(CONTRACT_CONFIRMATION).default('draft'),
    publicDescription: z.string().trim().max(2000).nullish(),
    internalNote: z.string().trim().max(4000).nullish(),
    clientVisible: z.boolean().default(false),
    /**
     * Erste Preisversion, gültig ab Vertragsbeginn. Pflicht: ohne sie gäbe es
     * einen bestätigten Vertrag ohne Preis, und die Kennzahl würde ihn
     * stillschweigend als null zählen.
     */
    monthlyAmountMinor: amountMinorSchema,
  })
  .refine((value) => !value.endDate || value.endDate > value.startDate, {
    ...localized({
      de: 'Das Enddatum muss nach dem Beginn liegen',
      fr: 'La date de fin doit être postérieure au début',
      it: "La data di fine deve essere successiva all'inizio",
      en: 'The end date must be after the start',
    }),
    path: ['endDate'],
  });

export type ContractInput = z.infer<typeof contractInputSchema>;
export type ContractFormValues = z.input<typeof contractInputSchema>;

export const contractUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  endDate: isoDate.nullish(),
  confirmationStatus: z.enum(CONTRACT_CONFIRMATION).optional(),
  publicDescription: z.string().trim().max(2000).nullish(),
  internalNote: z.string().trim().max(4000).nullish(),
  clientVisible: z.boolean().optional(),
  version: z.number().int().min(1),
});

export type ContractUpdate = z.infer<typeof contractUpdateSchema>;

/** Eine Preisänderung entsteht als neue Version, nie durch Überschreiben. */
export const rateInputSchema = z.object({
  effectiveFrom: isoDate,
  monthlyAmountMinor: amountMinorSchema,
});

export type RateInput = z.infer<typeof rateInputSchema>;

export const contractRateSchema = z.object({
  id: z.uuid(),
  effectiveFrom: z.string(),
  monthlyAmountMinor: z.number().int(),
});

export type ContractRate = z.infer<typeof contractRateSchema>;

export const serviceContractSchema = z.object({
  id: z.uuid(),
  customerId: z.uuid(),
  customerName: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  confirmationStatus: z.enum(CONTRACT_CONFIRMATION),
  publicDescription: z.string().nullable(),
  internalNote: z.string().nullable(),
  clientVisible: z.boolean(),
  version: z.number().int(),
  /** Für den angefragten Stichtag abgeleitet. */
  visibleStatus: z.enum(CONTRACT_VISIBLE_STATUS),
  /** Gültiger Betrag am Stichtag; null, wenn dann keine Preisversion greift. */
  amountAtDateMinor: z.number().int().nullable(),
});

export type ServiceContract = z.infer<typeof serviceContractSchema>;

export const CONTRACT_SORT_FIELDS = ['name', 'customerName', 'startDate'] as const;
export type ContractSortField = (typeof CONTRACT_SORT_FIELDS)[number];

export const contractListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  customerId: z.uuid().optional(),
  status: z.enum(CONTRACT_VISIBLE_STATUS).optional(),
  /** Stichtag für abgeleiteten Status und Betrag. Standard ist heute. */
  onDate: isoDate.optional(),
  sort: z.enum(CONTRACT_SORT_FIELDS).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

export type ContractListQuery = z.infer<typeof contractListQuerySchema>;
