#!/bin/bash
# Nächtliche Sicherung von Datenbank und Dokumenten. Läuft über den
# systemd-Timer in infra/systemd/, von Hand:
#
#   sudo /opt/tallyroom/infra/backup.sh
#
# Je Lauf ein Ordner unter /var/backups/tallyroom/<Zeitstempel>/:
#
#   datenbank.sql.gz     pg_dump, eine in sich stimmige Momentaufnahme
#   dokumente.jsonl.gz   jedes Objekt des Buckets, mit Prüfsumme je Objekt
#   zaehlung.txt         Zeilen je Tabelle, zum Vergleich beim Zurückspielen
#   SHA256SUMS           Prüfsummen der drei Dateien; entsteht zuletzt und
#                        markiert die Sicherung damit als vollständig
#
# Behalten werden 14 Tage, die Sicherungen vor einem Deploy 30 Tage.
# Ob eine Sicherung taugt, zeigt erst infra/restore-test.sh.
#
# bash statt sh wegen pipefail: in `pg_dump | gzip` zählt sonst nur gzip,
# und ein gescheiterter Dump ergäbe eine leere, aber «erfolgreiche» Sicherung.
set -euo pipefail

cd "$(dirname "$0")/.."
ENV_FILE="${ENV_FILE:-infra/.env.production}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/tallyroom}"
KEEP_DAYS="${KEEP_DAYS:-14}"
# Das Image des laufenden Stands; es enthält das Werkzeug für die Dokumente.
TALLYROOM_VERSION="${TALLYROOM_VERSION:-$(git rev-parse --short HEAD)}"
export TALLYROOM_VERSION

compose() {
  docker compose -f infra/compose.prod.yml --env-file "$ENV_FILE" "$@"
}

checksum() {
  if command -v sha256sum >/dev/null; then sha256sum "$@"; else shasum -a 256 "$@"; fi
}

started=$(date +%s)
target="$BACKUP_DIR/$(date +%Y%m%d-%H%M%S)"
umask 077
mkdir -p "$target"
echo "== Sicherung nach $target (Stand $TALLYROOM_VERSION)"

echo "== Datenbank"
compose exec -T postgres pg_dump -U tallyroom -d tallyroom | gzip >"$target/datenbank.sql.gz"

# Zeilen je Tabelle, samt Migrationsstand. Die Sitzungstabelle ändert sich
# laufend und wird beim Vergleich übergangen.
echo "== Zählung"
compose exec -T postgres psql -U tallyroom -d tallyroom -At -F ' ' >"$target/zaehlung.txt" <<'SQL'
select format('select %L, count(*) from public.%I', tablename, tablename)
from pg_tables where schemaname = 'public' order by tablename
\gexec
select 'drizzle.__drizzle_migrations', count(*) from drizzle.__drizzle_migrations;
SQL

echo "== Dokumente"
compose --profile tools run --rm -T migrate bun apps/api/src/cli/documents-backup.ts export |
  gzip >"$target/dokumente.jsonl.gz"

(cd "$target" && checksum datenbank.sql.gz dokumente.jsonl.gz zaehlung.txt >SHA256SUMS)

echo "== Aufräumen: älter als $KEEP_DAYS Tage, vor Deploys älter als 30 Tage"
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*' -mtime +"$KEEP_DAYS" -print -exec rm -rf {} +
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type f -name 'vor-deploy-*.sql.gz' -mtime +30 -print -delete

echo "== Fertig in $(($(date +%s) - started)) s"
du -h "$target"/* | sed 's/^/   /'
