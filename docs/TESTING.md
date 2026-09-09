# Tests und Prüfungen

Stand: Meilenstein 3.

## Ausgeführt

```bash
bun run verify   # Format, Dateilänge, Lint, Typen
bun run test     # Unit- und Integrationstests
```

Ergebnis vom 09.09.2026: **94 Tests grün**, Lint ohne Fehler und ohne Warnungen, Typecheck in allen
vier Paketen sauber, 132 Code-Dateien unter der 400-Zeilen-Grenze (längste: 311 Zeilen).

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

**Kunden** (`tests/integration/customers.test.ts`) — anlegen und erneut lesen, Pflichtfeld Name,
leere Formularfelder werden null statt Leerzeichenkette, Suche, Zähler der laufenden Projekte,
fremder Kunde liefert 404, ein Kundenbenutzer bekommt auf dem internen Bereich 404, veraltete
Version liefert 409 ohne die erste Änderung zu überschreiben, Archivieren mit und ohne
Hinderungsgründe, Zurückholen, Standardliste ohne archivierte Einträge.

**Projekte** (`tests/integration/projects.test.ts`) — Zuordnung bleibt nach erneutem Laden
bestehen, ein Kunde aus einem fremden Workspace wird abgewiesen, kein Projekt für archivierte
Kunden, Zieltermin vor dem Start wird abgewiesen, Fortschritt aus Meilensteinen (ohne Meilensteine
kein Wert), Überfälligkeit und ihr Wegfall nach Erledigung, Abschluss mit und ohne Begründung,
Versionskonflikt.

**Vertragskennzahl** (`tests/integration/contract-metrics.test.ts`) — das verbindliche Beispiel
der Spezifikation Zahl für Zahl: A = CHF 250 und B = CHF 400 ergeben 650; beginnt B erst morgen,
sind es heute 250; erreicht A sein exklusives Enddatum, zählt es an diesem Tag nicht mehr. Dazu:
die letzte Preisversion bis zum Stichtag gewinnt, eine spätere Preisänderung verändert vergangene
Monatswerte nicht, ein Vertrag mit vier Preisversionen zählt einmal, ein Kunde mit drei Projekten
führt nicht zu Mehrfachzählung, Entwürfe und fremde Mandanten bleiben draussen, kostenlose
Verträge zählen mit null, negative Beträge werden abgewiesen, und der Stichtag lässt Kunden- und
Projektzahlen unberührt.

**Abgeleiteter Vertragszustand** (`tests/integration/contract-status.test.ts`) — der Zustand
stimmt zu jedem Stichtag, und der SQL-Filter liefert dieselbe Menge, die die Anzeige-Regel nennt,
samt passender Seitenzahlen. Die Regel steht an zwei Stellen; dieser Test hält sie zusammen.

**Geldrechnung** (`packages/contracts/src/money.test.ts`) — Eingaben mit Tausendertrennung und
Komma, einstellige Rappen, verlustfreie Hin- und Rückwandlung, und dass Unsinn abgewiesen wird
statt still zu null zu werden.

**Kalenderdaten** (`apps/api/src/lib/workspace-date.test.ts`) — das Datum kommt aus der
Workspace-Zeitzone und nicht aus der des Servers, inklusive Sommerzeit; die sechs Stichtage des
Verlaufs stimmen über den Jahreswechsel hinweg.

**Aktivitätsprotokoll** (`apps/api/src/lib/activity.test.ts`) — die Metadaten-Whitelist lässt
interne Notizen und Begründungstexte nicht durch und gibt bei unbekannten Aktionstypen gar nichts
zurück.

## Prüfbreiten

Geprüft am 09.09.2026 im Chromium der Browser-Vorschau, angemeldet, auf Dashboard, Kundenliste und
Projektdetail. Gemessen wurde `document.documentElement.scrollWidth` gegen `window.innerWidth`
sowie jedes Element, dessen rechte Kante über den Viewport ragt.

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

Auf 320 Pixeln zusätzlich geprüft: Kunden- und Projektlisten erscheinen als Karten statt als
Tabelle, der Dialog „Kunde anlegen" ist genau 320 Pixel breit, passt vollständig ins Bild und
seine Schliessen-Aktion bleibt erreichbar.

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
- **Reale Last durch gleichzeitige Nutzer.** Gemessen wurde nacheinander, nicht unter Parallellast.

## Performance

Gemessen am 09.09.2026 mit `bun run seed:load` und `bun run measure`.

**Umgebung:** MacBook Air (Apple Silicon), macOS 15.6, Bun 1.3.14, PostgreSQL 18.1 im
Docker-Container auf demselben Rechner. API und Datenbank lokal, kein Netzwerk dazwischen.

**Datenbestand:** 1'000 Kunden, 3'000 Projekte mit Meilensteinen, 1'500 Verträge mit
Preisversionen, 10'000 Anfragen — alle in einem Workspace.

**Verfahren:** 5 Aufwärmaufrufe, danach 30 gemessene je Fall, nacheinander.

| Abfrage                    |  p50 |  p95 |  max |
| -------------------------- | ---: | ---: | ---: |
| Dashboard (Stichtag heute) | 7 ms | 9 ms | 9 ms |
| Kundenliste, Seite 1       | 3 ms | 4 ms | 7 ms |
| Kundenliste, Seite 20      | 4 ms | 7 ms | 7 ms |
| Kundensuche                | 3 ms | 4 ms | 4 ms |
| Projektliste, Seite 1      | 4 ms | 5 ms | 9 ms |
| Projektliste, gefiltert    | 3 ms | 4 ms | 4 ms |
| Vertragsliste, Seite 1     | 3 ms | 4 ms | 4 ms |

Alle Abfragen bleiben im 95. Perzentil unter 500 ms; das Dashboard braucht sieben Kennzahlabfragen
und liegt bei 9 ms. Es wurde nichts optimiert — die Messung gab dazu keinen Anlass.

**Was diese Zahlen nicht sagen:** Sie gelten für diese Maschine ohne Netzwerkweg und ohne
gleichzeitige Nutzer. Auf dem späteren Server werden sie anders ausfallen und dort neu gemessen.
