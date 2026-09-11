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

## Sprachen

Deutsch, Französisch, Italienisch und Englisch, für Oberfläche und API-Meldungen. Die Liste steht
an genau einer Stelle, `LOCALES` in `packages/contracts/src/i18n.ts`. Kommt eine Sprache dazu,
meldet der Compiler jede Stelle, an der ihr Text fehlt: Kataloge der Oberfläche, Meldungen der
API, Prüfmeldungen der Schemas.

**Oberfläche.** Ein Katalog je Bereich, alle Sprachen nebeneinander in einer Datei, gebaut mit
`defineMessages`. Deutsch gibt die Form vor; ein fehlender oder überzähliger Schlüssel oder eine
Funktion mit anderen Parametern bricht den Typecheck. Begriffe, die mehrere Bereiche teilen —
Zustände, Prioritäten, Rollen —, stehen einmal in `apps/web/src/i18n/domain-messages.ts`.
Formate bleiben in jeder Sprache schweizerisch: `CHF 2'970.00`, `11.09.2026`.

**Welche Sprache.** Eine frühere Wahl, sonst die Wünsche des Browsers, sonst Deutsch. Die Wahl
liegt im Browser, setzt das `lang`-Attribut und geht als `Accept-Language` an die API. Nach einem
Wechsel wird neu geholt, was der Server schon in der alten Sprache geschickt hat.

**API.** Die Sprache gilt je Request und liegt in `AsyncLocalStorage`. Meldungen entstehen tief
in Services und Schemas; ein Sprachparameter müsste sonst durch jede Funktion bis dorthin gereicht
werden. `HttpError` nimmt eine Meldung nur in allen Sprachen zugleich, ein einzelner String
kompiliert nicht. Die gemeinsamen Zod-Schemas lösen ihre Meldungen erst beim Prüfen auf, so dient
dasselbe Schema der Oberfläche in jeder Sprache und der API.

**Was nicht übersetzt wird.** Inhalte, die Nutzer anlegen, und die erfundenen Daten der Demo. Das
sind Kundendaten, keine Oberfläche. Die Rechtsseiten in Französisch, Italienisch und Englisch sagen,
dass die deutsche Fassung gilt.

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

### Die Kennzahlenregel, ausgeschrieben

Ein Vertrag zählt am Datum D, wenn er **bestätigt** ist, `start_date <= D` gilt und `end_date`
leer ist oder `D < end_date` — das Enddatum ist **exklusiv**. Sein Betrag ist die letzte
Preisversion mit `effective_from <= D`. Der monatliche Vertragswert ist die Summe dieser Beträge.

Umgesetzt in `apps/api/src/modules/contracts/metrics.ts` als LATERAL-Join: er liefert je Vertrag
genau eine Preiszeile. Ein gewöhnlicher Join auf `contract_rates` würde jeden Vertrag mit mehreren
Preisversionen mehrfach zählen — dafür gibt es einen eigenen Test.

Ein Vertrag ohne gültige Preisversion wird von der Summe **ausgeschlossen**, nicht als null
gezählt. Entstehen kann das nicht, weil beim Anlegen eine Preisversion ab Vertragsbeginn Pflicht
ist; `contractsWithoutRate` macht den Fall trotzdem sichtbar, statt ihn zu verschlucken.

Der Verlauf rechnet zu Monatsenddaten, für den laufenden Monat zum heutigen Datum — und
beschriftet ihn entsprechend. Es ist der vertraglich vereinbarte Monatswert, kein Zahlungseingang
und kein buchhalterischer Umsatz; die Oberfläche sagt das an jeder Stelle dazu.

**Optimistic Locking.** Kernobjekte tragen `version`. Zwei gleichzeitige Bearbeitungen
überschreiben sich nicht unbemerkt, die zweite bekommt 409.

**Bun statt Node.** Schnellere Installation und Ausführung, TypeScript läuft direkt ohne
Transpilat. Für den Server entsteht deshalb kein Build-Artefakt; `build` prüft dort nur die Typen.

**Garage statt MinIO.** Der Objektspeicher war bis Meilenstein 6 MinIO. Dessen
Community-Repository ist seit dem 12.02.2026 archiviert, fertige Images gibt es seit Oktober 2025
nicht mehr, und das gepinnte `RELEASE.2025-09-07` hätte nie wieder eine Sicherheitskorrektur
bekommen. Für einen öffentlichen Server ist das kein Zustand. Garage ist S3-kompatibel, gepflegt
und legt im Einzelserver-Modus Schlüssel und Bucket beim ersten Start selbst an. Der Code merkt
davon nichts, weil er nur Schreiben, Lesen und Löschen über Buns eingebauten S3-Client nutzt, keine
Eigenheit eines Anbieters. Lizenz AGPL-3.0; Garage läuft als eigenständiger, unveränderter Dienst,
für diesen Code entstehen daraus keine Pflichten.

**Kein Keycloak.** Geprüft und verworfen: die Rollen hängen hier an `(workspace, customer)` und
nicht an Realms oder Gruppen, die Demo legt pro Besucher Wegwerf-Identitäten an, und die negativen
Sicherheitstests wären gegen einen externen Identitätsanbieter deutlich schwerer zu schreiben.
Eine spätere Anbindung über OIDC bleibt möglich und steht im Backlog.

## Bekannte Reibungspunkte

**Session-Tabelle.** `connect-pg-simple` gibt das Schema von `session` vor, nicht dieses Projekt.
Die Tabelle steht trotzdem in `packages/db/src/schema/sessions.ts`, damit ein frischer Checkout
allein über die Migrationen startet. Drizzle löscht dort nur Zeilen, beim Aufräumen abgelaufener
Demos und nach einem Passwortwechsel. Angelegt und geändert werden sie ausschliesslich von
connect-pg-simple.

**Nebel im Hero, selbst gebaut.** Die Startseite zeigt einen fliessenden Farbnebel in Kobalt. Das
Vorbild, der «Fog»-Effekt von Vanta.js, braucht three.js: 155 KB gzip, mehr als die ganze
Startseite, und Vanta wird seit 2023 nicht mehr gepflegt. Ein eigener Fragment-Shader leistet
dasselbe mit 2.9 KB, nachgeladen, sobald der Browser nichts mehr zu tun hat. Er rechnet in einem
Drittel der Auflösung und höchstens 30-mal je Sekunde, steht still, wenn niemand hinsieht, und
hinter dem Text mischt er höchstens 18 Prozent Farbe bei. Nur auf der Startseite: in der App wäre
Dauerbewegung hinter Zahlen eine Störung, keine Stimmung.

**Nachladen nach Bereich.** Die Startseite lädt nur Startseite, Anmeldung und Einladung.
Teamansicht, Kundenportal und Rechtsseiten sind eigene Bündel und kommen beim ersten Aufruf, das
Diagramm innerhalb der Teamansicht noch einmal getrennt. Ein Besucher der Startseite braucht keine
Vertragsformulare, ein Kunde im Portal keine Teamansicht. Die Grenze für die Erstlast steht in
`scripts/check-bundle-size.mjs`, die CI hält sie.

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
