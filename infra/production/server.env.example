#!/usr/bin/env bash

set -Eeuo pipefail

readonly SHA="${1:?Usage: deploy.sh <commit-sha> <archive>}"
readonly ARCHIVE="${2:?Usage: deploy.sh <commit-sha> <archive>}"

readonly APP_ROOT="${DINO_APP_ROOT:-/srv/dino}"
readonly RELEASES_ROOT="${APP_ROOT}/releases"
readonly CURRENT_LINK="${APP_ROOT}/current"
readonly BACKUPS_ROOT="${APP_ROOT}/backups"
readonly ENV_FILE="${DINO_ENV_FILE:-/etc/dino/production.env}"
readonly RELEASE_DIR="${RELEASES_ROOT}/${SHA}"

cleanup() {
    rm -f "$ARCHIVE" /tmp/deploy.sh 2>/dev/null || true
}
trap cleanup EXIT

if [[ ! -r "$ENV_FILE" ]]; then
    echo "Missing production environment file: $ENV_FILE" >&2
    exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

: "${APP_DOMAIN:?APP_DOMAIN is required in ${ENV_FILE}}"
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required in ${ENV_FILE}}"

command -v docker >/dev/null || {
    echo "Docker is required on the AEZA server." >&2
    exit 1
}

command -v curl >/dev/null || {
    echo "curl is required on the AEZA server." >&2
    exit 1
}

mkdir -p \
    "$RELEASES_ROOT" \
    "$BACKUPS_ROOT"

# Protect the server against two deployments running simultaneously.
exec 9>"${APP_ROOT}/.deploy.lock"
if ! flock -n 9; then
    echo "Another Dino deployment is already running." >&2
    exit 1
fi

if [[ -e "$RELEASE_DIR" ]]; then
    echo "Release ${SHA} already exists; replacing its staging directory."
    rm -rf "$RELEASE_DIR"
fi

mkdir -p "$RELEASE_DIR"
tar -xzf "$ARCHIVE" -C "$RELEASE_DIR"

if [[ ! -f "${RELEASE_DIR}/dist/index.html" ]]; then
    echo "Invalid release: dist/index.html is missing." >&2
    exit 1
fi

if [[ ! -f "${RELEASE_DIR}/dist/version.json" ]]; then
    echo "Invalid release: dist/version.json is missing." >&2
    exit 1
fi

if [[ ! -d "${RELEASE_DIR}/supabase/migrations" ]]; then
    echo "Invalid release: supabase/migrations is missing." >&2
    exit 1
fi

previous_target=""
if [[ -L "$CURRENT_LINK" ]]; then
    previous_target="$(readlink -f "$CURRENT_LINK" || true)"
fi

echo "Backing up PostgreSQL before migrations..."

backup_name="predeploy-${SHA}-$(date -u +%Y%m%dT%H%M%SZ).dump"

docker run \
    --rm \
    --network host \
    -e SUPABASE_DB_URL="$SUPABASE_DB_URL" \
    -e BACKUP_NAME="$backup_name" \
    -v "${BACKUPS_ROOT}:/backups" \
    postgres:17-alpine \
    sh -ceu '
        pg_dump "$SUPABASE_DB_URL" \
          --format=custom \
          --file="/backups/$BACKUP_NAME"
    '

echo "Applying Supabase migrations..."

docker run \
    --rm \
    --network host \
    -e SUPABASE_DB_URL="$SUPABASE_DB_URL" \
    -v "${RELEASE_DIR}/supabase:/workspace/supabase:ro" \
    -v "${APP_ROOT}/npm-cache:/root/.npm" \
    -w /workspace \
    node:22-bookworm-slim \
    bash -ceu '
        npx --yes supabase@2.116.0 \
          db push \
          --db-url "$SUPABASE_DB_URL"
    '

echo "Activating frontend ${SHA}..."

next_link="${APP_ROOT}/current.next"
rm -f "$next_link"
ln -s "${RELEASE_DIR}/dist" "$next_link"
mv -Tf "$next_link" "$CURRENT_LINK"

echo "Checking the deployed release..."

health_ok=false

for attempt in $(seq 1 12); do
    response="$(
        curl \
          --silent \
          --show-error \
          --fail \
          --max-time 5 \
          --resolve "${APP_DOMAIN}:443:127.0.0.1" \
          "https://${APP_DOMAIN}/version.json" \
          2>/dev/null || true
    )"

    if grep -Fq "$SHA" <<< "$response"; then
        health_ok=true
        break
    fi

    sleep 2
done

if [[ "$health_ok" != "true" ]]; then
    echo "Frontend health check failed." >&2

    if [[ -n "$previous_target" && -d "$previous_target" ]]; then
        echo "Restoring previous frontend release: $previous_target"

        rollback_link="${APP_ROOT}/current.rollback"
        rm -f "$rollback_link"
        ln -s "$previous_target" "$rollback_link"
        mv -Tf "$rollback_link" "$CURRENT_LINK"
    fi

    echo "Database migrations are NOT rolled back automatically." >&2
    exit 1
fi

echo "Deployment ${SHA} is healthy."

# Keep the five newest frontend releases.
mapfile -t releases < <(
    find "$RELEASES_ROOT" \
      -mindepth 1 \
      -maxdepth 1 \
      -type d \
      -printf '%T@ %p\n' \
      | sort -nr \
      | cut -d' ' -f2-
)

if (( ${#releases[@]} > 5 )); then
    for old_release in "${releases[@]:5}"; do
        if [[ "$old_release" != "$previous_target" ]]; then
            rm -rf "$old_release"
        fi
    done
fi

# Keep pre-deployment DB dumps for 14 days.
find "$BACKUPS_ROOT" \
    -type f \
    -name 'predeploy-*.dump' \
    -mtime +14 \
    -delete

echo "AEZA deployment complete: ${SHA}"
