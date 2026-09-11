#!/bin/bash
# Deploy auf dem Server, bewusst von Hand ausgelöst:
#
#   sudo /opt/tallyroom/infra/deploy.sh          # Stand von origin/main
#   sudo /opt/tallyroom/infra/deploy.sh 1a2b3c4  # ein bestimmter Commit, auch für einen Rollback
#
# Beim ersten Lauf erzeugt das Skript die Geheimnisse auf dem Server selbst.
# Sie verlassen ihn nie und liegen nur für root lesbar in infra/.env.production.
#
# Reihenfolge: Daten und Speicher starten, Datenbank sichern, migrieren, dann
# API und Caddy. Die Sicherung vor der Migration ist der Rückweg, falls eine
# Migration schiefgeht — Migrationen laufen nur vorwärts.
#
# bash statt sh wegen pipefail: in `pg_dump | gzip` zählte sonst nur gzip.
# Ein gescheiterter Dump ergab eine leere Sicherung, und der Deploy lief
# weiter in die Migration, ohne Rückweg.
set -euo pipefail

cd "$(dirname "$0")/.."
REF="${1:-main}"
ENV_FILE="infra/.env.production"
BACKUP_DIR="/var/backups/tallyroom"

if [ "$(id -u)" -ne 0 ]; then
  echo "Bitte mit sudo ausführen." >&2
  exit 1
fi

git fetch --quiet origin
if git rev-parse --verify --quiet "origin/$REF" >/dev/null; then
  git checkout --quiet --detach "origin/$REF"
else
  git checkout --quiet --detach "$REF"
fi
TALLYROOM_VERSION="$(git rev-parse --short HEAD)"
export TALLYROOM_VERSION
echo "== Stand $TALLYROOM_VERSION: $(git log -1 --format=%s)"

if [ ! -f "$ENV_FILE" ]; then
  umask 077
  cat >"$ENV_FILE" <<EOF
SITE_ADDRESS=tallyroom.adambaranyi.xyz
APP_ORIGIN=https://tallyroom.adambaranyi.xyz
SESSION_SECRET=$(openssl rand -base64 48)
POSTGRES_PASSWORD=$(openssl rand -hex 24)
GARAGE_RPC_SECRET=$(openssl rand -hex 32)
S3_ACCESS_KEY_ID=GK$(openssl rand -hex 12)
S3_SECRET_ACCESS_KEY=$(openssl rand -hex 32)
DEMO_ENABLED=true
EOF
  echo "== Geheimnisse erzeugt in $ENV_FILE, nur für root lesbar"
fi

# Impressum-Angaben. Nicht geheim, aber auch nicht im öffentlichen Repository.
# Einmal mitgeben, danach stehen sie in der Datei; neu mitgegebene ersetzen alte:
#   sudo OPERATOR_STREET="…" OPERATOR_CITY="…" OPERATOR_EMAIL="…" infra/deploy.sh
set_value() {
  tmp="$(mktemp)"
  grep -v "^$1=" "$ENV_FILE" >"$tmp" || true
  printf '%s="%s"\n' "$1" "$2" >>"$tmp"
  cat "$tmp" >"$ENV_FILE"
  rm -f "$tmp"
}
for key in OPERATOR_STREET OPERATOR_CITY OPERATOR_EMAIL OPERATOR_PHONE; do
  value="$(printenv "$key" || true)"
  if [ -n "$value" ]; then
    set_value "$key" "$value"
  fi
done
for key in OPERATOR_STREET OPERATOR_CITY OPERATOR_EMAIL; do
  if ! grep -q "^$key=" "$ENV_FILE"; then
    echo "Impressum-Angabe $key fehlt. Einmal mitgeben: sudo $key=\"…\" $0" >&2
    exit 1
  fi
done

compose() {
  docker compose -f infra/compose.prod.yml --env-file "$ENV_FILE" "$@"
}

echo "== Images bauen"
compose build --quiet

echo "== Datenbank und Speicher starten"
compose up -d --wait postgres garage

echo "== Datenbank sichern"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
backup="$BACKUP_DIR/vor-deploy-$(date +%Y%m%d-%H%M%S)-$TALLYROOM_VERSION.sql.gz"
compose exec -T postgres pg_dump -U tallyroom -d tallyroom | gzip >"$backup"
echo "   $backup ($(du -h "$backup" | cut -f1))"

echo "== Migrationen"
compose --profile tools run --rm migrate

echo "== API und Caddy starten"
compose up -d --wait

# Nur Überreste früherer Builds. Getaggte Images bleiben für einen Rollback.
docker image prune --force >/dev/null
docker builder prune --force --filter until=168h >/dev/null

compose ps --format '{{.Service}}: {{.Status}}'
echo "== Läuft: $TALLYROOM_VERSION"
