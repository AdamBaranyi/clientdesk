# Architektur

## Form

Ein modularer Monolith in einem Repository. Frontend und API haben getrennte Verantwortlichkeiten,
teilen sich aber Typen und Validierung. Keine Microservices, kein Kubernetes, keine Queue — die
beschriebenen Abläufe brauchen nichts davon, und jede zusätzliche Schicht wäre eine, die im
Vorstellungsgespräch erklärt werden müsste, ohne einen Zweck zu erfüllen.

```
apps/web         React-Oberfläche, Vite
apps/api         Express-API, Sessions, Autorisierung
packages/db      Schema, Migrationen, Datenbankzugriff, Passwort-Hashing
packages/contracts  DTOs und Zod-Schemas, von beiden Seiten benutzt
tests/           Integrationstests gegen eine echte Testdatenbank
infra/           Docker Compose
```

## Wo eine Funktion liegt

Am Beispiel der Anmeldung — dasselbe Muster gilt für jede spätere Funktion:

| Aufgabe                 | Ort                                          |
| ----------------------- | -------------------------------------------- |
| Oberfläche              | `apps/web/src/features/auth/LoginPage.tsx`   |
| Serverzustand im Client | `apps/web/src/features/auth/use-session.ts`  |
| HTTP-Route              | `apps/api/src/modules/auth/routes.ts`        |
| Geschäftsregel          | `apps/api/src/modules/auth/service.ts`       |
| SQL                     | `apps/api/src/modules/auth/repository.ts`    |
| Gemeinsames Schema      | `packages/contracts/src/auth.ts`             |
| Tabellen                | `packages/db/src/schema/`                    |
| Test                    | `tests/integration/tenant-isolation.test.ts` |

Regeln werden im Service geprüft, SQL steht im Repository, React-Komponenten sehen die Datenbank
nie. Es gibt bewusst keine allgemeine Abstraktionsschicht für alles, was später einmal kommen
könnte.

## Mandantentrennung

Drei Begriffe, die im Datenmodell nicht vermischt werden:

- **Workspace** — die Agentur, also der Mandant.
- **Kunde** (`customers`) — ein Datensatz innerhalb einer Agentur.
- **Kundenbenutzer** — ein Konto mit einer Mitgliedschaft der Rolle `client`, die auf genau einen
  Kundendatensatz zeigt.

Die Zugehörigkeit entsteht ausschliesslich in `memberships`. Eine `workspaceId` aus der URL ist
eine Auswahl, keine Berechtigung: `requireWorkspace` schlägt sie in der Datenbank nach und legt
erst danach `req.workspace` an. Fehlt die Mitgliedschaft, ist die Antwort **404 und nicht 403** —
ein 403 würde bestätigen, dass diese ID existiert.

Auf Datenbankebene stützen das zusammengesetzte Fremdschlüssel ab: eine Kindtabelle trägt
`workspace_id` mit und verweist auf `(id, workspace_id)` der Elterntabelle. Ein Projekt kann so
gar nicht zu einem Kunden eines fremden Workspace gehören, auch nicht bei einem Fehler im Service.

## Entscheidungen

**Sitzungen statt Tokens.** Serverseitige Sessions im PostgreSQL-Store. Eine Abmeldung wirkt damit
sofort und serverseitig; bei einem JWT müsste dafür erst eine Sperrliste gebaut werden. Kein Token
und keine Rolle im Local Storage — beides wäre eine Vertrauensquelle im Browser.

**Argon2id mit gesetzten Parametern.** 19 MiB Speicher, 2 Durchgänge, 1 Nebenläufigkeit nach
OWASP-Empfehlung — ausgeschrieben statt Bibliotheks-Default, damit der Kostenfaktor im Repository
nachvollziehbar ist.

**Geld als Ganzzahl in Rappen.** `monthly_amount_minor` ist `integer`. Gleitkomma hat bei Geld
nichts zu suchen.

**Preisversionen statt Preisänderung.** `contract_rates` speichert je Vertrag Wirksamkeitsdaten.
Eine Anpassung oder Beendigung verändert historische Monatswerte damit nicht rückwirkend.

**Optimistic Locking.** Kernobjekte tragen `version`. Zwei gleichzeitige Bearbeitungen
überschreiben sich nicht unbemerkt, die zweite bekommt 409.

**Bun statt Node.** Schnellere Installation und Ausführung, TypeScript läuft direkt ohne
Transpilat. Für den Server entsteht deshalb kein Build-Artefakt; `build` prüft dort nur die Typen.

