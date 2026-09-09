# ClientDesk

SaaS-Dashboard mit Kundenportal für kleine Digitalagenturen. Ein Team führt Kunden, Projekte,
monatliche Serviceverträge, Anfragen und Dokumente an einem Ort zusammen; Kunden sehen über ein
getrenntes Portal nur den ausdrücklich freigegebenen Teil davon.

Portfolio-Projekt von Ádám Baranyi. Alle Daten in der Anwendung sind erfunden.

> **Stand: Meilenstein 1 von 6.** Anmeldung, Workspace-Kontext, Datenmodell und Prüfpipeline
> stehen. Kunden, Projekte, Verträge, Anfragen, Dokumente und das Kundenportal folgen in den
> nächsten Schritten. Der genaue Stand steht in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

## Technischer Aufbau

| Bereich                      | Eingesetzt                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------- |
| Laufzeit und Paketverwaltung | Bun 1.3.14                                                                    |
| Frontend                     | React 19.2, TypeScript 6.0.3 strict, Vite 8, React Router 8, TanStack Query 5 |
| Darstellung                  | Tailwind CSS 4.3, Lucide-Icons, Space Grotesk und JetBrains Mono              |
| Backend                      | Express 5.2, TypeScript                                                       |
| Daten                        | PostgreSQL 18, Drizzle ORM 0.45 mit versionierten Migrationen                 |
| Anmeldung                    | Serverseitige Sessions, PostgreSQL-Session-Store, Argon2id                    |
| Tests                        | Vitest 5, Integrationstests gegen eine echte Testdatenbank                    |
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

Datenbanken starten (Entwicklung auf Port 5440, Tests auf 5441):

```bash
docker compose -f infra/docker-compose.yml up -d
```

Migrationen anwenden und ein internes Konto anlegen:

```bash
bun run db:migrate
bun run admin:create -- --email dein@konto.test --name "Vor Nachname" --workspace "Deine Agentur"
```

Der Befehl gibt ein zufälliges Passwort einmalig aus. Es gibt bewusst keine öffentliche
Registrierung — interne Konten entstehen über diesen Befehl, weitere später über Einladungslinks.

Anwendung starten:

```bash
bun run dev
```

Weboberfläche auf <http://localhost:5173>, API auf <http://localhost:4000>. Der Vite-Server leitet
`/api` an die API weiter, damit Sitzungscookie und CSRF-Herkunftsprüfung ohne CORS funktionieren.

## Prüfbefehle

```bash
bun run verify   # Format, Dateilänge, Lint, Typen
bun run test     # Unit- und Integrationstests
```

`bun run test` braucht die laufende Testdatenbank und `TEST_DATABASE_URL` aus der `.env`.

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
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) — erledigt, offen, blockiert

## Bewusst nicht enthalten

Diese Punkte fehlen als Entscheidung, nicht als Versehen:

- **Passwort-Reset per E-Mail.** Ohne Mailversand nicht sauber baubar. Passwörter werden über den
  Admin-Befehl zurückgesetzt.
- Zahlungen, Rechnungen, Stripe, Kalender, E-Mail-Versand, Echtzeit-Benachrichtigungen
- Mehrfaktor-Authentisierung und öffentliche Selbstregistrierung
- Weitere Währungen — im MVP ist alles CHF und monatlich
