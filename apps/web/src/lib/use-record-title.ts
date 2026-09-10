import { useLocation } from 'react-router';

/**
 * Der Name, den die Tabellenzeile beim Navigieren mitgegeben hat.
 *
 * Damit steht die Überschrift der Detailseite schon, während die Daten noch
 * laden — sonst wandert der Name beim Seitenübergang in einen leeren
 * Ladezustand und löst sich dort auf. Beim direkten Aufruf einer URL gibt es
 * ihn nicht; dann bleibt es beim gewöhnlichen Ladezustand.
 */
export function useRecordTitlePreview(): string | undefined {
  const state = useLocation().state as { recordTitle?: unknown } | null;
  return typeof state?.recordTitle === 'string' ? state.recordTitle : undefined;
}
