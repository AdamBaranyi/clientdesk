# Tests und Prüfungen

Befunde, die beim Prüfen entstanden sind, stehen in [DIAGNOSTICS.md](DIAGNOSTICS.md) —
mit Messung, Ursache und Korrektur, einschliesslich der drei Fehldiagnosen.

Stand: 11.09.2026, mit vier Sprachen und dem Rundgang durch die Demo.

## In der CI

Jeder Push auf `main` startet `.github/workflows/ci.yml` mit sechs Jobs. Eine grüne Pipeline
deployt nichts, der Deploy wird bewusst ausgelöst.

| Job                            | Was er prüft                                                                |
| ------------------------------ | --------------------------------------------------------------------------- |
| Format, Dateilänge, Lint       | Prettier, 400-Zeilen-Grenze, ESLint samt `jsx-a11y`, Typen in allen Paketen |
| Tests gegen echte Datenbank    | alle Unit- und Integrationstests gegen PostgreSQL 18                        |
| Build                          | Build der Oberfläche und die Auslieferungsgrösse gegen ihr Budget           |
| Secret-Scan und Abhängigkeiten | gitleaks über jeden Commit, `bun audit` blockierend ab „hoch"               |
| Playwright über sechs Breiten  | die End-to-End-Prüfungen samt axe, gegen Entwicklungsserver und Garage      |
| Produktionsaufbau von aussen   | Images bauen, Aufbau starten wie auf dem Server, `e2e/production.spec.ts`   |

## Ausgeführt

```bash
bun run verify   # Format, Dateilänge, Lint, Typen
bun run test     # Unit- und Integrationstests
```

Ergebnis vom 11.09.2026: **207 Tests grün**, Lint ohne Fehler und ohne Warnungen, Typecheck in
allen vier Paketen sauber, alle Code-Dateien unter der 400-Zeilen-Grenze (längste: 378 Zeilen).

Die Integrationstests brauchen die Testdatenbank und die Umgebungsdatei:

```bash
docker compose -f infra/docker-compose.yml up -d
bun --env-file=.env run vitest run
```

Ohne `--env-file` fehlt `TEST_DATABASE_URL`, und zwölf Testdateien scheitern beim Start statt
in einem Testfall — der Fehler sieht dann grösser aus, als er ist.

### End-to-End mit Playwright

```bash
bun run test:e2e        # alle sechs Breiten
bun run test:e2e:ui     # zum Nachsehen, wenn etwas rot ist
```

**210 Prüfungen im Lauf, rund 85 Sekunden** (11.09.2026). Dazu kommen 60 übersprungene,
alle mit Absicht: Die drei Messungen gegen Lastdaten und die sechs Sprachprüfungen laufen nur bei
1440 Pixeln, die drei Breitenprüfungen der Übersetzungen nur bei 320. Sechsmal dieselbe Zahl
wäre keine zusätzliche Erkenntnis.

Sechs Projekte, eines je Prüfbreite. **Es wird nie mitten im Test die Fenstergrösse verändert.**
Manche Umgebungen ändern das Layout, ohne der Seite Bescheid zu sagen — dann feuert weder `resize`
noch ein `ResizeObserver`, und Bauteile, die sich selbst messen, bleiben auf der alten Grösse
stehen. Genau das hat am 10.09.2026 zu einer Fehldiagnose an einem Diagramm geführt. Wer zieht
statt neu zu laden, prüft ein Artefakt.

Geprüft wird je Breite: kein waagerechter Überlauf auf Startseite, Impressum, Datenschutz, Dashboard
und Kundenliste — die
Zusicherung nennt beim Scheitern das schuldige Element; der Wechsel zwischen Tabelle und Karten bei
640 Pixeln; die Seitenleiste fest ab 1024 und darunter hinter dem Hamburger, samt Escape; und dass
der Fliesstext bei 16 Pixeln bleibt.

