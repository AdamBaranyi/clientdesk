# Tallyroom

**Deutsch** · [English](README.en.md)

SaaS-Dashboard mit Kundenportal für kleine Digitalagenturen. Ein Team führt Kunden, Projekte,
monatliche Serviceverträge, Anfragen und Dokumente an einem Ort zusammen; Kunden sehen über ein
getrenntes Portal nur den ausdrücklich freigegebenen Teil davon.

Die Oberfläche gibt es auf Deutsch, Französisch, Italienisch und Englisch. Die französischen und
italienischen Texte sind nicht von Muttersprachlern geprüft; die Rechtsseiten erklären die deutsche
Fassung für verbindlich.

Portfolio-Projekt von Adam Baranyi. Alle Daten in der Anwendung sind erfunden.

> **Live seit dem 11.09.2026** unter <https://tallyroom.adambaranyi.xyz>, auf einem eigenen Server
> mit Caddy, Docker Compose und Let's Encrypt.
>
> **Stand: Meilenstein 6 von 6.** Alle Pflichtfunktionen stehen, samt isolierter Besucher-Demo mit
> Rollenwechsel und Kommandopalette. Vom Deployment sind die Etappen D0 bis D6 erledigt; offen sind
> D7 (Sicherung mit echtem Restore-Test) und D8 (Server-Anleitung, Rollback, Fallstudie). Der
> genaue Stand steht in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

## Technischer Aufbau

| Bereich                      | Eingesetzt                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------- |
| Laufzeit und Paketverwaltung | Bun 1.3.14                                                                    |
| Frontend                     | React 19.2, TypeScript 6.0.3 strict, Vite 8, React Router 8, TanStack Query 5 |
| Darstellung                  | Tailwind CSS 4.3, Lucide-Icons, IBM Plex Sans und Mono vom eigenen Server     |
| Backend                      | Express 5.2, TypeScript                                                       |
| Daten                        | PostgreSQL 18, Drizzle ORM 0.45 mit versionierten Migrationen                 |
| Dateien                      | Garage als S3-kompatibler Objektspeicher, privater Bucket                     |
| Anmeldung                    | Serverseitige Sessions, PostgreSQL-Session-Store, Argon2id                    |
| Tests                        | Vitest 5 gegen eine echte Testdatenbank, Playwright 1.57 mit axe              |
| Betrieb                      | Docker Compose, GitHub Actions                                                |

TypeScript ist bewusst auf 6.0.3 gepinnt und nicht auf 7: `typescript-eslint` unterstützt derzeit
nur `<6.1.0`, und eine grüne Lint-Pipeline ist mehr wert als die neueste Nebenversion.

## Einrichten

