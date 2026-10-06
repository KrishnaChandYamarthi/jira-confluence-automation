# Frontend

The frontend uses React 18 and Vite on the Node.js 24 runtime pinned by the
repository's `.nvmrc`.

## Local setup

1. Open a terminal in `frontend/` and install the exact lockfile dependencies:

   ```powershell
   npm ci
   ```

2. Copy `.env.example` to `.env.local`. Leave `VITE_API_BASE_URL` empty for local
   development; Vite proxies `/api` to `http://127.0.0.1:3000`. In deployments
   where the API is on another origin, set its public origin and configure the
   backend for credentialed CORS. `VITE_*` values are embedded in browser assets;
   use this variable for a URL only, never for credentials, tokens, or provider
   secrets.
3. Start Vite with `npm run dev`, create a production bundle with `npm run build`,
   or serve the built bundle locally with `npm run preview`.

The app currently provides route shells for `/login`, `/connections`,
`/jira/issues`, `/confluence/pages`, and `/operations`, along with a not-found
page. These are navigation placeholders; authentication and provider workflows
are implemented in later tasks.

Protected routes validate the application session with `GET /api/auth/session`.
The browser sends session cookies with API requests but never reads or stores them;
the server must issue `HttpOnly`, `Secure`, appropriately `SameSite` cookies and
protect state-changing requests against CSRF. A successful session response
contains a `user` object and must not contain Atlassian credentials. An HTTP 401
redirects to sign-in, while other failures remain visible with the safe backend
error code/message and request ID. The current backend session endpoint is a
placeholder until the SSO task is implemented.

Run `npm test` for the frontend shell, routes, session guard, API client, and
error-boundary tests.
