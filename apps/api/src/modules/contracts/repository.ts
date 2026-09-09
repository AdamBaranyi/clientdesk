import { and, asc, count, desc, eq, gt, ilike, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';
import type { Database } from '@clientdesk/db';
import { contractRates, customers, serviceContracts } from '@clientdesk/db';
import type { ContractListQuery, ContractVisibleStatus } from '@clientdesk/contracts';

/**
 * Der am Stichtag gültige Betrag: letzte Preisversion mit
 * effective_from <= D. „Letzte Zeile je Gruppe" lässt sich im Query-Builder
 * nicht ohne Umweg ausdrücken, deshalb ein sql-Template.
 *
 * Die Referenz auf die äussere Tabelle steht ausgeschrieben als
 * "service_contracts"."id" und nicht als eingesetzte Spalte: in einem
 * sql-Template rendert Drizzle Spalten je nach Abfrageform unqualifiziert,
 * und die Bedingung bände sich dann still an contract_rates statt an den
 * Vertrag. Die Abfrage wäre nicht falsch, sondern lautlos leer.
 */
function amountAtDate(onDate: string) {
  return sql<number | null>`(
    SELECT r.monthly_amount_minor
    FROM contract_rates AS r
    WHERE r.contract_id = "service_contracts"."id"
      AND r.effective_from <= ${onDate}::date
    ORDER BY r.effective_from DESC
    LIMIT 1
  )`;
}

/**
 * Der sichtbare Zustand ist abgeleitet und wird nicht gespeichert. Für Filter
 * und Paginierung muss er trotzdem in SQL ausdrückbar sein — nachträglich auf
 * der Seite zu filtern würde die Seitenzahlen falsch machen.
 *
 * Damit steht die Regel an zwei Stellen: hier und in deriveVisibleStatus.
 * contracts/visible-status.test.ts hält beide gegeneinander, damit sie nicht
 * auseinanderlaufen.
 */
export function visibleStatusCondition(status: ContractVisibleStatus, onDate: string) {
  const confirmed = eq(serviceContracts.confirmationStatus, 'confirmed');
  const started = lte(serviceContracts.startDate, onDate);

  if (status === 'draft') return eq(serviceContracts.confirmationStatus, 'draft');
  if (status === 'planned') return and(confirmed, gt(serviceContracts.startDate, onDate));
  if (status === 'ended') {
    return and(
      confirmed,
      started,
      isNotNull(serviceContracts.endDate),
      lte(serviceContracts.endDate, onDate),
    );
  }
  return and(
    confirmed,
    started,
    or(isNull(serviceContracts.endDate), gt(serviceContracts.endDate, onDate)),
  );
}

export function createContractRepository(db: Database) {
  function columns(onDate: string) {
    return {
      id: serviceContracts.id,
      customerId: serviceContracts.customerId,
      customerName: customers.name,
      name: serviceContracts.name,
      startDate: serviceContracts.startDate,
      endDate: serviceContracts.endDate,
      confirmationStatus: serviceContracts.confirmationStatus,
      publicDescription: serviceContracts.publicDescription,
      internalNote: serviceContracts.internalNote,
      clientVisible: serviceContracts.clientVisible,
      version: serviceContracts.version,
      amountAtDateMinor: amountAtDate(onDate),
    };
  }

  function base(onDate: string) {
    return db
      .select(columns(onDate))
      .from(serviceContracts)
      .innerJoin(customers, eq(customers.id, serviceContracts.customerId));
  }

  function scope(workspaceId: string, query: ContractListQuery, onDate: string) {
    const filters = [eq(serviceContracts.workspaceId, workspaceId)];
    if (query.customerId) filters.push(eq(serviceContracts.customerId, query.customerId));
    if (query.status) {
      const condition = visibleStatusCondition(query.status, onDate);
      if (condition) filters.push(condition);
    }
    if (query.search) {
      const pattern = `%${query.search}%`;
      const match = or(ilike(serviceContracts.name, pattern), ilike(customers.name, pattern));
      if (match) filters.push(match);
    }
    return and(...filters);
  }

  function orderBy(query: ContractListQuery) {
    const direction = query.direction === 'desc' ? desc : asc;
    const column =
      query.sort === 'customerName'
        ? customers.name
        : query.sort === 'startDate'
          ? serviceContracts.startDate
          : serviceContracts.name;
    return [direction(column), asc(serviceContracts.id)];
  }

  return {
    async list(
      workspaceId: string,
      query: ContractListQuery,
      onDate: string,
      page: { offset: number; limit: number },
    ) {
      const where = scope(workspaceId, query, onDate);
      const [rows, [total]] = await Promise.all([
        base(onDate)
          .where(where)
          .orderBy(...orderBy(query))
          .limit(page.limit)
          .offset(page.offset),
        db
          .select({ value: count() })
          .from(serviceContracts)
          .innerJoin(customers, eq(customers.id, serviceContracts.customerId))
          .where(where),
      ]);
      return { rows, total: total?.value ?? 0 };
    },

    async findById(workspaceId: string, contractId: string, onDate: string) {
      const [row] = await base(onDate)
        .where(
          and(eq(serviceContracts.workspaceId, workspaceId), eq(serviceContracts.id, contractId)),
        )
        .limit(1);
      return row;
    },

    /** Alle Preisversionen, älteste zuerst — die Historie bleibt sichtbar. */
    async listRates(workspaceId: string, contractId: string) {
      return db
        .select({
          id: contractRates.id,
          effectiveFrom: contractRates.effectiveFrom,
          monthlyAmountMinor: contractRates.monthlyAmountMinor,
        })
        .from(contractRates)
        .where(
          and(eq(contractRates.workspaceId, workspaceId), eq(contractRates.contractId, contractId)),
        )
        .orderBy(asc(contractRates.effectiveFrom));
    },

    async findAssignableCustomer(workspaceId: string, customerId: string) {
      const [row] = await db
        .select({ id: customers.id, archivedAt: customers.archivedAt })
        .from(customers)
        .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)))
        .limit(1);
      return row;
    },
  };
}

export type ContractRepository = ReturnType<typeof createContractRepository>;
