import { and, eq, sql } from 'drizzle-orm';
import { contractRates, serviceContracts, type Database } from '@tallyroom/db';
import type {
  ContractInput,
  ContractListQuery,
  ContractRate,
  ContractUpdate,
  ContractVisibleStatus,
  ListResponse,
  RateInput,
  ServiceContract,
} from '@tallyroom/contracts';
import { HttpError, notFound, validationFailed } from '../../lib/http-error.ts';
import { recordActivity } from '../../lib/activity.ts';
import type { DemoLimits } from '../demo/limits.ts';
import { todayInTimezone } from '../../lib/workspace-date.ts';
import type { ContractRepository } from './repository.ts';

interface Row {
  id: string;
  customerId: string;
  customerName: string;
  name: string;
  startDate: string;
  endDate: string | null;
  confirmationStatus: 'draft' | 'confirmed';
  publicDescription: string | null;
  internalNote: string | null;
  clientVisible: boolean;
  version: number;
  amountAtDateMinor: number | null;
}

/**
 * Der sichtbare Zustand ist abgeleitet, nicht gespeichert. Das Enddatum ist
 * exklusiv: am Enddatum selbst gilt der Vertrag bereits als beendet.
 */
export function deriveVisibleStatus(row: Row, onDate: string): ContractVisibleStatus {
  if (row.confirmationStatus === 'draft') return 'draft';
  if (row.startDate > onDate) return 'planned';
  if (row.endDate !== null && row.endDate <= onDate) return 'ended';
  return 'active';
}

function toDto(row: Row, onDate: string): ServiceContract {
  return { ...row, visibleStatus: deriveVisibleStatus(row, onDate) };
}

function blankToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function createContractService(
  db: Database,
  repository: ContractRepository,
  demoLimits: DemoLimits,
) {
  async function requireContract(
    workspaceId: string,
    contractId: string,
    onDate: string,
  ): Promise<Row> {
    const row = await repository.findById(workspaceId, contractId, onDate);
    if (!row) throw notFound('Vertrag nicht gefunden.');
    return row as Row;
  }

  return {
    async list(
      workspaceId: string,
      timezone: string,
      query: ContractListQuery,
      page: { page: number; pageSize: number },
    ): Promise<ListResponse<ServiceContract>> {
      const onDate = query.onDate ?? todayInTimezone(timezone);
      const { rows, total } = await repository.list(workspaceId, query, onDate, {
        offset: (page.page - 1) * page.pageSize,
        limit: page.pageSize,
      });

      return {
        data: (rows as Row[]).map((row) => toDto(row, onDate)),
        pagination: {
          page: page.page,
          pageSize: page.pageSize,
          totalItems: total,
          totalPages: Math.max(1, Math.ceil(total / page.pageSize)),
        },
      };
    },

    async get(
      workspaceId: string,
      timezone: string,
      contractId: string,
      onDate?: string,
    ): Promise<ServiceContract> {
      const date = onDate ?? todayInTimezone(timezone);
      return toDto(await requireContract(workspaceId, contractId, date), date);
    },

    listRates(workspaceId: string, contractId: string): Promise<ContractRate[]> {
      return repository.listRates(workspaceId, contractId);
    },

    /**
     * Vertrag und erste Preisversion entstehen in einer Transaktion. Ein
     * bestätigter Vertrag ohne Preis würde in der Kennzahl stillschweigend
     * fehlen — das darf gar nicht erst entstehen können.
     */
    async create(
      workspaceId: string,
      timezone: string,
      actorId: string,
      input: ContractInput,
    ): Promise<ServiceContract> {
      await demoLimits.assertBelowLimit(workspaceId, 'contracts');

      const customer = await repository.findAssignableCustomer(workspaceId, input.customerId);
      if (!customer) {
        throw validationFailed('Kunde gehört nicht zu diesem Workspace.', {
          customerId: ['Unbekannter Kunde'],
        });
      }
      if (customer.archivedAt) {
        throw validationFailed('Für einen archivierten Kunden kann kein Vertrag entstehen.', {
          customerId: ['Kunde ist archiviert'],
        });
      }

      const id = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(serviceContracts)
          .values({
            workspaceId,
            customerId: input.customerId,
            name: input.name.trim(),
            startDate: input.startDate,
            endDate: input.endDate ?? null,
            confirmationStatus: input.confirmationStatus,
            publicDescription: blankToNull(input.publicDescription),
            internalNote: blankToNull(input.internalNote),
            clientVisible: input.clientVisible,
          })
          .returning({ id: serviceContracts.id, name: serviceContracts.name });

        if (!created) throw new HttpError('INTERNAL', 'Vertrag konnte nicht angelegt werden.');

        await tx.insert(contractRates).values({
          workspaceId,
          contractId: created.id,
          effectiveFrom: input.startDate,
          monthlyAmountMinor: input.monthlyAmountMinor,
        });

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'contract.created',
          entityType: 'contract',
          entityId: created.id,
          metadata: { name: created.name, customerId: input.customerId },
        });
        return created.id;
      });

      return this.get(workspaceId, timezone, id);
    },

    async update(
      workspaceId: string,
      timezone: string,
      actorId: string,
      contractId: string,
      input: ContractUpdate,
    ): Promise<ServiceContract> {
      const onDate = todayInTimezone(timezone);
      const existing = await requireContract(workspaceId, contractId, onDate);
      const { version, ...fields } = input;

      if (fields.endDate !== undefined && fields.endDate !== null) {
        if (fields.endDate <= existing.startDate) {
          throw validationFailed('Das Enddatum muss nach dem Beginn liegen.', {
            endDate: ['Liegt vor oder auf dem Vertragsbeginn'],
          });
        }
      }

      const changed = Object.keys(fields).filter(
        (key) => fields[key as keyof typeof fields] !== undefined,
      );
      if (changed.length === 0) return toDto(existing, onDate);

      await db.transaction(async (tx) => {
        const updated = await tx
          .update(serviceContracts)
          .set({
            ...(fields.name !== undefined ? { name: fields.name.trim() } : {}),
            ...(fields.endDate !== undefined ? { endDate: fields.endDate } : {}),
            ...(fields.confirmationStatus !== undefined
              ? { confirmationStatus: fields.confirmationStatus }
              : {}),
            ...(fields.publicDescription !== undefined
              ? { publicDescription: blankToNull(fields.publicDescription) }
              : {}),
            ...(fields.internalNote !== undefined
              ? { internalNote: blankToNull(fields.internalNote) }
              : {}),
            ...(fields.clientVisible !== undefined ? { clientVisible: fields.clientVisible } : {}),
            version: sql`${serviceContracts.version} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(serviceContracts.workspaceId, workspaceId),
              eq(serviceContracts.id, contractId),
              eq(serviceContracts.version, version),
            ),
          )
          .returning({ id: serviceContracts.id });

        if (updated.length === 0) {
          throw new HttpError(
            'VERSION_CONFLICT',
            'Der Vertrag wurde inzwischen von jemand anderem geändert. Bitte neu laden.',
          );
        }

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'contract.updated',
          entityType: 'contract',
          entityId: contractId,
          metadata: { changedFields: changed },
        });
      });

      return this.get(workspaceId, timezone, contractId);
    },

    /**
     * Eine Preisänderung entsteht als zusätzliche Version. Bestehende Versionen
     * bleiben unverändert, damit vergangene Monatswerte gleich bleiben.
     */
    async addRate(
      workspaceId: string,
      actorId: string,
      contractId: string,
      input: RateInput,
    ): Promise<ContractRate[]> {
      const existing = await requireContract(workspaceId, contractId, input.effectiveFrom);

      if (input.effectiveFrom < existing.startDate) {
        throw validationFailed('Die Preisversion kann nicht vor dem Vertragsbeginn gelten.', {
          effectiveFrom: ['Liegt vor dem Vertragsbeginn'],
        });
      }
      if (existing.endDate !== null && input.effectiveFrom >= existing.endDate) {
        throw validationFailed('Die Preisversion läge nach dem Vertragsende.', {
          effectiveFrom: ['Liegt am oder nach dem Enddatum'],
        });
      }

      const rates = await repository.listRates(workspaceId, contractId);
      if (rates.some((rate) => rate.effectiveFrom === input.effectiveFrom)) {
        throw validationFailed('Für dieses Datum gibt es bereits eine Preisversion.', {
          effectiveFrom: ['Datum ist bereits belegt'],
        });
      }

      await db.transaction(async (tx) => {
        await tx.insert(contractRates).values({
          workspaceId,
          contractId,
          effectiveFrom: input.effectiveFrom,
          monthlyAmountMinor: input.monthlyAmountMinor,
        });

        await recordActivity(tx, {
          workspaceId,
          actorId,
          action: 'contract.rate_added',
          entityType: 'contract',
          entityId: contractId,
          metadata: { effectiveFrom: input.effectiveFrom },
        });
      });

      return repository.listRates(workspaceId, contractId);
    },
  };
}

export type ContractService = ReturnType<typeof createContractService>;
