# Umsetzungsstand

Stand: 11.09.2026 · Meilensteine 1–5 und 6a abgeschlossen · live unter
<https://tallyroom.adambaranyi.xyz> · Meilenstein 6: D0 bis D7 erledigt, D8 in Arbeit

207 Unit- und Integrationstests · 228 End-to-End-Prüfungen über sechs Breiten · Lint ohne Fehler
und ohne Warnungen · Typecheck in allen vier Paketen sauber · keine Anfrage an Dritte.

## Erledigt — Meilenstein 1: Fundament und Pipeline

**Repository und Werkzeuge**

- Bun-Workspace mit `apps/web`, `apps/api`, `packages/db`, `packages/contracts`
- TypeScript 6.0.3 strict, ESLint 10, Prettier, Vitest 5
- 400-Zeilen-Prüfung: ESLint `max-lines` plus `bun run check:file-length` mit eigenen Tests für die
  Grenzfälle 399, 400, 401
- GitHub Actions mit drei Jobs: Qualität, Tests gegen echte Datenbank, Build

**Datenbank**

- 15 Tabellen, vollständiges Kernschema inklusive Verträgen, Anfragen, Dokumenten und Aktivitäten
- Zusammengesetzte Fremdschlüssel erzwingen, dass Kindobjekte im selben Workspace liegen
- Check-Constraints für Rollen, Datumsintervalle, nicht negative Beträge, PDF-only, Client-Rolle
  braucht `customer_id`
- Migration `0000_init` angewendet und geprüft

**Anmeldung und Zugriff**

- Serverseitige Sessions im PostgreSQL-Store, Argon2id, Sitzungsrotation, serverseitiges Abmelden
- CSRF mit sitzungsgebundenem Token und Origin-Prüfung
- Rate-Limit auf der Anmeldung, konfigurierbar
- Workspace-Kontext ausschliesslich aus `memberships`; fremder Workspace liefert 404
- Admin-Befehl zum Anlegen interner Konten

**Oberfläche**

- Design-Tokens in einer Datei, zwei Wertesätze
- Erscheinungsbild mit drei Zuständen: Gerät, Hell, Dunkel — Gerät folgt `prefers-color-scheme`
  ohne Neuladen
- Anmeldeseite mit echten Lade-, Fehler- und Validierungszuständen
- App-Hülle mit fester Seitenleiste ab 1024 Pixeln, darunter als Panel
- Bedienbar ab 320 Pixeln, alle sechs Prüfbreiten ohne waagerechten Überlauf

**Nachweise**

- 28 Tests grün, Lint ohne Fehler und Warnungen, Typecheck in allen Paketen sauber
- Anmeldung im Browser durchgespielt: Login, Weiterleitung, Dashboard, Themenwechsel

## Erledigt — Meilenstein 2: Kernablauf und Beispieldaten

- Kunden anlegen, bearbeiten, archivieren — mit genannten Hinderungsgründen statt stiller Ablehnung
- Projekte einem Kunden zugeordnet, Meilensteine abhakbar; Fortschritt entsteht aus erledigten
  Meilensteinen, nicht aus einer Schätzung
- Vorführ-Seed: 8 Kunden, 12 Projekte, 18 Anfragen, relativ zu einem Bezugsdatum statt mit festen
  Kalenderdaten
- Integrationstests laufen in der CI gegen eine echte PostgreSQL-Datenbank

## Erledigt — Meilenstein 3: Verträge und Kennzahlen

- Servicevereinbarungen mit Preisversionen: eine Preisänderung gilt ab ihrem Datum und lässt
  vergangene Monatswerte unberührt
- Monatlicher Vertragswert zu jedem Stichtag nachvollziehbar; Zählregel in Tests festgehalten
- Dashboard-Aggregate und Sechs-Monats-Verlauf
- Lastdaten-Seed mit rund 1'000 Kunden, 3'000 Projekten, 10'000 Anfragen
- `scripts/measure-performance.ts` misst die API mit p50, p95 und Maximum über 30 Läufe — gemessen,
  nicht behauptet

## Erledigt — Meilenstein 4: Portal und Dokumente

**Anfragen**

- Anlegen, zuweisen, Priorität, Statusfolge mit erlaubten Übergängen; erneutes Öffnen zulässig
- Idempotency-Key beim Erstellen — ein Doppelklick erzeugt keine zweite Anfrage; derselbe
  Schlüssel mit anderem Inhalt ist ein Konflikt
- Kommentare intern oder öffentlich, im Verlauf deutlich unterschieden

**Dokumente**

