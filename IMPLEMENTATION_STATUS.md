# Umsetzungsstand

Stand: 11.09.2026 · Meilensteine 1–5 und 6a abgeschlossen · Server eingerichtet · Meilenstein 6 in
Arbeit

166 Unit- und Integrationstests · 147 End-to-End-Prüfungen über sechs Breiten · Lint ohne Fehler
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

## Offen — Meilenstein 6: Deployment

Plan vom 11.09.2026, in dieser Reihenfolge:

| Etappe | Inhalt                                                                                   | Stand        |
| ------ | ---------------------------------------------------------------------------------------- | ------------ |
| D0     | Statusdatei und Diagnosen nachgeführt                                                    | erledigt     |
| D1     | Objektspeicher von MinIO auf Garage, zuerst lokal                                        | als Nächstes |
| D2     | Produktions-Images: API ohne Root-Rechte und mit geordnetem Herunterfahren, Web statisch | offen        |
| D3     | Produktions-Compose mit Caddy, Speichergrenzen, CSP; lokal geprüft, null CSP-Verstösse   | offen        |
| D4     | Pflichtseiten und SEO-Grundlage (6b), vor dem Livegang                                   | offen        |
| D5     | CI: Secret-Scan samt Git-Historie, Abhängigkeitsscan, Playwright, axe, Bundle-Budget     | offen        |
| D6     | Erster Deploy, Prüfungen gegen die Live-URL, Lighthouse, gemessene Ladezeiten            | offen        |
| D7     | Sicherung von Datenbank und Dateien, tatsächlich durchgeführter Restore-Test             | offen        |
| D8     | README mit Server-Einrichtung, Deploy und Rollback; Fallstudie                           | offen        |

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

**D4 im Einzelnen: Pflichtseiten und Lighthouse (6b).** Lighthouse lässt sich erst gegen die
laufende Domain prüfen und läuft deshalb in D6.

- **Impressum und Datenschutzerklärung**, aus der Fusszeile verlinkt. Kurz und wahr: ein technisch
  erforderliches Sitzungs-Cookie, keine Analyse, keine Einbettungen, keine Anfragen an Dritte.
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

**D8 im Einzelnen: Fallstudie.** Sie erklärt Designentscheidungen aus Nutzeraufgaben, nicht aus
Geschmack.

## Bewusst zurückgestellt

| Punkt                                   | Warum                                                                 | Wann                           |
| --------------------------------------- | --------------------------------------------------------------------- | ------------------------------ |
| Content Security Policy                 | Die benötigten Quellen stehen erst mit dem Deployment fest            | Meilenstein 6, D3              |
| Secret- und Abhängigkeitsscan in der CI | Gehört zum Freigabeschritt                                            | Meilenstein 6, D5              |
| IPv6 auf dem Server                     | Die Route des Anbieters ist fehlerhaft, siehe Diagnose 13             | sobald der Anbieter sie behebt |
| Weitere Navigationseinträge             | Ein Menüpunkt ohne Seite wäre ein Versprechen, das die App nicht hält | mit der jeweiligen Funktion    |
| Passwort-Reset per E-Mail               | Ohne Mailversand nicht sauber baubar                                  | Backlog                        |
| Keycloak beziehungsweise OIDC           | Geprüft und verworfen, Begründung in `docs/ARCHITECTURE.md`           | Backlog                        |

## Blockiert

Nichts. Das fehlende IPv6 hält kein Ziel auf, denn die Seite ist über IPv4 vollständig
erreichbar.
