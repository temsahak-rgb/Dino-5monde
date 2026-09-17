#!/usr/bin/env bash

set -Eeuo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
    echo "Run this script as root." >&2
    exit 1
fi

readonly DEPLOY_USER="${DEPLOY_USER:-dino}"
readonly APP_ROOT="${DINO_APP_ROOT:-/srv/dino}"
readonly ENV_DIR="/etc/dino"

echo "Preparing Dino production environment..."

# ---------------------------------------------------------------------------
# Required software
# ---------------------------------------------------------------------------

command -v docker >/dev/null || {
    echo "Docker is not installed." >&2
    echo "Install Docker Engine before continuing." >&2
    exit 1
}

command -v caddy >/dev/null || {
    echo "Caddy is not installed." >&2
    echo "Install Caddy before continuing." >&2
    exit 1
}

command -v curl >/dev/null || {
    echo "curl is not installed." >&2
    exit 1
}

command -v flock >/dev/null || {
    echo "flock is not installed." >&2
    echo "Install util-linux before continuing." >&2
    exit 1
}

# ---------------------------------------------------------------------------
# Deployment user
# ---------------------------------------------------------------------------

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
    echo "Creating deployment user: $DEPLOY_USER"

    useradd \
        --create-home \
        --shell /bin/bash \
        "$DEPLOY_USER"
fi

# deploy.sh needs Docker access for:
# - PostgreSQL backup
# - Supabase CLI migration container
usermod -aG docker "$DEPLOY_USER"

# ---------------------------------------------------------------------------
# SSH directory
# ---------------------------------------------------------------------------

readonly DEPLOY_HOME="$(
    getent passwd "$DEPLOY_USER" |
    cut -d: -f6
)"

install \
    -d \
    -o "$DEPLOY_USER" \
    -g "$DEPLOY_USER" \
    -m 0700 \
    "${DEPLOY_HOME}/.ssh"

touch "${DEPLOY_HOME}/.ssh/authorized_keys"

chown \
    "$DEPLOY_USER:$DEPLOY_USER" \
    "${DEPLOY_HOME}/.ssh/authorized_keys"

chmod \
    0600 \
    "${DEPLOY_HOME}/.ssh/authorized_keys"

# ---------------------------------------------------------------------------
# Application directories
# ---------------------------------------------------------------------------

install \
    -d \
    -o "$DEPLOY_USER" \
    -g "$DEPLOY_USER" \
    -m 0755 \
    "$APP_ROOT"

install \
    -d \
    -o "$DEPLOY_USER" \
    -g "$DEPLOY_USER" \
    -m 0755 \
    "${APP_ROOT}/releases"

install \
    -d \
    -o "$DEPLOY_USER" \
    -g "$DEPLOY_USER" \
    -m 0755 \
    "${APP_ROOT}/backups"

install \
    -d \
    -o "$DEPLOY_USER" \
    -g "$DEPLOY_USER" \
    -m 0755 \
    "${APP_ROOT}/npm-cache"

# ---------------------------------------------------------------------------
# Production secrets directory
# ---------------------------------------------------------------------------

install \
    -d \
    -o root \
    -g "$DEPLOY_USER" \
    -m 0750 \
    "$ENV_DIR"

readonly ENV_FILE="${ENV_DIR}/production.env"

if [[ ! -f "$ENV_FILE" ]]; then
    cat > "$ENV_FILE" <<'EOF'
# Public frontend hostname.
APP_DOMAIN=dino.example.com

# PostgreSQL connection used only from the AEZA server.
#
# IMPORTANT:
# URL-encode the password if it contains reserved characters.
#
# Example:
# postgresql://postgres:my%40password@127.0.0.1:5432/postgres

SUPABASE_DB_URL='postgresql://postgres:CHANGE_ME@127.0.0.1:5432/postgres'
EOF

    chown \
        root:"$DEPLOY_USER" \
        "$ENV_FILE"

    chmod \
        0640 \
        "$ENV_FILE"

    echo
    echo "Created:"
    echo "  $ENV_FILE"
fi

# ---------------------------------------------------------------------------
# Caddy
# ---------------------------------------------------------------------------

systemctl enable caddy >/dev/null 2>&1 || true

echo
echo "============================================================"
echo "Dino AEZA bootstrap complete"
echo "============================================================"
echo
echo "Deployment user:"
echo
echo "  $DEPLOY_USER"
echo
echo "Application directory:"
echo
echo "  $APP_ROOT"
echo
echo "Production environment:"
echo
echo "  $ENV_FILE"
echo
echo
echo "Remaining one-time operations:"
echo
echo "1. Configure:"
echo
echo "   $ENV_FILE"
echo
echo "2. Install the repository Caddyfile:"
echo
echo "   /etc/caddy/Caddyfile"
echo
echo "   Replace:"
echo
echo "     __APP_DOMAIN__"
echo "     __API_DOMAIN__"
echo
echo "3. Validate Caddy:"
echo
echo "   caddy validate --config /etc/caddy/Caddyfile"
echo
echo "4. Reload Caddy:"
echo
echo "   systemctl reload caddy"
echo
echo "5. Add the GitHub Actions public SSH key to:"
echo
echo "   ${DEPLOY_HOME}/.ssh/authorized_keys"
echo
echo "6. Ensure Supabase API gateway is reachable locally:"
echo
echo "   127.0.0.1:8000"
echo
echo "7. Ensure PostgreSQL is reachable through SUPABASE_DB_URL."
echo
echo
echo "IMPORTANT:"
echo
echo "The user '$DEPLOY_USER' was added to the docker group."
echo "Open a new SSH session before testing Docker commands with it."
echo