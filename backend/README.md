# Backend

The backend uses Node.js 24 LTS and Express 5. The `.nvmrc` file at the project
root pins the Node.js patch version used for development.

## Local setup

1. Install Node.js 24 and open a terminal in `backend/`.
2. Install the locked dependencies with `npm ci`.
3. From the repository root, copy `.env.example` to `.env` and replace the
   development-only placeholders with local values. Start the PostgreSQL 15
   service with `docker compose up -d`; wait for it to become healthy.
4. Set the required non-secret port and start the server:

   ```powershell
   $env:PORT = "3000"
   npm start
   ```

   Alternatively, create `backend/.env` containing `PORT=3000`. Do not put
   production credentials or secrets in this file; it is excluded from Git.
5. Check the local health endpoint at `http://localhost:3000/health`. It returns
   `{"status":"ok"}`.

`NODE_ENV` is optional and defaults to `development`. When supplied, it must be
`development`, `test`, or `production`. The HTTP server does not yet require database,
SSO, or Atlassian credentials; the migration command uses the local database
configuration described below.

## Local database connection

The Compose service is published only on `127.0.0.1`. Backend processes running on
the host connect to `localhost` using `POSTGRES_PORT`, `POSTGRES_DB`,
`POSTGRES_USER`, and `POSTGRES_PASSWORD` from the private root `.env` file. The
default development database is `jira_automation` on port `5432`. Compose stores
database files in the named `postgres_data` volume. Do not use these local
development credentials outside a disposable development environment.

## Database migrations

After PostgreSQL is healthy, run `npm run migrate` from `backend/`. The migration
runner applies numbered SQL files once, records their SHA-256 checksums, and rejects
changes to an already-applied migration. The initial schema keeps Atlassian token
material in encrypted binary fields only. It scopes idempotency request IDs to the
requesting user across operation types; provider-operation code must reject reuse
with a different request fingerprint.

## Checks

Run `npm run build` for JavaScript syntax checks and `npm test` for the Node.js
test suite. The PostgreSQL migration tests require the local Compose database and
the private root `.env` settings.
