# Umsetzungsstand

Stand: 09.09.2026 · Meilenstein 5 von 6 abgeschlossen

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

## Offen — nächste Schritte

**Meilenstein 2: Kernablauf und Beispieldaten** _(als Nächstes)_

- Kunden anlegen, bearbeiten, archivieren mit Hinderungsgründen
- Projekte einem Kunden zuordnen, Meilensteine erledigen
- Vorführ-Seed: 8 Kunden, 12 Projekte, 18 Anfragen relativ zu einem Bezugsdatum
- Einfacher Demo-Login
- Integrationstests in die CI aufnehmen

**Meilenstein 3** _(als Nächstes)_ — Verträge, Preisversionen, Dashboard-Aggregationen,
Lastdaten-Seed, erste Messung
**Meilenstein 4** _(als Nächstes)_ — Rollen, Anfragen, Kommentar-Sichtbarkeit, MinIO,
Dokumentfreigabe, Einladungen
**Meilenstein 5** — Demo-Workspaces, Rollenwechsel, Limits, Cleanup, Feinschliff
**Meilenstein 6** — Deployment auf FSIT-KVM-Server, Caddy, End-to-End-Tests, Scans, Case Study

## Bewusst zurückgestellt

| Punkt                                   | Warum                                                                 | Wann                        |
| --------------------------------------- | --------------------------------------------------------------------- | --------------------------- |
| Content Security Policy                 | Die benötigten Quellen stehen erst mit dem Deployment fest            | Meilenstein 6               |
| Secret- und Abhängigkeitsscan in der CI | Gehört zum Freigabeschritt                                            | Meilenstein 6               |
| Schriften selbst ausliefern             | Derzeit Google Fonts; nötig für strenge CSP und Datenschutz           | Meilenstein 5               |
| Weitere Navigationseinträge             | Ein Menüpunkt ohne Seite wäre ein Versprechen, das die App nicht hält | mit der jeweiligen Funktion |
| Passwort-Reset per E-Mail               | Ohne Mailversand nicht sauber baubar                                  | Backlog                     |
| Keycloak beziehungsweise OIDC           | Geprüft und verworfen, Begründung in `docs/ARCHITECTURE.md`           | Backlog                     |

## Blockiert

Nichts. Der FSIT-KVM-Server wird erst in Meilenstein 6 gebraucht und ist bewusst noch nicht bestellt.
