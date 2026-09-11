# Sicherheit

Stand: Meilenstein 4. Was hier steht, ist implementiert und geprüft. Was fehlt, steht unter
"Offene Grenzen" — nicht als stillschweigende Lücke.

Keine Aussage in diesem Dokument bedeutet "vollständig sicher", "OWASP-zertifiziert" oder
"Penetrationstest bestanden". Alle Prüfungen laufen lokal und in der Testumgebung dieses Projekts,
nie gegen fremde Systeme.

## Bedrohungsübersicht

**Schützenswert:** Anmeldedaten, Sitzungen, Kundenstammdaten, interne Notizen und Kommentare,
Vertragswerte, hochgeladene Dokumente.

**Akteure:** anonyme Besucher, angemeldete interne Mitglieder (Owner, Member), angemeldete
Kundenbenutzer (Client), Demo-Besucher.

**Vertrauensgrenze:** zwischen Browser und API. Alles, was aus dem Browser kommt — Formularwerte,
IDs in der URL, Header, Cookies — ist unbestätigte Eingabe. Der Server prüft bei jedem Request neu.

**Wichtigste Missbrauchsfälle:**

| Fall                                   | Schutzmassnahme                                                                                       | Geprüft in                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Fremde Daten über manipulierte IDs     | Workspace-Kontext ausschliesslich aus `memberships`; zusammengesetzte Fremdschlüssel in der Datenbank | `tests/integration/tenant-isolation.test.ts`           |
| Konten durchprobieren                  | Gleiche Meldung und gleiche Laufzeit bei unbekannter E-Mail und falschem Passwort; Rate-Limit         | `tenant-isolation.test.ts`, `login-rate-limit.test.ts` |
| Übernahme einer Sitzung                | Sitzungs-ID-Rotation nach Login; Logout zerstört serverseitig; HttpOnly-Cookie                        | `tenant-isolation.test.ts`                             |
| Schreibende Requests von fremder Seite | CSRF-Token an die Sitzung gebunden plus Origin-Prüfung                                                | `tenant-isolation.test.ts`                             |
| Datenabfluss über Fehlermeldungen      | Fehlerantworten ohne SQL, Stacktraces oder Interna; Logs mit Redaction                                | `tenant-isolation.test.ts`                             |

## Umgesetzt

**Anmeldung.** Argon2id mit gesetzten Parametern (19 MiB, 2 Durchgänge, 1 Nebenläufigkeit). Bei
unbekannter E-Mail wird gegen einen Dummy-Hash geprüft, damit die Antwortzeit nicht verrät, welche
Adressen existieren. Fünf Versuche je IP in fünfzehn Minuten, konfigurierbar.

**Sitzungen.** HttpOnly, `SameSite=Lax`, `Secure` unter HTTPS, Speicher in PostgreSQL. Rotation der
Sitzungs-ID nach erfolgreicher Anmeldung gegen Session Fixation. Zwei Stunden Inaktivität, das
Cookie rollt bei Aktivität nach. Abmelden zerstört die Sitzung serverseitig — das alte Cookie wird
danach abgewiesen, nicht nur im Browser gelöscht.

**CSRF.** Zwei Prüfungen für jeden schreibenden Request: ein an die Sitzung gebundenes Token im
Header `X-CSRF-Token`, verglichen in konstanter Zeit, und die Herkunft aus `Origin` beziehungsweise
`Referer` gegen `APP_ORIGIN`. Ein fehlender Origin-Header bei einem schreibenden Request wird
abgewiesen, nicht durchgewinkt.

**Autorisierung.** Standardmässig verweigert. `requireWorkspace` schlägt die Mitgliedschaft
serverseitig nach; ohne sie gibt es 404 statt 403. `requireInternal` und `requireOwner` bauen
darauf auf. Versteckte Schaltflächen und schwer zu erratende IDs gelten nicht als Zugriffskontrolle.

**Eingaben.** Alle Nutzdaten werden mit Zod validiert, alles SQL läuft parametrisiert über Drizzle.
Umgebungsvariablen werden beim Start einmal geprüft; ein Platzhalter-`SESSION_SECRET` bricht den
Start ab.

**Fehler und Logs.** Antworten haben die Form `{ error: { code, message, requestId } }` ohne
Interna. Logs tragen Request-ID, Route, Status und Laufzeit; Cookie-, Authorization- und
CSRF-Header sowie Passwortfelder werden entfernt.

**Geheimnisse.** Nur Platzhalter in `.env.example`, `.env` ist ignoriert.

