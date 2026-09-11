# Arbeitsregeln für Tallyroom

Verbindlich für jede weitere Entwicklung an diesem Repository.

## Vor jeder Aufgabe

`IMPLEMENTATION_STATUS.md` lesen. Dort steht, was erledigt ist, was als Nächstes kommt und was
bewusst zurückgestellt wurde. Nicht neu anfangen, sondern fortsetzen.

## Harte Regeln

1. **Höchstens 400 Zeilen je projekteigener Code-Datei.** Einziger Ausschluss ist
   `apps/web/src/components/ui/` für unveränderten shadcn/ui-Quelltext, unter den Bedingungen in
   `docs/ARCHITECTURE.md`. Keine weiteren Ausnahmen, kein abgeschaltetes Linting.
2. **Bedienbar ab 320 CSS-Pixeln.** Kein unbeabsichtigtes waagerechtes Scrollen der Seite.
   `overflow-x: hidden` ist keine Lösung, sondern das Verstecken der Ursache.
3. **Keine erfundenen Ergebnisse.** Keine hartcodierten Kennzahlen im Produktivpfad, keine
   behaupteten Testläufe, keine Laufzeiten ohne Messung. Lieber "noch keine Daten" als eine Zahl.
4. **Keine nicht angeschlossenen Bedienelemente.** Ein Menüpunkt oder Knopf entsteht mit seiner
   Funktion, nicht davor.
5. **Autorisierung serverseitig bei jedem Request.** Eine `workspaceId` aus der URL ist eine
   Auswahl, keine Berechtigung. Fremde Objekte liefern 404, nicht 403.
6. **Interne Felder gehören nicht in Client-DTOs.** Nicht ausgeblendet — gar nicht erst enthalten.
7. **TypeScript strict bleibt an.** Keine pauschalen `any`, keine `@ts-ignore`, keine
   abgeschalteten Lint-Regeln zur Umgehung von Fehlern. Externe Daten zuerst mit Zod validieren.

## Aufbau einhalten

Geschäftsregeln im Service, SQL im Repository, React-Komponenten sehen die Datenbank nie.
Gemeinsame Typen und Schemas in `packages/contracts`. Keine Abstraktionsschicht auf Vorrat.

Bei wachsender Komplexität früh nach fachlicher Zuständigkeit trennen — Formular, Liste, Hook,
API-Client, Validierung, Service, Repository. Keine Dateien wie `part1.ts` oder eine Sammelhalde
in `utils.ts`.

## Vor jeder Meilenstein-Abnahme

```bash
bun run verify   # Format, Dateilänge, Lint, Typen
bun run test
```

Beides muss grün sein. Danach `IMPLEMENTATION_STATUS.md`, `docs/TESTING.md` und bei
sicherheitsrelevanten Änderungen `docs/SECURITY.md` nachführen — mit dem, was tatsächlich geprüft
wurde, und mit den offenen Grenzen.

## Sprache

Oberfläche und Dokumentation auf Deutsch mit Schweizer Schreibweise, kein ß. Code, Bezeichner und
Commit-Nachrichten auf Englisch. Geldbeträge in CHF, Datum `de-CH`, Zeitzone `Europe/Zurich`.
