# Betrieb

Was auf dem Server zu tun ist, und wie. Alle Befehle mit `sudo` führt der Betreiber selbst aus;
das Passwort dafür kennt niemand sonst.

Der Server hält die Anwendung in `/opt/tallyroom`, einem Checkout des Repositorys auf dem gerade
laufenden Stand. Geheimnisse liegen nur dort, in `infra/.env.production`, lesbar nur für root.

## Sicherung

Jede Nacht um 02:30 Zürcher Zeit sichert `infra/backup.sh` die Datenbank und alle Dokumente
nach `/var/backups/tallyroom/<Zeitstempel>/`:

| Datei                | Inhalt                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `datenbank.sql.gz`   | `pg_dump`, eine in sich stimmige Momentaufnahme                                           |
| `dokumente.jsonl.gz` | jedes Objekt des Buckets, je Objekt mit SHA-256                                           |
| `zaehlung.txt`       | Zeilen je Tabelle zum Zeitpunkt der Sicherung                                             |
| `SHA256SUMS`         | Prüfsummen der drei Dateien, entsteht zuletzt: fehlt sie, ist die Sicherung unvollständig |

Die Dokumente werden über die S3-Schnittstelle gesichert, nicht als Kopie der Garage-Ordner. Die
Sicherung passt damit in jeden S3-Speicher, nicht nur in dieselbe Garage-Version. Behalten werden
14 Tage; die Sicherung, die jeder Deploy vor der Migration anlegt (`vor-deploy-*.sql.gz`), 30
Tage.

Der Ordner ist nur für root lesbar. Er enthält Passwort-Hashes und alles, was in der Anwendung
steht.

### Einrichten, einmalig

```bash
ssh -t vps1 'sudo sh -c "install -m 644 /opt/tallyroom/infra/systemd/tallyroom-backup.service /opt/tallyroom/infra/systemd/tallyroom-backup.timer /etc/systemd/system/ && systemctl daemon-reload && systemctl enable --now tallyroom-backup.timer && systemctl list-timers --no-pager tallyroom-backup.timer"'
```

### Kontrollieren

```bash
ssh -t vps1 'sudo systemctl list-timers --no-pager tallyroom-backup.timer; sudo journalctl -u tallyroom-backup -n 20 --no-pager'
```

Die erste Zeile zeigt den nächsten und den letzten Lauf, die zweite das Ergebnis. `--no-pager`
gehört dazu: über `ssh -t` öffnet systemd sonst eine Blätteransicht, und alles Folgende wartet,
bis jemand `q` drückt.

### Meldung beim Anmelden

Damit ein Fehlschlag nicht nur im Journal steht, sagt es der Server bei jeder Anmeldung:

```bash
ssh -t vps1 'sudo install -m 755 /opt/tallyroom/infra/motd/99-tallyroom-backup /etc/update-motd.d/'
```

Danach steht bei jedem `ssh vps1` eine Zeile im Begrüssungstext — «Sicherung: 12.09.2026 02:30 in
Ordnung», «SICHERUNG FEHLGESCHLAGEN …» samt Befehl zum Nachsehen, oder ein Hinweis, wenn der
letzte Lauf über 26 Stunden her ist und damit einer fehlt. Die Auskunft kommt von systemd selbst,
ohne fremden Dienst und ohne Geheimnis auf dem Server.

Das ersetzt keine Meldung aufs Telefon: Wer sich zwei Wochen nicht anmeldet, erfährt zwei Wochen
nichts. Für echte Kundendaten wäre eine Benachrichtigung nach aussen fällig — dann mit dem
Aufwand, den ein weiterer Dienst und sein Geheimnis mit sich bringen.

## Probe-Wiederherstellung

```bash
ssh -t vps1 'sudo /opt/tallyroom/infra/restore-test.sh'
```

Spielt die neueste Sicherung in eine eigene PostgreSQL und eine eigene Garage zurück, in einem
internen Docker-Netz ohne Verbindung nach aussen, und vergleicht vier Dinge: die Prüfsummen, die
Zeilen je Tabelle mit der Zählung von damals, ob jedes aktive Dokument der Datenbank seine Datei
im Archiv hat, und ob in der neuen Garage Objekt für Objekt dasselbe ankam. Der laufende Betrieb
merkt davon nichts. Danach ist alles wieder entfernt.

Einmal im Monat, und nach jeder Änderung an Datenbank oder Speicher. Eine Sicherung, die nie
zurückgespielt wurde, ist eine Hoffnung.

## Im Ernstfall: zurückspielen

Bewusst kein Skript: dieser Weg überschreibt den laufenden Bestand und soll nicht aus Versehen
starten. Vorher die Probe mit derselben Sicherung laufen lassen. Alles in einer root-Shell
(`ssh -t vps1 'sudo -i'`).

```bash
cd /opt/tallyroom
B=/var/backups/tallyroom/<Zeitstempel>
compose() { docker compose -f infra/compose.prod.yml --env-file infra/.env.production "$@"; }
export TALLYROOM_VERSION=$(git rev-parse --short HEAD)

# 1. Anwendung anhalten, Datenbank und Speicher laufen weiter
compose stop caddy api

# 2. Datenbank leeren und zurückspielen
compose exec -T postgres psql -U tallyroom -d postgres -c 'drop database tallyroom with (force)'
compose exec -T postgres psql -U tallyroom -d postgres -c 'create database tallyroom'
gunzip -c "$B/datenbank.sql.gz" | compose exec -T postgres psql -q -v ON_ERROR_STOP=1 -U tallyroom -d tallyroom

# 3. Dokumente zurückspielen; vorhandene Objekte mit demselben Schlüssel werden überschrieben
gunzip -c "$B/dokumente.jsonl.gz" | compose --profile tools run --rm -T migrate bun apps/api/src/cli/documents-backup.ts import

# 4. Anwendung starten
compose up -d --wait
```

## Passwort vergessen

Es gibt keinen Mailversand und damit keinen Link zum Zurücksetzen. Der Betreiber setzt ein neues,
zufälliges Passwort und gibt es weiter:

```bash
ssh -t vps1 'sudo sh -c "cd /opt/tallyroom && TALLYROOM_VERSION=\$(git rev-parse --short HEAD) docker compose -f infra/compose.prod.yml --env-file infra/.env.production --profile tools run --rm migrate bun packages/db/src/cli/reset-password.ts --email <adresse>"'
```

Ganz unter `sudo`, auch `git`: das Repository gehört root, und Git verweigert anderen Benutzern
dort jeden Befehl.

Das Passwort erscheint einmal. Alle Sitzungen des Kontos enden. Lokal: `bun run
admin:reset-password -- --email <adresse>`.

## Offen

- **Kopie ausser Haus.** Die Sicherungen liegen auf demselben Server wie die Anwendung. Fällt
  der Server aus, sind beide weg. Entscheid folgt nach der Antwort des Hosters, wie und wie lange
  er selbst sichert. Eine Kopie ausser Haus wird verschlüsselt, bevor sie den Server verlässt.
- **Meldung nach aussen bei einer gescheiterten Sicherung.** Seit dem 12.09.2026 sagt es der
  Server beim Anmelden (siehe oben); wer sich nicht anmeldet, erfährt es weiterhin nicht. Eine
  Meldung aufs Telefon kommt, sobald hier echte Kundendaten liegen — Entscheid des Betreibers.
  Sie kostet einen weiteren Dienst und ein Geheimnis auf dem Server.
