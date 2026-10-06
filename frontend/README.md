# Frontend

The frontend uses React 18 and Vite on the Node.js 24 runtime pinned by the
repository's `.nvmrc`.

## Local setup

1. Open a terminal in `frontend/` and install the exact lockfile dependencies:

   ```powershell
   npm ci
   ```

2. Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the public
   application-backend URL for the environment. Leave it empty to use the same
   origin. `VITE_*` values are embedded in browser assets; use this variable for
   a URL only, never for credentials, tokens, or provider secrets.
3. Start Vite with `npm run dev`, create a production bundle with `npm run build`,
   or serve the built bundle locally with `npm run preview`.

The app currently provides route shells for `/login`, `/connections`,
`/jira/issues`, `/confluence/pages`, and `/operations`, along with a not-found
page. These are navigation placeholders; authentication and provider workflows
are implemented in later tasks.

Run `npm test` for the frontend shell, route, and error-boundary tests.
