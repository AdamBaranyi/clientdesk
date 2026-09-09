import type { WorkspaceSummary } from '@clientdesk/contracts';

/**
 * Meilenstein 1 liefert die Hülle: Anmeldung, Workspace-Kontext und Layout.
 * Die Kennzahlen entstehen in Meilenstein 3, wenn es Verträge gibt, aus denen
 * sie tatsächlich berechnet werden können. Hier stehen bewusst keine
 * hartcodierten Zahlen.
 */
export function DashboardPage({ workspace }: { workspace: WorkspaceSummary }) {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Dashboard</h1>
        <p className="text-sm text-muted">
          {workspace.name} · Zeitzone {workspace.timezone}
        </p>
      </div>

      <section className="rounded-lg border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold">Noch keine Daten</h2>
        <p className="mt-2 max-w-[62ch] text-sm text-muted">
          Der Workspace ist angelegt und die Anmeldung funktioniert. Kunden, Projekte und Verträge
          entstehen in den nächsten Schritten — bis dahin zeigt diese Seite bewusst keine Zahlen an,
          statt erfundene darzustellen.
        </p>
      </section>
    </div>
  );
}