Dazu Fokus und Tastatur: der Dialog sperrt den Hintergrund aus, gibt den Fokus an seinen Auslöser
zurück, die Kommandopalette ebenso, die Sprungmarke führt zum Inhalt, und jedes Bedienelement zeigt
einen mindestens zwei Pixel breiten Fokusring.

**Wie die Fokusfalle gemessen wird:** nicht durch zwanzigmal Tab. Der Headless-Shell hat keine
Browserleiste, an die der Fokus hinter dem letzten Element wandern könnte, und
`document.activeElement` fällt dann auf `body` zurück — eine heile Falle sähe aus wie ein Leck.
Stattdessen wird auf jedem der rund vierzig Bedienelemente hinter dem Dialog `focus()` aufgerufen
und geprüft, ob es gewirkt hat. Ohne Dialog: vierzig erreichbar. Mit Dialog: null.

**Eine Demo für den ganzen Lauf.** Die Anwendung lässt fünf je Viertelstunde zu; zwei Dutzend wären
mehr als die Grenze, und die Grenze ist richtig. Eine noch gültige Sitzung wird
weiterverwendet, sonst verbraucht jeder Entwicklungslauf eine Demo. Das geht nur, weil diese Tests
ausschliesslich lesen — **ein Test, der schreibt, darf diese Sitzung nicht benutzen.**

**Barrierefreiheit mit axe** (`e2e/a11y.spec.ts`) seit Meilenstein 6a: sieben Seiten, samt Impressum
und Datenschutz, in beiden
Erscheinungsbildern, dazu der offene Dialog und die Kommandopalette mit Treffern. Null Verstösse.

**Sprachen** (`e2e/language.spec.ts`, `e2e/widths.spec.ts`): Ein Browser mit `en-GB`, `fr-CH`,
`it-CH` oder `rm-CH` bekommt Englisch, Französisch, Italienisch oder Deutsch. Die Wahl gilt sofort,
bleibt nach dem Neuladen, und die Meldungen der API und der gemeinsamen Schemas folgen ihr. Jede
Übersetzung der Rechtsseiten sagt, dass die deutsche Fassung gilt. Bei 320 Pixeln läuft in
Französisch, Italienisch und Englisch keine von zehn Seiten seitlich — die Übersetzungen sind oft
ein Drittel länger als das Deutsche.

**Rundgang** (`e2e/tour.spec.ts`, alle sechs Breiten): Er öffnet sich einmal, führt durch alle
sechs Schritte, die Karte steht dabei ganz im Bild, der ausgesparte Rahmen liegt über Kennzahlen
und Rollenwechsel, und nach dem Ende bleibt er zu. Der Knopf im Banner startet ihn neu, Escape
beendet ihn, der Fokus kehrt an den Knopf zurück. axe hell und dunkel ohne Verstoss. Die
Platzierung selbst rechnen elf Unit-Tests nach (`tour-position.test.ts`).

### Gegen den Produktionsaufbau

```bash
docker compose -f infra/compose.prod.yml --env-file <datei> up -d --build
bunx playwright test -c playwright.production.config.ts
```

`e2e/production.spec.ts` läuft nicht gegen den Entwicklungsserver, sondern gegen Caddy, API,
PostgreSQL und Garage aus `infra/compose.prod.yml`, lokal auf `https://localhost:8443`, später mit
`PRODUCTION_URL` gegen den Server. Geprüft: die Sicherheitsheader samt Content Security Policy ohne
`unsafe-inline`, dann eine Demo durch jede Seite der Teamansicht, eine Detailseite mit
Seitenübergang, die Kommandopalette mit Treffern, ein Dokument über die API (PDF, Anhang,
`sandbox`) und jede Seite der Kundenansicht nach dem Rollenwechsel. Vorher einmal der ganze
Rundgang, mit dem jede neue Demo beginnt. Jeder Konsolenfehler lässt den
Test scheitern, auch jeder CSP-Verstoss — und weil nicht jeder Verstoss in der Konsole erscheint,
hört zusätzlich ein Skript im Dokument auf `securitypolicyviolation`, auf jeder Seite neu. Wie es
dazu kam, steht in [DIAGNOSTICS.md](DIAGNOSTICS.md), Nummer 17.

