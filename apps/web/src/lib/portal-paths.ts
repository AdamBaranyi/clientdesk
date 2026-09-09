/** Absolute Pfade des Kundenportals — dieselbe Regel wie in der Teamansicht. */
export function portalPath(workspaceId: string, ...segments: string[]): string {
  return ['/portal', workspaceId, ...segments].join('/');
}
