/*
 * Zod prüft beim ersten Objektschema mit `new Function`, ob es schnelleren
 * Prüfcode erzeugen darf. Die CSP verbietet das (`script-src 'self'`); der
 * Versuch scheitert still und zählt trotzdem als CSP-Verstoss. Ohne JIT
 * entfällt die Probe, und die Oberfläche prüft nur wenige, kleine Antworten.
 *
 * Zod liest seine Einstellungen aus `globalThis.__zod_globalConfig` und legt
 * das Objekt nur an, wenn es fehlt. Diese Datei muss also vor Zod laufen.
 * Ein Import im Einstieg kam zu spät: Zod liegt mit den Schemas in einem
 * gemeinsamen Bündel, und das wird vor dem Code des Einstiegs ausgewertet.
 * Deshalb liegt sie ungebündelt hier und steht in index.html als erstes
 * Skript, mit `defer` — solche Skripte und Module laufen in der Reihenfolge
 * des Dokuments.
 *
 * Hängt an einem inneren Detail von Zod. Ändert es sich, meldet
 * e2e/production.spec.ts den Verstoss wieder.
 */
globalThis.__zod_globalConfig = { ...globalThis.__zod_globalConfig, jitless: true };