Dazu prüft ein eigener Test, dass das Impressum Anschrift und E-Mail nennt. Die Angaben kommen
erst beim Bauen dazu, und ohne diesen Test fiele ein leeres Impressum niemandem auf.

Ergebnis vom 11.09.2026, lokal: **3 von 3 grün, null Verstösse, null Konsolenfehler.** Die Null
ist gegengeprüft: Ein absichtlich eingeschleustes Inline-Skript, ein Inline-Style und ein fremdes
Bild wurden alle drei als Verstoss erkannt, und der stille Verstoss von Zod lässt die geschärfte
Fassung gegen den alten Stand auf dem Server scheitern. Ein Test, der nie scheitern kann, wäre
sonst keiner.

Gegen den Server (`PRODUCTION_URL=https://tallyroom.adambaranyi.xyz`) am 11.09.2026 nach dem
zweiten Deploy: **3 von 3 grün.** Lighthouse gegen dieselbe Adresse, je zwei Läufe: mobil
Leistung 98 bis 99, die übrigen drei Kategorien 100; Desktop viermal 100.

### Sicherung und Wiederherstellung

`apps/api/src/backup/archive.test.ts`, 9 Tests: das Dokumentarchiv spielt Byte für Byte samt
Inhaltstyp zurück; eine falsche Prüfsumme bricht ab, bevor der Eintrag geschrieben wird; ein
abgeschnittenes Archiv und fehlende Einträge fallen an der Schlusszeile auf; Zeilen über
Blockgrenzen und Umlaute an einer Blockgrenze. `tests/integration/password-reset.test.ts`, 2 Tests:
das neue Passwort gilt, das alte nicht mehr, jede Sitzung ist beendet, eine unbekannte Adresse wird
gemeldet.

Die Probe-Wiederherstellung selbst ist ein Skript für den Server (`infra/restore-test.sh`, siehe
[BETRIEB.md](BETRIEB.md)). Am 11.09.2026 gegen den lokalen Produktionsaufbau mit drei Demos
gelaufen: Prüfsummen, 16 Tabellen mit denselben Zeilenzahlen, 18 aktive Dokumente mit Datei, 18
Objekte in der neuen Garage mit derselben Prüfsumme. Gegenprobe: ein aus dem Archiv entferntes
Dokument, Schlusszeile und Prüfsummen passend nachgeführt, lässt die Probe mit «Aktive Dokumente
ohne Datei im Archiv: 1» scheitern. Danach blieben keine Container und kein Netz zurück.

### Was geprüft wird

**Dateilängen-Zählweise** (`scripts/check-file-length.test.mjs`, 12 Tests) — leere Datei, mit und
ohne abschliessenden Zeilenumbruch, doppelter Umbruch, Leerzeilen und Kommentare, sowie die
Grenzfälle 399, 400 und 401 Zeilen.

**Mandantentrennung** (`tests/integration/tenant-isolation.test.ts`) — gegen eine echte
PostgreSQL-Testdatenbank, mit zwei Workspaces und zwei Ownern:

- Der eigene Workspace ist lesbar, ein fremder liefert **404 statt 403**.
- Die Workspace-Liste enthält nur eigene Mitgliedschaften.
- Erfundene und syntaktisch ungültige Workspace-IDs werden abgewiesen.
- `/auth/me` ohne Anmeldung nennt niemanden (`null`, kein Fehler); geschützte Routen liefern 401.
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

