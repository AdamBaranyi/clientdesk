# Tests und Prüfungen

Stand: Meilenstein 1.

## Ausgeführt

```bash
bun run verify   # Format, Dateilänge, Lint, Typen
bun run test     # Unit- und Integrationstests
```

Ergebnis vom 09.09.2026: **28 Tests grün**, Lint ohne Fehler und ohne Warnungen, Typecheck in allen
vier Paketen sauber, 64 Code-Dateien unter der 400-Zeilen-Grenze (längste: 202 Zeilen).

### Was geprüft wird

**Dateilängen-Zählweise** (`scripts/check-file-length.test.mjs`, 12 Tests) — leere Datei, mit und
ohne abschliessenden Zeilenumbruch, doppelter Umbruch, Leerzeilen und Kommentare, sowie die
Grenzfälle 399, 400 und 401 Zeilen.

**Mandantentrennung** (`tests/integration/tenant-isolation.test.ts`) — gegen eine echte
PostgreSQL-Testdatenbank, mit zwei Workspaces und zwei Ownern:

- Der eigene Workspace ist lesbar, ein fremder liefert **404 statt 403**.
- Die Workspace-Liste enthält nur eigene Mitgliedschaften.
- Erfundene und syntaktisch ungültige Workspace-IDs werden abgewiesen.
- `/auth/me` ohne Anmeldung liefert 401.
- Falsches Passwort und unbekannte E-Mail liefern dieselbe Meldung.
- Die Sitzungs-ID wechselt nach der Anmeldung.
- Nach dem Abmelden wird das alte Cookie serverseitig abgewiesen.
- Zwei gleichzeitige Sitzungen beeinflussen sich nicht.
- Schreibende Requests ohne Token, mit fremdem Token oder von fremder Herkunft: 403.
- Fehlerantworten enthalten kein SQL und keine Stacktraces; jede Antwort trägt eine Request-ID.

**Rate-Limit** (`tests/integration/login-rate-limit.test.ts`) — nach der konfigurierten Anzahl
Fehlversuche kommt 429 mit `Retry-After`.

## Prüfbreiten

Geprüft am 09.09.2026 im Chromium der Browser-Vorschau, angemeldet auf `/app/:workspaceId/dashboard`.
Gemessen wurde `document.documentElement.scrollWidth` gegen `window.innerWidth`.

| Breite | Waagerechter Überlauf | Bemerkung                                                         |
| ------ | --------------------- | ----------------------------------------------------------------- |
| 320    | nein                  | Seitenleiste als Panel, Hamburger sichtbar, Schliessen erreichbar |
| 375    | nein                  |                                                                   |
| 390    | nein                  |                                                                   |
| 768    | nein                  |                                                                   |
| 1024   | nein                  | Seitenleiste steht ab hier fest                                   |
| 1440   | nein                  |                                                                   |

Weiter geprüft: Fliesstext bleibt bei 16 CSS-Pixeln, keine pauschale Verkleinerung. Das kleinste
sichtbare Bedienelement ist 44 Pixel hoch — die Segmente der Erscheinungsbild-Umschaltung waren
zunächst 32 Pixel hoch und wurden auf 44 angehoben, ab 640 Pixeln Breite auf die kompakte Variante
aus dem Entwurf.

Erscheinungsbild in Hell und Dunkel geprüft, Umschaltung wirkt sofort.

## Nicht geprüft

- **Reale Geräte.** Alle Messungen stammen aus der Browser-Emulation. Das ist kein Nachweis für ein
  bestimmtes Telefon. Es wird keine Unterstützung eines konkreten Altgeräts behauptet.
- **Firefox und WebKit.** Bisher nur Chromium. Die Hauptabläufe sollen in Meilenstein 6 in allen
  drei Engines laufen.
- **Reflow bei 400 % Zoom** ab 1280 Pixeln. Steht aus; die 320-Pixel-Messung deckt denselben
  Layoutzustand ab, ersetzt die Zoomprüfung aber nicht.
- **Playwright-Abläufe** über die sechs Breiten. Vorgesehen ab Meilenstein 5.
- **Barrierefreiheit insgesamt.** Tastaturbedienung, sichtbarer Fokus, beschriftete Felder,
  Sprungmarke und reduzierte Bewegung sind umgesetzt, aber nicht systematisch mit Screenreader
  geprüft.
- **Performance.** Das 500-Millisekunden-Ziel ist noch nicht gemessen; dafür fehlt der
  Lastdaten-Seed aus Meilenstein 3. Es wird deshalb keine Laufzeit genannt.