Voraussetzungen: [Bun](https://bun.sh) ab 1.3 und Docker.

```bash
bun install
cp .env.example .env
# SESSION_SECRET erzeugen und in .env eintragen:
openssl rand -base64 48
```

Datenbanken und Objektspeicher starten (Postgres auf 5440, Testdatenbank auf 5441, Garage als
S3-Speicher auf 3900):

```bash
docker compose -f infra/docker-compose.yml up -d
```

Garage legt Bucket und Zugangsschlüssel beim ersten Start selbst an. Der Bucket ist privat.
Dokumente sind ausschliesslich über die autorisierte API erreichbar — es gibt keine öffentliche URL
und keine vorsignierten Links.

Migrationen anwenden und ein internes Konto anlegen:

```bash
bun run db:migrate
bun run admin:create -- --email dein@konto.test --name "Vor Nachname" --workspace "Deine Agentur"
```

Der Befehl gibt ein zufälliges Passwort einmalig aus. Es gibt bewusst keine öffentliche
Registrierung — interne Konten entstehen über diesen Befehl, weitere über Einladungslinks. Ein
vergessenes Passwort setzt `bun run admin:reset-password -- --email dein@konto.test` neu, auch
das zufällig und einmalig ausgegeben; alle Sitzungen des Kontos enden dabei.

Alternativ einen Workspace mit Vorführdaten anlegen — acht erfundene Kunden, zwölf Projekte,
Meilensteine mit sinnvollen Fristen:

```bash
bun run seed:demo -- --email demo@tallyroom.test --password Dein-Passwort
```

Der Befehl legt zusätzlich zwei Kundenzugänge an und nennt sie am Ende. Damit lässt sich der
Unterschied zwischen Teamansicht und Kundenportal an denselben Daten vorführen: dieselbe Anfrage
zeigt dem Team einen internen Kommentar, den die Kundenansicht nicht kennt.

Alle Termine liegen relativ zum Ausführungstag, damit der Stand auch später noch stimmig aussieht.
Firmen und Personen sind erfunden.

Anwendung starten:

```bash
bun run dev
```

Weboberfläche auf <http://localhost:5173>, API auf <http://localhost:4000>. Der Vite-Server leitet
`/api` an die API weiter, damit Sitzungscookie und CSRF-Herkunftsprüfung ohne CORS funktionieren.

### Wenn der Start scheitert

`Port 5173 is already in use` heisst, dass dort noch etwas läuft. Der Port ist bewusst fest
gesetzt: wiche Vite auf 5174 aus, passte die Herkunft nicht mehr zur CSRF-Prüfung und die
Anmeldung schlüge ohne verständliche Meldung fehl.

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN   # zeigt, welcher Prozess den Port hält
```

Denselben Weg gibt es für die API auf Port 4000.

## Prüfbefehle

```bash
bun run verify   # Format, Dateilänge, Lint, Typen
bun run test     # Unit- und Integrationstests
```

Die Integrationstests brauchen die laufende Testdatenbank und `TEST_DATABASE_URL` aus der `.env`.
`bun run test` liest die Datei nicht selbst, deshalb lokal: `bun --env-file=.env run vitest run`.

Stand 11.09.2026: 207 Unit- und Integrationstests, 210 Playwright-Prüfungen über sechs Breiten
(samt axe, allen vier Sprachen und dem Rundgang) und eine Produktionsprüfung gegen den Liveserver
mit 3 von 3. Einzelheiten in [docs/TESTING.md](docs/TESTING.md).

### Performance messen

Nur lokal. Erzeugt einen eigenen Workspace mit 1'000 Kunden, 3'000 Projekten, 1'500 Verträgen und
10'000 Anfragen und misst danach die API:

```bash
bun run seed:load
bun run measure
```

Ohne diesen Seed gibt es nichts zu messen — eine genannte Laufzeit wäre erfunden. Die Ergebnisse
stehen in [docs/TESTING.md](docs/TESTING.md).

### Lighthouse und Bundle-Grösse

Gegen die Live-Seite am 11.09.2026, je zwei Läufe: mobil Leistung 98 bis 99, Barrierefreiheit,
Best Practices und SEO je 100; Desktop in allen vier Kategorien 100.

Die Startseite lädt 135.7 KB JavaScript (gzip). Teamansicht, Kundenportal und Rechtsseiten werden
erst beim Aufruf nachgeladen.

## Die Demo

Auf der Startseite legt „Demo starten" einen eigenen Workspace nur für diesen Besucher an — mit
vollständigem Beispieldatenbestand, fünf Identitäten und 60 Minuten Laufzeit. Danach räumt ein
Lauf alles weg: Daten, Sitzungen und Dateien.

Ein Banner kennzeichnet die Demo durchgehend und trägt den Rollenwechsel: drei interne
Identitäten und zwei Kundenzugänge. Der Wechsel wirkt nur innerhalb der eigenen Demo.

Eine neue Demo beginnt mit einem geführten Rundgang in sechs Schritten. Über das Demo-Banner lässt
er sich neu starten.

Grenzen in der Demo: 30 Kunden, 50 Projekte, 50 Verträge, 100 Anfragen. Eigene Dateien werden
nicht angenommen — für den Testupload gibt es ein enthaltenes Beispieldokument. Abschalten lässt
sich das Ganze über `DEMO_ENABLED=false`; dann existiert der Bereich nicht.

## Projektregeln

- **Höchstens 400 Zeilen je projekteigener Code-Datei.** Durchgesetzt durch die ESLint-Regel
  `max-lines` und zusätzlich durch `bun run check:file-length`, das auch Formate erfasst, die
  ESLint nicht sieht. Beides bricht die CI. Zählweise und der einzige Ausschluss stehen in
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **Bedienbar ab 320 CSS-Pixeln.** Geprüft bei 320, 375, 390, 768, 1024 und 1440 Pixeln.
  Ergebnisse in [docs/TESTING.md](docs/TESTING.md).
- **Erscheinungsbild:** Gerät, Hell oder Dunkel. Voreinstellung ist Gerät und folgt
  `prefers-color-scheme` ohne Neuladen.

## Dokumentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Aufbau, Datenmodell, Entscheidungen, Codequalität
- [docs/SECURITY.md](docs/SECURITY.md) — Bedrohungsübersicht, Schutzmassnahmen, geprüfte Fälle
- [docs/TESTING.md](docs/TESTING.md) — ausgeführte Tests, Prüfbreiten, bekannte Lücken
- [docs/DIAGNOSTICS.md](docs/DIAGNOSTICS.md) — Befunde mit Messung, Ursache und Behebung
- [docs/BETRIEB.md](docs/BETRIEB.md) — Sicherung, Probe-Wiederherstellung, Passwort auf dem Server
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) — erledigt, offen, blockiert

## Bewusst nicht enthalten

Diese Punkte fehlen als Entscheidung, nicht als Versehen:

- **Passwort-Reset per E-Mail.** Ohne Mailversand nicht sauber baubar. Passwörter setzt der
  Betreiber mit `admin:reset-password` neu.
- Zahlungen, Rechnungen, Stripe, Kalender, E-Mail-Versand, Echtzeit-Benachrichtigungen
- Mehrfaktor-Authentisierung und öffentliche Selbstregistrierung
- Weitere Währungen — im MVP ist alles CHF und monatlich
