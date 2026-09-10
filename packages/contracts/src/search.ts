import { z } from 'zod';

/**
 * Die gebündelte Suche hinter der Kommandopalette.
 *
 * Kunden, Projekte, Verträge und Anfragen haben je eine eigene Listensuche.
 * Die Palette fragt aber pro Tastendruck — vier getrennte Anfragen daraus zu
 * machen hiesse, bei jedem Buchstaben viermal anzuklopfen. Deshalb ein
 * Endpunkt, der alle vier in einer Runde beantwortet.
 */
export const SEARCH_KINDS = ['customer', 'project', 'contract', 'request'] as const;

export const searchQuerySchema = z.object({
  /**
   * Mindestens zwei Zeichen. Bei einem einzelnen Buchstaben liefert die Suche
   * praktisch den ganzen Bestand zurück — das ist keine Suche, sondern eine
   * Volltabelle über vier Tabellen.
   */
  q: z.string().trim().min(2, 'Mindestens zwei Zeichen').max(100),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const searchHitSchema = z.object({
  kind: z.enum(SEARCH_KINDS),
  id: z.string().uuid(),
  title: z.string(),
  /** Zweite Zeile im Treffer, etwa der Kunde eines Projekts. */
  subtitle: z.string().nullable(),
});

export type SearchHit = z.infer<typeof searchHitSchema>;

export const searchResultSchema = z.object({
  hits: z.array(searchHitSchema),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

/** Je Art höchstens so viele Treffer — die Palette ist ein Sprung, keine Liste. */
export const SEARCH_LIMIT_PER_KIND = 5;