**Kein Keycloak.** Geprüft und verworfen: die Rollen hängen hier an `(workspace, customer)` und
nicht an Realms oder Gruppen, die Demo legt pro Besucher Wegwerf-Identitäten an, und die negativen
Sicherheitstests wären gegen einen externen Identitätsanbieter deutlich schwerer zu schreiben.
Eine spätere Anbindung über OIDC bleibt möglich und steht im Backlog.

## Bekannte Reibungspunkte

**Session-Tabelle.** `connect-pg-simple` gibt das Schema von `session` vor, nicht dieses Projekt.
Die Tabelle steht trotzdem in `packages/db/src/schema/sessions.ts`, damit ein frischer Checkout
allein über die Migrationen startet. Über Drizzle wird sie nie beschrieben.

**Rate-Limit im Prozessspeicher.** Reicht bei einer API-Instanz. Bei mehreren Instanzen gehört der
Zähler in einen gemeinsamen Speicher.

**Passwort-Hashing im Datenbankpaket.** Eigentlich eine API-Aufgabe, liegt aber in
`packages/db/src/auth/password.ts`, weil auch der Admin-Befehl es braucht und dieses Paket die
Anmeldedaten ohnehin speichert.

## Codequalität

### Die 400-Zeilen-Regel

Keine projekteigene Code-Datei überschreitet **400 physische Zeilen einschliesslich Leerzeilen und
Kommentaren**. Ein einzelner abschliessender Zeilenumbruch zählt nicht als weitere Zeile.

Durchgesetzt an zwei Stellen:

- ESLint-Regel `max-lines` mit `skipBlankLines: false` und `skipComments: false` für
  JavaScript, TypeScript und JSX.
- `bun run check:file-length` für alle projekteigenen Code-Dateien einschliesslich CSS, SQL und
  CI-YAML, die ESLint nicht erfasst. Der Befehl läuft über das Dateisystem und findet deshalb
  auch neue, noch nicht eingecheckte Dateien. Bei einem Verstoss nennt er Pfad und Zeilenzahl und
  endet mit einem Exit-Code ungleich null.

Die Zählweise ist in `scripts/check-file-length.test.mjs` festgehalten, inklusive der Grenzfälle
399, 400 und 401 Zeilen mit und ohne abschliessenden Zeilenumbruch.

400 ist eine Obergrenze, kein Zielwert.

### Der einzige Ausschluss: shadcn/ui

`apps/web/src/components/ui/` ist von der Prüfung ausgenommen. Dort liegt unveränderter
shadcn/ui-Quelltext: das Projekt kopiert Komponenten als Quelltext ins Repository, mehrere davon
sind von Haus aus länger als 400 Zeilen, und es ist eingekaufter Fremdcode.

Bedingungen für diesen Ausschluss:

1. In dem Verzeichnis stehen keine eigenen Komponenten und keine Geschäftslogik.
2. Wird eine Datei dort inhaltlich angepasst — über Klassennamen und Farbtokens hinaus — wandert
   sie nach `apps/web/src/components/` und fällt wieder unter die Regel.
3. Aufgenommene Komponenten werden hier mit ihrer Zeilenzahl aufgeführt.

**Derzeit aufgenommen:** keine. Das Verzeichnis existiert noch nicht.

Weiter ausgenommen: `packages/db/migrations/` (von Drizzle erzeugt) und `tests/fixtures/`
(reine Daten). Beide Ausnahmen erlauben keine Verlagerung eigener Logik.

### Weitere Regeln

TypeScript strict inklusive `noUncheckedIndexedAccess` und `exactOptionalPropertyTypes`. Keine
pauschalen `any`, keine `@ts-ignore`, keine abgeschalteten Lint-Regeln zur Umgehung von Fehlern.
Externe Daten werden zuerst mit Zod validiert. Die zwei Lint-Ausnahmen in `eslint.config.js` sind
begründet: `no-namespace` für Express-Typerweiterungen, die ohne Declaration Merging nicht gehen,
und `no-console` für Befehlszeilenwerkzeuge, deren Ausgabe die Konsole ist.

## Erscheinungsbild

Ein Tokensatz in `apps/web/src/styles/tokens.css`, zwei Wertesätze. Der helle Satz steht auf
`:root` und ist damit immer definiert; der dunkle greift über `prefers-color-scheme` für die
Gerätewahl und über `[data-theme="dark"]` für die ausdrückliche Wahl. Kein Wert ist ausschliesslich
in einem Media-Block definiert — sonst fehlte er, sobald jemand ausdrücklich umschaltet.

Die Wahl hat drei Zustände: Gerät, Hell, Dunkel. Gerät ist die Voreinstellung und folgt der
Systemeinstellung ohne Neuladen. Die Wahl liegt im `localStorage`; ein nicht lesbarer Speicher
(privates Fenster) fällt still auf Gerät zurück und stoppt die Anwendung nicht.
