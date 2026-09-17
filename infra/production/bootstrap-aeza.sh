# Dino-5monde — AEZA production deployment

This directory adds the production deployment path for the React/Vite + Supabase version of Dino-5monde.

## Deployment flow

```text
push main
    |
    v
existing GitHub CI
    |
    +-- Code quality
    +-- Backend schema / pgTAP
    +-- Feature contracts
    +-- Browser E2E
    |
    v
Deploy AEZA production
    |
    +-- build Vite with production Supabase URL/key
    +-- create release archive
    +-- SCP archive to AEZA
    +-- PostgreSQL pre-deploy backup
    +-- supabase db push
    +-- atomic frontend symlink switch
    +-- HTTPS version healthcheck
    +-- frontend rollback on healthcheck failure
```

Database migrations are intentionally **not rolled back automatically**.

## Important branch state

At the time these files were generated, `develop` contains the React/Vite +
Supabase application while `main` still contains the older TypeScript build.

Merge the current `develop` application into `main` together with these files
before enabling the production workflow.

## GitHub repository variables

Configure:

```text
SUPABASE_URL=https://api.dino.example.com
SUPABASE_PUBLISHABLE_KEY=<publishable Supabase key>
```

These are injected into the Vite bundle at build time.

## GitHub Actions secrets

Configure:

```text
AEZA_SSH_HOST=<AEZA IPv4 or hostname>
AEZA_SSH_PORT=22
AEZA_SSH_USER=dino
AEZA_SSH_PRIVATE_KEY=<private Ed25519 deployment key>
```

Do not reuse a personal SSH private key. Generate a dedicated deployment key.

Example locally:

```bash
ssh-keygen -t ed25519 -f dino_aeza_deploy -C "github-actions-dino"
```

Install `dino_aeza_deploy.pub` in the AEZA deploy user's
`~/.ssh/authorized_keys`, then put the contents of `dino_aeza_deploy` in the
GitHub secret `AEZA_SSH_PRIVATE_KEY`.

## AEZA prerequisites

The server needs:

- Docker Engine
- Caddy
- curl
- a self-hosted Supabase installation
- Supabase gateway reachable locally on `127.0.0.1:8000`
- PostgreSQL reachable through the URL in `/etc/dino/production.env`

Supabase's official self-hosted Docker setup should be provisioned once on the
server. It is infrastructure lifecycle, not something that should be recreated
on every application push.

Official documentation:

https://supabase.com/docs/guides/self-hosting/docker

## One-time server setup

Copy this directory to AEZA once, then:

```bash
sudo DEPLOY_USER=dino ./bootstrap-aeza.sh
```

Edit:

```text
/etc/dino/production.env
```

Example:

```bash
APP_DOMAIN=dino.example.com
SUPABASE_DB_URL='postgresql://postgres:URL_ENCODED_PASSWORD@127.0.0.1:5432/postgres'
```

The DB URL must stay server-side. It is not a GitHub/Vite variable.

## Caddy

Copy `Caddyfile` to `/etc/caddy/Caddyfile` after replacing:

```text
__APP_DOMAIN__
__API_DOMAIN__
```

Example:

```text
__APP_DOMAIN__ -> dino.example.com
__API_DOMAIN__ -> api.dino.example.com
```

Then:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy automatically handles TLS certificates once DNS points to the AEZA host.

The provided API virtual host exposes Supabase API paths but intentionally does
not expose Supabase Studio.

## DNS

Create at least:

```text
dino.example.com      A    <AEZA IPv4>
api.dino.example.com  A    <AEZA IPv4>
```

## First deployment

After the React/Supabase code and this deployment workflow are present on
`main`, a push to `main` triggers the existing `Browser E2E` workflow.

When E2E succeeds, `Deploy AEZA production` starts. It waits for the other
required checks, builds the production frontend and deploys it.

A manual run remains available through `workflow_dispatch`.

## Production filesystem

```text
/srv/dino/
├── current -> /srv/dino/releases/<sha>/dist
├── releases/
│   ├── <sha>/
│   │   ├── dist/
│   │   └── supabase/
│   └── ...
├── backups/
│   └── predeploy-<sha>-<date>.dump
├── npm-cache/
└── .deploy.lock
```

Only the five newest application releases are retained.

Pre-deployment PostgreSQL dumps are retained for 14 days.

## What happens on failure?

### CI failure

Nothing reaches AEZA.

### Migration failure

The new frontend is not activated.

### Frontend healthcheck failure

The `current` symlink is switched back to the previous frontend.

The database migration is **not** automatically reversed, because automatic
down-migrations are unsafe. Production migrations should remain backward
compatible with the immediately previous frontend version.

## Firewall

Publicly expose only what is required, normally:

```text
22/tcp   SSH
80/tcp   HTTP
443/tcp  HTTPS
```

Do not expose PostgreSQL publicly.

The Supabase gateway can remain bound locally and be reached through Caddy.
