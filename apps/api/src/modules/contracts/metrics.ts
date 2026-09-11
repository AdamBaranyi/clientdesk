import { sql } from 'drizzle-orm';
import type { Database, Executor } from '@tallyroom/db';

/**
 * Die Kennzahlenregel, ausgeschrieben:
 *
 * Ein Vertrag zählt am Datum D, wenn er bestätigt ist, `start_date <= D` gilt
 * und `end_date` leer ist oder `D < end_date` — das Enddatum ist exklusiv.
 * Sein Betrag ist die letzte Preisversion mit `effective_from <= D`.
 * Der monatliche Vertragswert ist die Summe dieser Beträge.
 *
 * Umgesetzt als LATERAL-Join: er liefert je Vertrag genau eine Preiszeile.
 * Ein gewöhnlicher Join auf contract_rates würde Verträge mit mehreren
 * Preisversionen mehrfach zählen.
 *
 * Das SQL steht hier ausgeschrieben mit eigenen Aliassen, statt über den
 * Query-Builder: bei einer Abfrage mit korrelierter Unterabfrage ist die
 * Bindung der Spaltennamen die eigentliche Fehlerquelle, und explizite
 * Aliasse machen sie überprüfbar.
 */
export async function monthlyContractValueMinor(
  executor: Executor,
  workspaceId: string,
  onDate: string,
): Promise<{ amountMinor: number; contractCount: number }> {
  const result = await executor.execute<{ amount_minor: string; contract_count: string }>(sql`
    SELECT
      COALESCE(SUM(rate.monthly_amount_minor), 0) AS amount_minor,
      COUNT(*)                                    AS contract_count
    FROM service_contracts AS c
    JOIN LATERAL (
      SELECT r.monthly_amount_minor
      FROM contract_rates AS r
      WHERE r.contract_id = c.id
        AND r.effective_from <= ${onDate}::date
      ORDER BY r.effective_from DESC
      LIMIT 1
    ) AS rate ON TRUE
    WHERE c.workspace_id = ${workspaceId}::uuid
      AND c.confirmation_status = 'confirmed'
      AND c.start_date <= ${onDate}::date
      AND (c.end_date IS NULL OR ${onDate}::date < c.end_date)
  `);

  const row = result.rows[0];
  return {
    amountMinor: Number(row?.amount_minor ?? 0),
    contractCount: Number(row?.contract_count ?? 0),
  };
}

/**
 * Verträge, die am Stichtag zählen müssten, aber keine gültige Preisversion
 * haben. Sie werden von der Summe ausgeschlossen — nicht als null gezählt.
 * Der Wert dient dazu, so einen Zustand sichtbar zu machen statt ihn zu
 * verschlucken; regulär kann er nicht entstehen, weil beim Anlegen eine
 * Preisversion ab Vertragsbeginn Pflicht ist.
 */
export async function contractsWithoutRate(
  executor: Executor,
  workspaceId: string,
  onDate: string,
): Promise<number> {
  const result = await executor.execute<{ value: string }>(sql`
    SELECT COUNT(*) AS value
    FROM service_contracts AS c
    WHERE c.workspace_id = ${workspaceId}::uuid
      AND c.confirmation_status = 'confirmed'
      AND c.start_date <= ${onDate}::date
      AND (c.end_date IS NULL OR ${onDate}::date < c.end_date)
      AND NOT EXISTS (
        SELECT 1 FROM contract_rates AS r
        WHERE r.contract_id = c.id AND r.effective_from <= ${onDate}::date
      )
  `);
  return Number(result.rows[0]?.value ?? 0);
}

export type MetricsExecutor = Database;