**Isolation der Kundenansicht** (`tests/integration/portal-isolation.test.ts`) — das Abnahmetor
dieses Meilensteins. Nur freigegebene Projekte des eigenen Kunden; eine rekursive Suche über jede
Portal-Antwort belegt, dass die interne Notiz nirgends auftaucht, auch nicht in einem
verschachtelten Feld; eine Anfrage eines anderen Kunden ist auch mit bekannter ID nicht erreichbar;
ein Kundenzugang bekommt auf allen internen Routen 404, ein internes Konto auf dem Portal
ebenfalls; interne Kommentare fehlen in der Kundenansicht vollständig, und das Feld `visibility`
existiert dort gar nicht; ein Kundenkommentar wird öffentlich, auch wenn der Request etwas anderes
behauptet; eine Kundenantwort öffnet eine wartende Anfrage wieder; nicht freigegebene Dokumente
sind weder gelistet noch herunterladbar.

**Uploads** (`tests/integration/documents.test.ts`) — fremder Content-Type, als PDF deklarierter
HTML-Inhalt, leere und zu grosse Datei, fremder Kunde, unpassendes Projekt und Pfadanteile im
Dateinamen werden abgewiesen. Der Download antwortet als Anhang mit Ausführungssperre; eine fremde
Objekt-ID und ein interner Download durch einen Kundenzugang liefern 404. Löschen entfernt die
Datei aus dem Speicher — und nimmt die Sichtbarkeit auch dann, wenn der Speicher nicht erreichbar
ist.

**Einladungen** (`tests/integration/invitations.test.ts`) — der Link erscheint genau einmal und
steht danach in keiner Liste; gespeichert ist nur ein 64-stelliger Hash. Eine Einladung gilt
einmal, läuft ab, und Rolle wie Kundenbezug stammen aus ihr und nicht aus dem Request des
Beitretenden. Bei bestehendem Konto wird ohne passende Anmeldung abgelehnt.

**Anfragen und Idempotenz** (`tests/integration/requests.test.ts`) — derselbe Idempotency-Key mit
gleichem Inhalt liefert dieselbe Anfrage, mit anderem Inhalt einen Konflikt; das gilt intern wie
im Portal. Statusübergänge, erneutes Öffnen, Versionskonflikt, und eine Projektzuordnung zu einem
fremden Kunden wird abgewiesen.

**Demo** (`tests/integration/demo.test.ts`) — jede Demo bekommt eine eigene Datenkopie; eine
Änderung in der einen erscheint in der anderen nicht, und ein fremder Demo-Workspace liefert 404.
Der Rollenwechsel wirkt nur innerhalb der eigenen Demo: eine Identität aus einer fremden Demo wird
abgewiesen, ein gewöhnlicher Workspace kennt die Route gar nicht, und beim Wechsel wechselt die
Sitzungs-ID. Abgelaufene Demos lassen sich nicht weiterverwenden und werden samt Dateien, Konten
und Sitzungen entfernt — ein danach vorgelegtes Cookie liefert 401. Eine laufende Demo bleibt vom
Aufräumlauf unberührt. Die Kundengrenze greift, fremde Dateien werden abgewiesen, und das
enthaltene Beispieldokument liegt wie jedes andere zuerst intern.

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

Das Kundenportal und das Demo-Banner wurden auf 320 Pixeln gesondert geprüft: kein Überlauf,
Banner und Rollenwechsel brechen sinnvoll um. Dabei fielen zwei Kartenlinks mit 16 Pixeln Höhe
auf — unter dem WCAG-Mindestziel von 24. Sie liegen jetzt bei 44, ohne dass die Schrift wächst.

Erscheinungsbild in Hell und Dunkel geprüft, Umschaltung wirkt sofort.

## Nicht geprüft

- **Reale Geräte.** Alle Messungen stammen aus der Browser-Emulation. Das ist kein Nachweis für ein
  bestimmtes Telefon. Es wird keine Unterstützung eines konkreten Altgeräts behauptet.
- **Firefox und WebKit.** Bisher nur Chromium. Die Hauptabläufe sollen in Meilenstein 6 in allen
  drei Engines laufen.
- **Reflow bei 400 % Zoom** ab 1280 Pixeln. Steht aus; die 320-Pixel-Messung deckt denselben
  Layoutzustand ab, ersetzt die Zoomprüfung aber nicht.
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