- PDF bis 10 MiB, Typ und tatsächlicher Dateianfang serverseitig geprüft
- Zufälliger Objektschlüssel, Originalname nur als Metadatum, privater Bucket
- Standardmässig intern; Freigabe ist eine eigene Handlung
- Download über die autorisierte API, als Anhang und mit Ausführungssperre
- Löschen nimmt die Sichtbarkeit sofort; ein fehlgeschlagener Speicherlauf bleibt als
  `pending_deletion` sichtbar, das Dokument ist aber für jeden Zugriff weg

**Einladungen**

- Einmalig, sieben Tage gültig, nur gehasht gespeichert; der Link erscheint genau einmal
- Rolle und Kundenbezug hängen an der Einladung, nicht am Request des Beitretenden
- Bei bestehendem Konto muss die Identität zur eingeladenen Adresse passen

**Kundenportal**

- Eigene Oberfläche unter `/portal/:workspaceId` mit reduzierter Navigation, ohne
  Workspace-Umschalter
- Eigene Datenzugriffsschicht: jede Abfrage ist fest auf Workspace und Kunde eingeschränkt und
  liefert nur Freigegebenes
- Client-DTOs führen interne Felder gar nicht — ein öffentlicher Kommentar hat kein
  Sichtbarkeitsfeld, weil es nichts zu unterscheiden gibt
- Eine Kundenantwort auf eine wartende Anfrage öffnet sie in derselben Transaktion wieder

**Nachweise**

- 141 Tests grün, davon 16 allein für die Isolation der Kundenansicht
- Eine rekursive Suche über jede Portal-Antwort belegt, dass interne Notizen nirgends auftauchen
- Im Browser gegengeprüft: dieselbe Anfrage zeigt dem Team einen internen Kommentar, der
  Kundenansicht nicht

## Erledigt — Meilenstein 5: Demo und Feinschliff

**Isolierte Demo je Besucher**

- Eigener Workspace mit Ablaufdatum, fünf eigenen Identitäten und vollständigem Datenbestand
- Keine gemeinsam beschreibbare Demo: zwei Besucher sehen einander nicht
- Fünf Demos je IP und Viertelstunde, höchstens 50 gleichzeitig
- `DEMO_ENABLED=false` lässt den Bereich verschwinden

**Rollenwechsel**

- Drei interne Identitäten und zwei Kundenzugänge, umschaltbar im Banner
- Nur innerhalb der eigenen Demo; Konten fremder Demos werden abgewiesen
- Kein Impersonation-Endpunkt für gewöhnliche Konten
- Der Wechsel erneuert die Sitzungs-ID und lädt die Oberfläche vollständig neu

**Grenzen und Aufräumen**

- 30 Kunden, 50 Projekte, 50 Verträge, 100 Anfragen — nur in Demo-Workspaces
- Keine fremden Dateien; stattdessen ein enthaltenes Beispieldokument
- Aufräumlauf alle fünf Minuten entfernt Daten, Sitzungen und Dateien

**Startseite**

- Produktvorstellung mit „Demo starten" und „Anmelden", ohne erfundene Zahlen oder Kundenstimmen

**Nachweise**

- 153 Tests grün, davon 12 für die Demo
- Ablauf im Browser durchgespielt: Demo starten, in die Kundenansicht wechseln, zurück
- Zwei Kartenlinks waren 16 Pixel hoch und liegen jetzt bei 44

## Erledigt — Design-Überarbeitung (10.09.2026)

Richtung: industriell/technisch auf Schweizer Raster. Begründung und Regeln stehen in
`Tallyroom-Masterprompt-v3.md`, Abschnitt 5.

