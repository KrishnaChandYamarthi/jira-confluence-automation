# Backend

The backend uses Node.js 24 LTS and Express 5. The `.nvmrc` file at the project
root pins the Node.js patch version used for development.

## Local setup

1. Install Node.js 24 and open a terminal in `backend/`.
2. Install the locked dependencies with `npm ci`.
3. Set the required non-secret port and start the server:

   ```powershell
   $env:PORT = "3000"
   npm start
   ```

   Alternatively, create `backend/.env` containing `PORT=3000`. Do not put
   production credentials or secrets in this file; it is excluded from Git.
4. Check the local health endpoint at `http://localhost:3000/health`. It returns
   `{"status":"ok"}`.

`NODE_ENV` is optional and defaults to `development`. When supplied, it must be
`development`, `test`, or `production`. The server currently needs no database,
SSO, or Atlassian credentials; those integrations are added in later tasks.

## Checks

Run `npm run build` for JavaScript syntax checks and `npm test` for the Node.js
test suite.
