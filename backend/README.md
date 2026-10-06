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

## API response conventions

`GET /health` returns HTTP 200 and `{"status":"ok"}`. Every request receives a
server-generated `X-Request-Id`. Errors use a JSON envelope such as
`{"error":{"code":"validation_failed","message":"Request validation failed.","requestId":"<uuid>","details":[{"field":"summary","code":"required","message":"summary is required."}]}}`.
Stack traces, credentials, and provider error content are not returned to clients.
Authentication, Jira, Confluence, connection, and operation route prefixes are
reserved and currently return HTTP 501; they do not perform provider calls.

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

Run `npm run build` for JavaScript syntax checks. Run `npm run test:unit` for
unit tests and `npm run test:http` for Supertest HTTP tests; `npm test` runs both
plus PostgreSQL integration tests. The PostgreSQL migration tests require the
local Compose database and the private root `.env` settings. Tests import the
Express app without starting the production listener or requiring live provider
credentials.

Backend logs are newline-delimited JSON with timestamps, event names, and
request/operation context. Credential-like fields are redacted, while request,
response, and provider-content fields are omitted; thrown error messages and
stacks are not written to logs.
