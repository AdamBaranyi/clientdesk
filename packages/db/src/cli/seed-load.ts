import { seedLoadWorkspace } from '../seed/load.ts';

/**
 * Erzeugt Lastdaten für die Performance-Messung. Nur lokal ausführen — der
 * Befehl legt zehntausende Zeilen an und gehört nicht in eine produktive
 * Datenbank.
 */
async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL fehlt. Siehe .env.example.');

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Lastdaten werden nicht gegen eine Produktionsumgebung erzeugt.');
  }

  const result = await seedLoadWorkspace(connectionString, {
    email: 'last@clientdesk.test',
    password: 'Lastdaten-Passwort-2026',
  });

  console.log('Lastdaten angelegt.');
  console.log(`Workspace: ${result.workspaceId}`);
  console.log(`Kunden:    ${result.counts.customers}`);
  console.log(`Projekte:  ${result.counts.projects}`);
  console.log(`Verträge:  ${result.counts.contracts}`);
  console.log(`Anfragen:  ${result.counts.requests}`);
  console.log(`Dauer:     ${(result.durationMs / 1000).toFixed(1)} s`);
  console.log('\nAnmeldung: last@clientdesk.test / Lastdaten-Passwort-2026');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