| Schritt | Commit    | Ergebnis                                                                                        |
| ------- | --------- | ----------------------------------------------------------------------------------------------- |
| A       | `a998cfb` | Unterstreichung ganzer Karten behoben; 20 wirkungslose `no-underline` in 14 Dateien als Ursache |
| B       | `199c85f` | Tokens: IBM Plex, Kobalt nur für Daten, Tinte auf Knöpfen, Typoskala 5,1:1, 4-px-Raster         |
| D       | `30a9765` | Bewegungsebene: drei Geschwindigkeiten, zwei Versätze mit Deckel, zwei Kurven                   |
| C1      | `fb85a82` | Kennzahlband asymmetrisch, Leitzahl 72 px gegen 11-px-Einheit                                   |
| C2      | `8ed902b` | Tabellen als Datenblattraster, gemeinsame Bauteile                                              |
| C2      | `eb030bb` | Name wandert von der Zeile in die Detailüberschrift (View Transitions)                          |
| C3      | `63f614b` | Navigation: Kantenstreifen raus, aktiv in Kobalt, Wortmarke statt Symbol                        |
| C4      | `030838f` | Diagrammfarben aus den Tokens, Balken gestaffelt                                                |
| —       | `9d7f014` | Unbehandelte Zurückweisung bei abgebrochenem Seitenübergang                                     |
| C5      | `f6c4e25` | Startseite an der Kante statt mittig, nummerierte Zeilen statt drei Karten                      |
| —       | `9ba957b` | Schriften vom eigenen Server statt von Google, Lizenz SIL OFL 1.1 liegt bei den Dateien         |
| —       | `c289864` | Favicon, gezeichnet aus dem Kennzahlband                                                        |
| —       | `e8cfa1d` | Listensteuerung im selben Raster wie die Tabellen, Fokusring wieder sichtbar                    |
| —       | `2acf56a` | 52 verbliebene Rundungen entfernt, auch an Dialogen und Statuspunkten                           |
| —       | `2f50a23` | Akzentbrücke entfernt, kein Fliesstext mehr in `--faint` (dunkel nur 3,7:1)                     |
| —       | `9bb0a90` | Vorher-/Nachher-Bilder unter gleichen Bedingungen, Gegenprobe mit `avoid-ai-design`             |

Die Gegenprobe fand noch zwei Stellen, beide behoben: zu breite Diagrammbalken (`1a7ab56`) und eine
Nummerierung, die eine Reihenfolge behauptete, die es nicht gab (`54c8bab`).

**Vier Fehler, die niemand gemeldet hätte:** ungeschichtetes CSS schlägt jede Tailwind-Utility
(zweimal zugeschlagen — Unterstreichung und Textfarbe), `flushSync` kommt gegen `startTransition`
nicht an, abgebrochene Seitenübergänge lecken unbehandelte Zurückweisungen, `--faint` erreicht
dunkel nur 3,7:1.

## Umbenennung ClientDesk → Tallyroom (11.09.2026)

Vor dem ersten Deployment, solange der Name nur Text im Repository war und noch nicht an Domain,
Zertifikat und verschickten Links hing.

**Warum.** „ClientDesk" war doppelt belegt: eine eingetragene Marke in der Klasse für
technologische Dienstleistungen (Versicherungs-SaaS, Toronto) und ein aktives Produkt gleichen
Namens — ein Kundenportal für Freelancer und kleine Agenturen, also fast dasselbe Produkt für
dieselbe Zielgruppe.

