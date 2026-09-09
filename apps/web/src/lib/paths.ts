/**
 * Alle Anwendungspfade an einer Stelle und absolut.
 *
 * Relative Ziele lösen in React Router gegen den aktuellen Pfad auf, nicht
 * gegen die Route. In einer verschachtelten Routenstruktur führt das dazu,
 * dass „customers" von /dashboard aus auf /dashboard/customers zeigt — und
 * mit einer Catch-all-Route in eine Weiterleitungsschleife läuft.
 */
export function workspacePath(workspaceId: string, ...segments: string[]): string {
  return ['/app', workspaceId, ...segments].join('/');
}