**Kundenansicht.** Das Portal hat eine eigene Zugriffsschicht. Jede Abfrage dort ist fest auf
einen Workspace und einen Kunden eingeschränkt und liefert nur freigegebene Inhalte — die
Einschränkung ist kein Parameter, den ein Aufrufer mitgibt. Client-DTOs blenden interne Felder
nicht aus, sie führen sie nicht: ein öffentlicher Kommentar hat kein Sichtbarkeitsfeld, weil
interne Kommentare die Servergrenze nie überschreiten. Ein Kundenzugang bekommt auf internen
Routen 404 statt 403 — ein 403 würde bestätigen, dass es den Bereich gibt.

**Dokumente.** Privater Bucket, keine öffentlichen URLs, keine vorsignierten Links. Beim Upload
werden Content-Type, tatsächlicher Dateianfang, Grösse und die Zugehörigkeit von Kunde und Projekt
serverseitig geprüft. Der Objektschlüssel ist zufällig und wird nie aus dem Dateinamen abgeleitet;
der Originalname ist Metadatum und wird von Pfadanteilen und Steuerzeichen befreit. Downloads
laufen über die autorisierte API, antworten als Anhang und tragen eine Richtlinie, die jede
Ausführung im Dokument unterbindet. Löschen nimmt die Sichtbarkeit sofort — auch wenn der
Objektspeicher gerade nicht erreichbar ist.

Der Objektspeicher ist Garage. Ohne Signatur antwortet er mit 403, eine Signatur für eine andere
Region weist er ab, und Website-Zugriff auf den Bucket ist aus. Geprüft beim Wechsel von MinIO am
11.09.2026. Nach aussen ist nur der S3-Port offen, lokal an `127.0.0.1` gebunden. Der RPC-Port
bleibt im Container-Netz.

**Einladungen.** Nur der Hash des Tokens wird gespeichert; der Link erscheint genau einmal beim
Anlegen. Rolle und Kundenbezug hängen an der Einladung, nicht am Request des Beitretenden. Die
Annahme entwertet die Einladung in derselben Transaktion, in der die Mitgliedschaft entsteht. Bei
einem bestehenden Konto muss die angemeldete Identität zur eingeladenen Adresse passen.

## Offene Grenzen

Ehrlich benannt, weil sie zu späteren Meilensteinen gehören:

- **Content Security Policy** ist noch nicht gesetzt (`contentSecurityPolicy: false` in Helmet).
  Sie kommt mit dem Deployment in Meilenstein 6, wenn die tatsächlich benötigten Quellen feststehen.
- **Secret-Scan und Abhängigkeitsscan** laufen noch nicht in der CI. Vorgesehen für Meilenstein 6.
- **Schriften** werden von Google Fonts geladen. Für Datenschutz und eine strenge CSP sollen sie
  selbst ausgeliefert werden — offen für Meilenstein 5.
- **Rate-Limit** liegt im Prozessspeicher und trägt nur eine API-Instanz.
- **Mehrfaktor-Authentisierung** ist bewusst nicht Teil des Umfangs.
- **Wiederholungslauf für fehlgeschlagene Speicherlöschungen** ist nicht gebaut. Betroffene
  Datensätze stehen auf `pending_deletion` und sind für jeden Zugriff bereits weg, die Datei
  bleibt aber im Objektspeicher liegen.
- **Rate-Limit auf Uploads** fehlt; begrenzt wird bisher nur die Anmeldung und die Einladung.

## Prüfprotokoll

| Datum      | Umfang                                                                       | Ergebnis       |
| ---------- | ---------------------------------------------------------------------------- | -------------- |
| 09.09.2026 | Meilenstein 1: Mandantentrennung, Sitzung, CSRF, Fehlerantworten, Rate-Limit | 28 Tests grün  |
| 09.09.2026 | Meilenstein 4: Kundenansicht, Uploads, Einladungen, Idempotenz               | 141 Tests grün |

Drei Befunde aus Meilenstein 4, alle behoben:

1. Ein zu grosser Upload antwortete mit 500. body-parser wirft einen eigenen Fehlertyp, der ohne
   Zuordnung als Serverfehler durchlief — für etwas, das der Aufrufer falsch gemacht hat.
2. Ein Dokument, dessen Löschung im Speicher fehlschlug, blieb abrufbar. Jetzt ist alles ausser
   `active` für jeden Zugriff verschwunden.
3. Ein Kundenzugang bekam auf dem Einladungsbereich 403 statt 404 und erfuhr damit, dass es ihn
   gibt.

Reproduzieren:

```bash
docker compose -f infra/docker-compose.yml up -d postgres_test
bun run test
```
