#!/bin/bash
# Probe-Wiederherstellung einer Sicherung, ohne den Betrieb zu berühren:
#
#   sudo /opt/tallyroom/infra/restore-test.sh              # die neueste
#   sudo /opt/tallyroom/infra/restore-test.sh <Ordner>     # eine bestimmte
#
# Startet eine eigene PostgreSQL und eine eigene Garage in einem internen
# Docker-Netz ohne Verbindung nach aussen, spielt Datenbank und Dokumente
# zurück und vergleicht:
#
#   1. Prüfsummen der Sicherungsdateien
#   2. Zeilen je Tabelle mit der Zählung zum Zeitpunkt der Sicherung
#   3. jedes aktive Dokument der Datenbank hat seine Datei im Archiv
#   4. was in der neuen Garage ankam, gleicht dem Archiv Objekt für Objekt
#
# Danach wird alles wieder entfernt. Eine Sicherung, die hier nie
# zurückgespielt wurde, ist eine Hoffnung, keine Sicherung.
set -euo pipefail

cd "$(dirname "$0")/.."
BACKUP_DIR="${BACKUP_DIR:-/var/backups/tallyroom}"
API_IMAGE="${API_IMAGE:-tallyroom-api:$(git rev-parse --short HEAD)}"
POSTGRES_IMAGE=postgres:18.1-alpine
GARAGE_IMAGE=dxflrs/garage:v2.4.1

fail() {
  echo "FEHLER: $*" >&2
  exit 1
}

# Wartet höchstens eine Minute, bis der Befehl gelingt.
wait_for() {
  local what="$1"
  shift
  for _ in $(seq 1 60); do
    "$@" >/dev/null 2>&1 && return 0
    sleep 1
  done
  fail "$what kam nicht hoch"
}

checksum_check() {
  if command -v sha256sum >/dev/null; then sha256sum --quiet -c "$1"; else shasum -a 256 --quiet -c "$1"; fi
}

source_dir="${1:-$(find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*' | sort | tail -1)}"
[ -n "$source_dir" ] || fail "keine Sicherung in $BACKUP_DIR"
[ -f "$source_dir/SHA256SUMS" ] || fail "$source_dir ist unvollständig (SHA256SUMS fehlt)"
echo "== Probe mit $source_dir"

echo "== 1. Prüfsummen"
(cd "$source_dir" && checksum_check SHA256SUMS) || fail "Prüfsummen stimmen nicht"