**Wie geprüft.** WIPO Global Brand Database (Schweiz, EU und 87 weitere Register), Websuche nach
gleichnamiger Software, Firmenregister. Rund zwanzig Kandidaten, die meisten englischen belegt —
unter anderem durch eine Kundenplattform („Keelson"), eine Software-Anmeldung vom August 2026
(„Watchbill") und die EU-Marke „PULT" in den Software-Klassen, an der alle „…pult"-Namen
scheiterten.

**Warum Tallyroom.** Der _tally room_ ist der Raum, in dem am Wahlabend alle Auszählungen
zusammenlaufen und das Gesamtbild entsteht. Kein Markeneintrag, keine Firma, kein Produkt dieses
Namens. „Tally" ist in der Software verbreitet, aber gerade weil so viele Tally-Produkte
nebeneinander existieren, gehört das Wort niemandem allein.

**Umfang.** 142 Dateien, Paketnamen `@tallyroom/*`, Docker-Projekt, Datenbanknamen, Cookie- und
Speicherschlüssel, Wortmarke. Die alten Docker-Volumes unter `clientdesk` sind nicht gelöscht,
nur gestoppt. Die Git-Historie bleibt unverändert; die Vorher-Bilder zeigen den alten Namen, weil
sie den alten Stand zeigen.

## Erledigt — Kommandopalette (10.09.2026)

- Gebündelter Suchendpunkt `GET /workspaces/:w/search` über Kunden, Projekte, Verträge und
  Anfragen, mit denselben negativen Mandantentests wie jeder andere Endpunkt (`423f523`)
- `⌘K` beziehungsweise `Ctrl+K`, dazu ein sichtbarer Knopf in der Kopfzeile (`2f5c7b5`)
- `%` und `_` im Suchbegriff werden entschärft, siehe Diagnose 10 in `docs/DIAGNOSTICS.md`

## Erledigt — Meilenstein 6a: Frontend-Qualität (10.09.2026)

- Playwright über sechs Prüfbreiten, 147 Prüfungen je Lauf. **Je Breite neu laden, nie das Fenster
  ziehen** — die Begründung steht in `playwright.config.ts` und in `docs/DIAGNOSTICS.md`.
- Fokusfalle, inerter Hintergrund und Fokusrückgabe über `showModal()` des Browsers; Dialog und
  Kommandopalette liegen auf demselben Bauteil.
- `eslint-plugin-jsx-a11y` in `bun run verify`, axe über fünf Seiten in beiden Erscheinungsbildern
  plus offener Dialog und Palette mit Treffern. Null Verletzungen, gegengeprüft.
- `bun run check:bundle-size`: Erstlast 149 KB gzip (Grenze 170), Diagramm getrennt nachgeladen mit
  101 KB (Grenze 115). Vorher lag alles in einem Bündel mit 260 KB.
- Messung gegen den Lastdaten-Workspace: Dashboard LCP 560 ms / CLS 0.0004, Kundenliste mit 1'000
  Kunden LCP 524 ms / CLS 0.0043, Suchantwort 61 ms. Gemessen gegen den Entwicklungsserver — die
  echte Ladezeit gehört auf den Server aus Meilenstein 6.
- `docs/DIAGNOSTICS.md` mit zwölf Befunden, drei davon ausdrücklich als Fehldiagnose.

## Erledigt — Server-Grundeinrichtung (11.09.2026)

KVM-Server bei FSIT: 8 vCPU, 16 GB RAM, 150 GB SSD, Ubuntu 24.04 LTS, wöchentliche Sicherung durch
den Anbieter.

- System aktualisiert und auf dem neuen Kernel neu gestartet
- Anmeldung nur mit Schlüssel, root kann sich nicht direkt anmelden. Verwaltet wird über einen
  eigenen Benutzer, dessen `sudo` ein Passwort verlangt
- Firewall `ufw`: eingehend nur 22, 80 und 443
- Sicherheitsupdates automatisch, Neustart bei Bedarf nachts um 03:30
- Docker Engine und Compose aus dem offiziellen Repository. Der Signaturschlüssel ist gegen den
  veröffentlichten Fingerabdruck geprüft, Container-Logs sind begrenzt, und laufende Container
  überstehen ein Docker-Update
- DNS: A-Eintrag `tallyroom.adambaranyi.xyz`, kein AAAA-Eintrag, weil die IPv6-Route des Anbieters
  fehlerhaft ist (Diagnose 13)

Die einzelnen Schritte kommen mit D8 in die README.

## Erledigt — Vier Sprachen und geschlossene Lücken (11.09.2026)

Vor dem Livegang dazugekommen, auf Wunsch des Betreibers und aus einer eigenen Durchsicht der
Anwendung.

**Sprachen.** Deutsch, Französisch, Italienisch und Englisch für Oberfläche, API-Meldungen und
Prüfmeldungen. Aufbau und Begründung in `docs/ARCHITECTURE.md`, Abschnitt „Sprachen".
Französisch und Italienisch sind ohne Prüfung durch Muttersprachler übersetzt; die Rechtsseiten
sagen in jeder Übersetzung, dass die deutsche Fassung gilt.

**Nebenbefund Zod.** Zods eigene Meldungen waren nie konfiguriert und erschienen auf Englisch,
auch in der deutschen Oberfläche. Sie folgen jetzt der gewählten Sprache.

**Lücken, die vorher offen waren**

- Passwort ändern, für Team und Kundenzugang, mit dem bisherigen Passwort als Nachweis; danach
  enden alle anderen Sitzungen des Kontos
- Fehlergrenze statt weisser Seite bei einem Darstellungsfehler
- Eine abgelaufene Sitzung führt zur Anmeldung, statt jede Seite „Konnte nicht geladen werden"
  sagen zu lassen
- Rate-Limit auf Uploads, 30 je Konto und Viertelstunde
- Wiederholungslauf für Löschungen, die am Objektspeicher gescheitert sind
- Zwei deutsche Texte auf der Einladungsseite waren grammatisch falsch

**Rundgang durch die Demo (D6b).** Eine neue Demo beginnt mit sechs Schritten: was Tallyroom ist,
die Kennzahlen, die Bereiche der Navigation mit je einem Satz, die Kommandopalette, der
Rollenwechsel ins Kundenportal und wo der Rundgang neu startet. Jeder Schritt spart das
Bedienelement aus, um das es geht; bei 320 Pixeln rückt es nach oben, wenn die Karte es sonst
verdecken würde. Einmal von selbst, danach über den Knopf im Demo-Banner. Echter modaler Dialog,
Fokus auf «Weiter», Escape beendet, keine Bibliothek. Im Kundenportal gibt es ihn nicht.

**Nachladen statt Erstlast.** Mit vier Sprachen lag die Erstlast bei 191 KB gzip, über der
Grenze von 170 KB. Teamansicht, Kundenportal und Rechtsseiten kommen jetzt erst beim Aufruf; die
Startseite lädt 135.7 KB, die Grenze liegt neu bei 142 KB. Am 10.09.2026, nur auf Deutsch, waren
es 149 KB. Die Messung zählt jetzt, was `index.html` anfordert, nicht eine einzelne Datei.

**Zwei Befunde der CI** nach dem Push der Sprachen:

- Der Secret-Scan meldete das Testpasswort in `password-change.test.ts`. Falschmeldung, einzeln
  in `.gitleaksignore` eingetragen und in `docs/SECURITY.md` begründet.
- Lokal gebaut war die Oberfläche eine Entwicklungsfassung von React: Bun lädt `.env` mit
  `NODE_ENV=development` automatisch, und Vite übernimmt das. Das Bauskript setzt jetzt
  `NODE_ENV=production`, sonst misst der lokale Budgetcheck etwas anderes als die CI.

## Erledigt — Startseite mit Nebel (11.09.2026)

Wunsch des Betreibers: die Startseite lebendiger, mit Farbe und Bewegung, und Lighthouse bleibt
grün. Der Weg dahin, samt verworfener Stände:

- Drei Hintergründe im Prototyp — Höhenlinien, Messraster, Farbfeld — hat der Betreiber
  verworfen: zu sehr das, was jede generierte Seite hat.
- Eine Szene, die die Freigabe ins Kundenportal vorspielt, war ihm zu wenig Gestaltung.
- Vanta.js, GSAP und Lenis geprüft. Vanta: der Look passt, die Bibliothek nicht (155 KB, seit 2023
  ungepflegt). GSAP: gut, für diesen einen Moment aber 32 KB zu viel. Lenis: weiches Scrollen passt
  weder zur kurzen Startseite noch zur App.
- Gebaut: der Fog-Look als eigener Shader, 2.9 KB, in Kobalt. Kobalt war bisher reine Datenfarbe;
  der Betreiber hat die Regel für diesen einen Ort erweitert (tokens.css).

Aufbau: Text links auf ruhigem Grund, der Nebel ist rechts das Bild, ohne Text darauf. Die ruhige
Fläche folgt dem gemessenen Textblock, bei 320 wie bei 1440 Pixeln. Die Kenndaten stehen jetzt
unter den Knöpfen. Pause-Knopf wegen WCAG 2.2.2, die Wahl gilt je Browser; bei reduzierter
Bewegung steht der Nebel still. Nur auf der Startseite.

Nebenbei gefunden: Die Barrierefreiheitsprüfung lief nie wirklich ohne Bewegung, und die
E2E-Tests liefen durch keinen Typecheck (DIAGNOSTICS Nummer 20). Beides behoben.

## Erledigt — Abmelden zur Startseite, Safari und Firefox (11.09.2026)

- Nach dem Abmelden geht es zur Startseite statt zur Anmeldung, in Teamansicht und Kundenportal;
  Wunsch des Betreibers. Mit vollständigem Neuladen, weil die geschützte Seite sonst zuerst zur
  Anmeldung schickt (DIAGNOSTICS Nummer 23). Die Produktionsprüfung meldet sich am Ende ab.
- Die ganze Suite läuft zusätzlich in WebKit und Firefox, auf iPhone, iPad und am Schreibtisch
  (`bun run test:e2e:browsers`): 232 bestanden. Die Fokustests öffnen jetzt per Tastatur, weil
  Safari Knöpfe bei einem Klick nicht fokussiert (DIAGNOSTICS Nummer 22).

## Offen — Meilenstein 6: Deployment

Plan vom 11.09.2026, in dieser Reihenfolge:

| Etappe | Inhalt                                                                                   | Stand    |
| ------ | ---------------------------------------------------------------------------------------- | -------- |
| D0     | Statusdatei und Diagnosen nachgeführt                                                    | erledigt |
| D1     | Objektspeicher von MinIO auf Garage, zuerst lokal                                        | erledigt |
| D2     | Produktions-Images: API ohne Root-Rechte und mit geordnetem Herunterfahren, Web statisch | erledigt |
| D3     | Produktions-Compose mit Caddy, Speichergrenzen, CSP; lokal geprüft, null CSP-Verstösse   | erledigt |
| D4     | Pflichtseiten und SEO-Grundlage (6b), vor dem Livegang                                   | erledigt |
| D5     | CI: Secret-Scan samt Git-Historie, Abhängigkeitsscan, Playwright, axe, Bundle-Budget     | erledigt |
| D6     | Erster Deploy, Prüfungen gegen die Live-URL, Lighthouse, gemessene Ladezeiten            | erledigt |
| D6b    | Geführter Rundgang durch die Demo, in allen vier Sprachen                                | erledigt |
| D7     | Sicherung von Datenbank und Dateien, tatsächlich durchgeführter Restore-Test             | erledigt |
| D8     | README mit Server-Einrichtung, Deploy und Rollback; Fallstudie                           | offen    |

**Entscheide**

- **Garage statt MinIO.** Das MinIO-Community-Repository ist seit dem 12.02.2026 archiviert, fertige
  Images gibt es seit Oktober 2025 nicht mehr. Das hier verwendete `RELEASE.2025-09-07` bekäme nie
  wieder eine Sicherheitskorrektur. Der Code nutzt nur Schreiben, Lesen und Löschen über S3, der
  Wechsel betrifft also die Umgebung und nicht die Fachlogik. Garage ist gepflegt, hat seit v2.3
  einen Einzelserver-Modus und steht unter AGPL-3.0. Es läuft als eigenständiger, unveränderter
  Dienst.
- **Die Images entstehen auf dem Server**, aus einem Checkout des öffentlichen Repositorys. Keine
  Registry, kein Zugangstoken. Der Deploy wird bewusst ausgelöst, eine grüne Pipeline allein
  deployt nichts.
- **Pflichtseiten vor dem Livegang**, weil die Seite ab dem ersten Tag Anmeldungen verarbeitet.

**D1 im Einzelnen.** Garage v2.4.1 im Einzelserver-Modus, Schlüssel und Bucket entstehen beim
ersten Start. Geprüft: 166 von 166 Tests grün, 147 End-to-End-Prüfungen grün, im Browser eine Demo
gestartet, alle sechs Dokumente über die API als PDF geladen, eines angelegt und wieder gelöscht
(Status `deleted`, nicht `pending_deletion`). Die lokalen Entwicklungsdokumente sind umgezogen: 6
Objekte, byteweise gleich gross, jedes aktive Dokument der Datenbank hat seine Datei. Der alte
MinIO-Container ist gestoppt, sein Volume bleibt, bis es jemand ausdrücklich löscht.

**D2 und D3 im Einzelnen.** Ein `Dockerfile` mit zwei Zielen: `api` (Bun, nur
Laufzeitabhängigkeiten, Benutzer `bun`) und `web` (Caddy mit dem statischen Build, ohne Bun und
ohne Quelltext). `infra/compose.prod.yml` startet Caddy, API, PostgreSQL und Garage, Migrationen
laufen als eigener Schritt über das Profil `tools`. Lokal geprüft mit einer eigenen
Zertifizierungsstelle auf Port 8443:

- Die API meldet sich gesund, antwortet auf SIGTERM mit geordnetem Herunterfahren und endet mit
  Exit-Code 0, ebenso alle anderen Dienste
- Migrationen und Admin-Befehl laufen aus demselben Image
- Header und Cache-Regeln per `curl`: CSP, HSTS und die übrigen stehen auf der Oberfläche,
  gehashte Dateien ein Jahr im Cache, Schriften 30 Tage, alles andere `no-cache`, kein `Server`-
  und kein `Via`-Header
- `e2e/production.spec.ts`: 2 von 2 grün, null CSP-Verstösse, gegengeprüft mit drei absichtlichen
  Verstössen
- Speicher im Leerlauf nach einer Demo: Caddy 37 MiB, API 85 MiB, PostgreSQL 37 MiB, Garage 5 MiB

Unterwegs gefunden: Caddy sortiert gleichnamige `header`-Direktiven nach Pfad, eine Regel ohne Pfad
lief zuletzt und überschrieb die Cache-Regeln für `/assets` und `/fonts`. Die Matcher schliessen
einander jetzt aus.

**D4 im Einzelnen: Pflichtseiten und Lighthouse (6b).** Lighthouse lässt sich erst gegen die
laufende Domain prüfen und läuft deshalb in D6.

- **Impressum und Datenschutzerklärung**, aus der Fusszeile verlinkt. Kurz und wahr: ein technisch
  erforderliches Sitzungs-Cookie, keine Analyse, keine Einbettungen, keine Anfragen an Dritte.
  Vorher klären, was in den Logs landet: Caddy schreibt kein Zugriffsprotokoll, die API
  protokolliert aber Anfragen samt weitergereichter Client-Adresse (`X-Forwarded-For`). Entweder
  steht das in der Erklärung, oder die Adresse fliegt aus dem Log.
- **Urheberrechtsvermerk** in der Fusszeile und `LICENSE` im Repository. Ohne Lizenzdatei sind alle
  Rechte vorbehalten — das ist für ein Portfoliostück richtig, sollte aber dastehen statt sich aus
  dem Schweigen zu ergeben. Die Schriftlizenz (SIL OFL 1.1, IBM Plex) liegt bereits bei den Dateien.
- **SEO-Grundlage** für die Startseite: `robots.txt`, Canonical, Open-Graph-Bild, sprechende
  Meta-Angaben. Bei einer Single-Page-Anwendung bleibt das begrenzt — echtes SEO kann erst die
  Portfolio-Seite auf Next.js.
- **Lighthouse gegen die ausgerollte Seite**, alle Kategorien: Performance, Accessibility, Best
  Practices, SEO und **Agentic Browsing** (seit Lighthouse 13.3, Mai 2026, standardmässig dabei).
  Für Agentic Browsing fehlt bisher `llms.txt`; Barrierefreiheitsbaum und CLS (0.0004) stehen
  bereits gut. **WebMCP bewusst nicht** — die Anwendung liegt hinter einer Anmeldung, und einem
  Agenten Werkzeuge auf fremde Kundendaten zu geben wäre keine Verbesserung.

**D4, Ergebnis.** Impressum und Datenschutzerklärung, von jeder Seite aus verlinkt: öffentliche
Seiten in der Fusszeile, Team- und Kundenansicht unten in der Seitenleiste. Jede Aussage der
Datenschutzerklärung ist am laufenden Aufbau geprüft. Zwei davon stimmten vorher nicht und wurden
im Code korrigiert: das Request-Log schrieb Adresse, Browserkennung und Query mit, und das
Rate-Limit behielt Adressen beliebig lange. Anschrift und Kontakt stehen nicht im öffentlichen
Repository, sie kommen auf dem Server beim Bauen dazu, und ohne sie bricht der Build ab. Dazu
`LICENSE`, Vorschaubild, Meta-Angaben, `robots.txt`, `sitemap.xml` und `llms.txt`. Geprüft: axe
auf beiden Rechtsseiten in hell und dunkel, alle sechs Breiten ohne Überlauf, 177 von 177
End-to-End-Prüfungen, gegen den Produktionsaufbau 3 von 3.

**D5 im Einzelnen.** Sechs Jobs, alle grün im ersten Lauf nach dem Push:
[Lauf 34608472477](https://github.com/AdamBaranyi/tallyroom/actions/runs/34608472477). Werkzeuge,
Funde und die einzeln begründeten Ausnahmen stehen in `docs/SECURITY.md`.

**D6 im Einzelnen.** Erster Deploy am 11.09.2026 um 20:11, Stand `f66e086`, vom Betreiber
selbst ausgelöst (`infra/deploy.sh`, sudo auf dem Server). Bauen auf dem Server rund 42 Sekunden,
alle vier Dienste gesund, Sicherung vor der Migration angelegt, `443/udp` für HTTP/3 freigegeben.

Gegen `https://tallyroom.adambaranyi.xyz` geprüft:

- HTTP leitet mit 308 auf HTTPS; HTTP/2, HTTP/3 wird angeboten
- Zertifikat von Let's Encrypt bis 10.12.2026, Caddy erneuert selbst; TLS 1.2 und 1.3
- Alle Sicherheitsheader samt CSP wie im lokalen Aufbau
- `e2e/production.spec.ts`: 3 von 3 in der alten Fassung, samt Rundgang und Rollenwechsel
- Lighthouse, je zwei Läufe: mobil Leistung 98 bis 99, Barrierefreiheit 100, Best
  Practices 93, SEO 100; Desktop 100, 100, 93, 100. LCP mobil 2.0 bis 2.1 s, TBT 0 ms, CLS 0

Die 93 hatte zwei Ursachen: ein 401 von `/auth/me` bei jedem anonymen Besuch, rot in der
Konsole, und die stille `eval`-Probe von Zod (DIAGNOSTICS Nummer 17). Beide behoben, zweiter
Deploy am selben Abend um 20:40, Stand `26c97b6`. Danach dieselben Prüfungen:

- `e2e/production.spec.ts` in der geschärften Fassung: 3 von 3, kein CSP-Verstoss, kein
  Konsolenfehler
- Lighthouse, je zwei Läufe: mobil Leistung 98 bis 99, Barrierefreiheit, Best Practices und SEO
  je 100; Desktop in allen vier Kategorien 100. LCP mobil 2.0 bis 2.1 s, TBT 0 bis 10 ms, CLS 0

Bewusst so gelassen, weil der Nutzen den Eingriff nicht trägt:

- Die Weiterleitung von HTTP auf HTTPS nennt `Server: Caddy`. Die Seiten selbst nicht.
- Unbekannte Pfade antworten mit 200 und der Oberfläche, die dann zur Startseite führt. Ein
  echter 404 hiesse, jede Route der Oberfläche auch in Caddy zu pflegen.
- Schriften liegen 30 Tage im Cache, nicht ein Jahr: ihre Dateinamen tragen keinen Hash.
- Lighthouse zählt rund 75 KB JavaScript, die beim ersten Bild noch nicht laufen, vor allem aus
  React und Zod.

**D7 im Einzelnen: Sicherung.** Erledigt am 11.09.2026. Nächtlich `infra/backup.sh` über einen systemd-Timer: `pg_dump`, die
Dokumente logisch über die S3-Schnittstelle mit Prüfsumme je Objekt, eine Zählung je Tabelle,
14 Tage Aufbewahrung. `infra/restore-test.sh` spielt eine Sicherung in eine eigene PostgreSQL und
eine eigene Garage zurück und vergleicht Prüfsummen, Zeilenzahlen, Dokumente gegen Datenbank und
Objekt für Objekt. Lokal mit drei Demos: 16 Tabellen und 18 Dokumente, Probe bestanden. Die
Gegenprobe mit einem entfernten Dokument scheitert wie gewollt. Anleitung in `docs/BETRIEB.md`.

Nebenbei gefunden: `deploy.sh` lief unter `sh`, und in `pg_dump | gzip` zählte nur gzip. Ein
gescheiterter Dump hätte eine leere Sicherung ergeben und den Deploy in die Migration laufen
lassen. Jetzt bash mit `pipefail`. Und die README versprach einen Befehl zum Zurücksetzen von
Passwörtern, den es nicht gab; jetzt gibt es `admin:reset-password`.

Auf dem Server, nach dem dritten Deploy (`e6f72f3`) und mit einer frischen Demo: Timer
eingerichtet, nächster Lauf 12.09.2026 02:32; erste Sicherung über systemd in 4 s, 18 Dokumente;
Probe-Wiederherstellung bestanden — 16 Tabellen mit denselben Zeilenzahlen, 18 aktive Dokumente mit
Datei, 18 Objekte in der neuen Garage Prüfsumme für Prüfsumme gleich, Datenbank und Dokumente je in
rund einer Sekunde zurückgespielt.

Bewusst offen: die Kopie ausser Haus, bis der Hoster sagt, wie und wie lange er selbst sichert,
und eine Meldung, wenn eine Sicherung scheitert; heute steht das nur im Journal.

**D6b im Einzelnen: Rundgang durch die Demo.** Wunsch des Betreibers vom 11.09.2026, erledigt am
selben Tag; was gebaut ist, steht oben unter „Vier Sprachen und geschlossene Lücken". Anders als
geplant erklärt ein einziger Schritt alle Bereiche der Navigation, statt je Bereich einen: sechs
Schritte statt acht, und jeder Bereich trotzdem mit einem eigenen Satz. Keine Bibliothek: ein
fremdes Skript bräuchte eine Ausnahme in der CSP und brächte mehr, als der Rundgang braucht.

**D8 im Einzelnen: Fallstudie.** Sie erklärt Designentscheidungen aus Nutzeraufgaben, nicht aus
Geschmack.

## Bewusst zurückgestellt

| Punkt                                   | Warum                                                                 | Wann                           |
| --------------------------------------- | --------------------------------------------------------------------- | ------------------------------ |
| Secret- und Abhängigkeitsscan in der CI | Gehört zum Freigabeschritt                                            | Meilenstein 6, D5              |
| IPv6 auf dem Server                     | Die Route des Anbieters ist fehlerhaft, siehe Diagnose 13             | sobald der Anbieter sie behebt |
| Weitere Navigationseinträge             | Ein Menüpunkt ohne Seite wäre ein Versprechen, das die App nicht hält | mit der jeweiligen Funktion    |
| Passwort-Reset per E-Mail               | Ohne Mailversand nicht sauber baubar                                  | Backlog                        |
| Keycloak beziehungsweise OIDC           | Geprüft und verworfen, Begründung in `docs/ARCHITECTURE.md`           | Backlog                        |

## Blockiert

Nichts. Das fehlende IPv6 hält kein Ziel auf, denn die Seite ist über IPv4 vollständig
erreichbar.
