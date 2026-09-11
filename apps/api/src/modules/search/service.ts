import { and, asc, eq, ilike, or } from 'drizzle-orm';
import {
  customers,
  projects,
  serviceContracts,
  serviceRequests,
  type Database,
} from '@tallyroom/db';
import { SEARCH_LIMIT_PER_KIND, type SearchHit, type SearchResult } from '@tallyroom/contracts';

/**
 * Die gebündelte Suche der Kommandopalette.
 *
 * Vier Abfragen in einer Runde statt vier Anfragen pro Tastendruck. Jede
 * filtert ausdrücklich auf die Workspace-Spalte ihrer eigenen Tabelle — die
 * zusammengesetzten Fremdschlüssel garantieren zwar, dass ein Projekt im
 * selben Workspace liegt wie sein Kunde, aber eine Garantie im Schema ersetzt
 * keine Bedingung in der Abfrage. Wer hier eine vergisst, öffnet ein
 * Mandantenleck, das kein Test der anderen Module bemerkt.
 */
export function createSearchService(db: Database) {
  return {
    async find(workspaceId: string, term: string): Promise<SearchResult> {
      // % und _ sind ILIKE-Platzhalter. Der Begriff wird zwar als Wert
      // gebunden und kann kein SQL einschleusen, aber wer „%" eintippt, bekäme
      // sonst den ganzen Bestand statt der Kunden, die ein Prozentzeichen im
      // Namen tragen. Der Backslash ist Postgres' Standard-Fluchtzeichen.
      const pattern = `%${term.replace(/[\\%_]/g, (zeichen) => `\\${zeichen}`)}%`;

      const [customerRows, projectRows, contractRows, requestRows] = await Promise.all([
        db
          .select({ id: customers.id, title: customers.name, subtitle: customers.contactName })
          .from(customers)
          .where(
            and(
              eq(customers.workspaceId, workspaceId),
              or(
                ilike(customers.name, pattern),
                ilike(customers.contactName, pattern),
                ilike(customers.email, pattern),
              ),
            ),
          )
          .orderBy(asc(customers.name))
          .limit(SEARCH_LIMIT_PER_KIND),

        db
          .select({ id: projects.id, title: projects.name, subtitle: customers.name })
          .from(projects)
          .innerJoin(customers, eq(customers.id, projects.customerId))
          .where(and(eq(projects.workspaceId, workspaceId), ilike(projects.name, pattern)))
          .orderBy(asc(projects.name))
          .limit(SEARCH_LIMIT_PER_KIND),

        db
          .select({
            id: serviceContracts.id,
            title: serviceContracts.name,
            subtitle: customers.name,
          })
          .from(serviceContracts)
          .innerJoin(customers, eq(customers.id, serviceContracts.customerId))
          .where(
            and(
              eq(serviceContracts.workspaceId, workspaceId),
              ilike(serviceContracts.name, pattern),
            ),
          )
          .orderBy(asc(serviceContracts.name))
          .limit(SEARCH_LIMIT_PER_KIND),

        db
          .select({
            id: serviceRequests.id,
            title: serviceRequests.subject,
            subtitle: customers.name,
          })
          .from(serviceRequests)
          .innerJoin(customers, eq(customers.id, serviceRequests.customerId))
          .where(
            and(
              eq(serviceRequests.workspaceId, workspaceId),
              ilike(serviceRequests.subject, pattern),
            ),
          )
          .orderBy(asc(serviceRequests.subject))
          .limit(SEARCH_LIMIT_PER_KIND),
      ]);

      const hits: SearchHit[] = [
        ...customerRows.map((row) => ({ kind: 'customer' as const, ...row })),
        ...projectRows.map((row) => ({ kind: 'project' as const, ...row })),
        ...contractRows.map((row) => ({ kind: 'contract' as const, ...row })),
        ...requestRows.map((row) => ({ kind: 'request' as const, ...row })),
      ];

      return { hits };
    },
  };
}

export type SearchService = ReturnType<typeof createSearchService>;
