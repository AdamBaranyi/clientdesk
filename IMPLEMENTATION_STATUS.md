# Umsetzungsstand

Stand: 10.09.2026 · Meilensteine 1–5 und 6a abgeschlossen · Design-Überarbeitung abgeschlossen

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
`ClientDesk-Masterprompt-v3.md`, Abschnitt 5.

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

**Vier Fehler, die niemand gemeldet hätte:** ungeschichtetes CSS schlägt jede Tailwind-Utility
(zweimal zugeschlagen — Unterstreichung und Textfarbe), `flushSync` kommt gegen `startTransition`
nicht an, abgebrochene Seitenübergänge lecken unbehandelte Zurückweisungen, `--faint` erreicht
dunkel nur 3,7:1.

## Offen — nächste Schritte

**Abschluss Design** _(als Nächstes)_ — Vorher-Bilder aus einem `git worktree` auf `a998cfb`,
Nachher aus dem fertigen Stand, zweiter `avoid-ai-design`-Lauf im detect-Modus als Gegenprobe.

**Kommandopalette** — gebündelter Suchendpunkt `GET /workspaces/:w/search` über Kunden, Projekte,
Verträge und Anfragen, dazu ein Dialog mit Tastaturführung. Bekommt dieselben negativen
Mandantentests wie jeder andere Endpunkt.

**Meilenstein 6a: Frontend-Qualität** — **erledigt am 10.09.2026.**

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

**Meilenstein 6b: Pflichtseiten und Lighthouse** — teils erst mit laufender Domain prüfbar.

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

**Meilenstein 6: Deployment** — Produktions-Compose mit Caddy, FSIT-KVM-Server einrichten,
A-Record `clientdesk.adambaranyi.xyz`, Content Security Policy, Secret- und Abhängigkeitsscan in
der CI, Fallstudie. Die Fallstudie erklärt Designentscheidungen aus Nutzeraufgaben, nicht aus
Geschmack.

## Bewusst zurückgestellt

| Punkt                                   | Warum                                                                 | Wann                        |
| --------------------------------------- | --------------------------------------------------------------------- | --------------------------- |
| Content Security Policy                 | Die benötigten Quellen stehen erst mit dem Deployment fest            | Meilenstein 6               |
| Secret- und Abhängigkeitsscan in der CI | Gehört zum Freigabeschritt                                            | Meilenstein 6               |
| Schriften selbst ausliefern             | Derzeit Google Fonts; nötig für strenge CSP und Datenschutz           | Meilenstein 6a              |
| Weitere Navigationseinträge             | Ein Menüpunkt ohne Seite wäre ein Versprechen, das die App nicht hält | mit der jeweiligen Funktion |
| Passwort-Reset per E-Mail               | Ohne Mailversand nicht sauber baubar                                  | Backlog                     |
| Keycloak beziehungsweise OIDC           | Geprüft und verworfen, Begründung in `docs/ARCHITECTURE.md`           | Backlog                     |

## Blockiert

Nichts. Der FSIT-KVM-Server wird erst in Meilenstein 6 gebraucht. Meilenstein 6a ist bewusst
davorgesetzt, damit die Wartezeit auf die Bestellung nicht leer läuft.