run="tallyroom-restore-$$"
work="$(mktemp -d)"
cleanup() {
  docker rm -f "$run-db" "$run-garage" >/dev/null 2>&1 || true
  docker network rm "$run" >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT
docker network create --internal "$run" >/dev/null

echo "== 2. Datenbank zurückspielen"
docker run -d --name "$run-db" --network "$run" \
  -e POSTGRES_USER=tallyroom -e POSTGRES_PASSWORD="$(openssl rand -hex 16)" -e POSTGRES_DB=tallyroom \
  "$POSTGRES_IMAGE" >/dev/null
# Nicht pg_isready: das meldet sich schon während der Einrichtung einmal
# bereit. Erst eine Abfrage zeigt, dass die Datenbank angenommen wird.
wait_for "PostgreSQL" docker exec "$run-db" psql -U tallyroom -d tallyroom -c 'select 1'
t=$(date +%s)
gunzip -c "$source_dir/datenbank.sql.gz" |
  docker exec -i "$run-db" psql -q -v ON_ERROR_STOP=1 -U tallyroom -d tallyroom >/dev/null
echo "   in $(($(date +%s) - t)) s"

docker exec -i "$run-db" psql -U tallyroom -d tallyroom -At -F ' ' >"$work/zaehlung.txt" <<'SQL'
select format('select %L, count(*) from public.%I', tablename, tablename)
from pg_tables where schemaname = 'public' order by tablename
\gexec
select 'drizzle.__drizzle_migrations', count(*) from drizzle.__drizzle_migrations;
SQL
if ! diff <(grep -v '^session ' "$source_dir/zaehlung.txt") <(grep -v '^session ' "$work/zaehlung.txt"); then
  fail "Zeilenzahlen weichen ab (links Sicherung, rechts zurückgespielt)"
fi
echo "   $(wc -l <"$work/zaehlung.txt" | tr -d ' ') Tabellen, Zeilenzahlen wie bei der Sicherung"

echo "== 3. Dokumente gegen Datenbank"
gunzip -c "$source_dir/dokumente.jsonl.gz" |
  docker run --rm -i --network none "$API_IMAGE" bun apps/api/src/cli/documents-backup.ts manifest >"$work/archiv.txt"
# Beide Seiten byteweise sortiert: PostgreSQL und sort ordnen «-» und «/»
# je nach Sprachumgebung verschieden, und comm vergleicht dann falsch.
docker exec "$run-db" psql -U tallyroom -d tallyroom -At \
  -c "select object_key from documents where deletion_status = 'active'" | LC_ALL=C sort >"$work/erwartet.txt"
cut -c67- "$work/archiv.txt" | LC_ALL=C sort >"$work/vorhanden.txt"
missing=$(LC_ALL=C comm -23 "$work/erwartet.txt" "$work/vorhanden.txt" | wc -l | tr -d ' ')
[ "$missing" -eq 0 ] || fail "Aktive Dokumente ohne Datei im Archiv: $missing"
echo "   $(wc -l <"$work/erwartet.txt" | tr -d ' ') aktive Dokumente, jedes mit Datei"

echo "== 4. Dokumente in eine neue Garage zurückspielen"
key_id="GK$(openssl rand -hex 12)"
secret="$(openssl rand -hex 32)"
docker run -d --name "$run-garage" --network "$run" \
  -e GARAGE_RPC_SECRET="$(openssl rand -hex 32)" \
  -e GARAGE_DEFAULT_ACCESS_KEY="$key_id" -e GARAGE_DEFAULT_SECRET_KEY="$secret" \
  -e GARAGE_DEFAULT_BUCKET=tallyroom-documents \
  -v "$PWD/infra/garage.toml:/etc/garage.toml:ro" \
  "$GARAGE_IMAGE" /garage server --single-node --default-access-key --default-bucket >/dev/null
wait_for "Garage" docker exec "$run-garage" /garage status

s3=(-e "S3_ENDPOINT=http://$run-garage:3900" -e S3_REGION=garage -e S3_BUCKET=tallyroom-documents
  -e "S3_ACCESS_KEY_ID=$key_id" -e "S3_SECRET_ACCESS_KEY=$secret")
t=$(date +%s)
# Garage legt Schlüssel und Bucket kurz nach dem Start an; bis dahin scheitert
# der erste Zugriff. Drei Versuche genügen.
for attempt in 1 2 3; do
  if gunzip -c "$source_dir/dokumente.jsonl.gz" |
    docker run --rm -i --network "$run" "${s3[@]}" "$API_IMAGE" \
      bun apps/api/src/cli/documents-backup.ts import; then
    break
  fi
  [ "$attempt" -lt 3 ] || fail "Dokumente liessen sich nicht zurückspielen"
  sleep 3
done
echo "   in $(($(date +%s) - t)) s"

docker run --rm --network "$run" "${s3[@]}" "$API_IMAGE" \
  bun apps/api/src/cli/documents-backup.ts export |
  docker run --rm -i --network none "$API_IMAGE" bun apps/api/src/cli/documents-backup.ts manifest >"$work/zurueck.txt"
diff -q "$work/archiv.txt" "$work/zurueck.txt" >/dev/null ||
  fail "Die neue Garage enthält nicht dasselbe wie das Archiv"
echo "   $(wc -l <"$work/zurueck.txt" | tr -d ' ') Objekte, Prüfsumme für Prüfsumme gleich"

echo "== Probe bestanden: $source_dir lässt sich vollständig zurückspielen"
