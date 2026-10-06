# Implementation Tasks: Jira and Confluence Automation Workspace

**Source plan**: [plan.md](./plan.md)  
**Source specification**: [specification.md](./specification.md)  
**Status**: Ready for implementation planning; organization-specific SSO/OAuth and
hosting inputs remain gates as recorded in the source plan.

## How to use this breakdown

- Tasks preserve the four phases and task IDs in `plan.md`.
- Each task is complete only when all listed acceptance criteria pass and the
  requirement IDs in its traceability line are covered by evidence.
- For US1-US5, implement tests first. Tasks that create acceptance tests must show
  those tests fail for the missing behavior before implementation begins; rerun them
  after implementation and record the passing result.
- `[P]` denotes work that can proceed in parallel after its listed prerequisites.
- Tasks do not authorize product behavior excluded by the specification: no issue/page
  deletion, bulk writes, workflow transitions, scheduled jobs, or unattended writes.
- No existing application source was found for conversion. The `[Source:]` annotation
  is therefore not applicable; tasks scaffold the planned new application.

## Global Definition of Done

1. The task's acceptance criteria pass and the relevant automated checks are recorded.
2. No credentials, provider tokens, production content, or live secrets are committed
   or logged.
3. API validation and authorization are enforced on the backend; frontend checks do
   not substitute for backend checks.
4. Write paths follow review → explicit confirmation → durable pending operation →
   provider call → verified local outcome. Uncertain writes are not automatically
   repeated.
5. Changes follow the constitution. Any exception is documented and reviewed before
   the affected implementation proceeds.

## Phase 1: Backend Setup — Database and API Skeleton

### T001 — Backend runtime and configuration

- [x] T001 [Plan:1.1] Create the Express 5 backend package, pinned Node.js 24 LTS runtime configuration, entry points, and environment validation.
- **Requirements**: REQ-025, REQ-034
- **Files**: `backend/package.json`, `backend/package-lock.json` (or chosen package
  manager lockfile), `.nvmrc`, `backend/src/server.js`, `backend/src/app.js`,
  `backend/src/config/env.js`, `backend/README.md`
- **Dependencies**: None.
- **Acceptance criteria**:
  1. A clean dependency install succeeds using the committed lockfile and the pinned
     Node.js 24 LTS runtime.
  2. The Express app can be imported without opening a listening socket; the server
     entry point starts the app on the configured port.
  3. Required environment variables are validated at startup; missing or malformed
     values stop startup with an actionable message that does not echo secret values.
  4. No live secret or credential is needed in the checked-in configuration or docs.

### T002 — PostgreSQL 15 Docker service

- [x] T002 [P] [Plan:1.2] Add the local PostgreSQL 15 service and health check in root `compose.yaml`.
- **Requirements**: REQ-026, REQ-034
- **Files**: `compose.yaml`, `.env.example`, `.gitignore`
- **Dependencies**: None; may proceed in parallel with T001.
- **Acceptance criteria**:
  1. `docker compose up -d` starts a PostgreSQL 15 service with a health check that
     reports ready only when the database accepts connections.
  2. Development credentials are injected through environment configuration, not
     hard-coded in the compose file or source.
  3. Database files persist in a named development volume and the service documents
     the connection settings required by the backend.
  4. `.env.example` contains placeholders only and the actual local env file is ignored
     by version control.

### T003 — Migration runner and initial schema

- [x] T003 [Plan:1.2] Add the migration runner and initial versioned schema for users, provider connections, operations, audit metadata, and expiry.
- **Requirements**: REQ-015, REQ-016, REQ-017, REQ-022, REQ-026, REQ-027, REQ-035
- **Files**: `backend/package.json`, `backend/migrations/`, `backend/src/db/`,
  `backend/src/config/env.js`
- **Dependencies**: T001 and T002.
- **Acceptance criteria**:
  1. A clean PostgreSQL 15 database can apply all migrations in version order and
     records which migrations have run.
  2. Schema constraints support a unique request identifier in its defined scope,
     operation lifecycle states, requester ownership, audit timestamps, and a
     retention-expiry timestamp.
  3. Provider connection schema stores only required metadata and encrypted token
     material; request identifiers are unique per user across operation types;
     fixtures and migrations contain no real tokens.
  4. Re-running the migration command does not apply the same migration twice or
     corrupt the schema; migration failure is reported and exits unsuccessfully.

### T004 — API skeleton, validation, errors, and health endpoint

- [x] T004 [Plan:1.3] Create Express routing, middleware, validation, error response, request-ID, and health endpoint foundations.
- **Requirements**: REQ-014, REQ-025, REQ-028, REQ-032, REQ-033
- **Files**: `backend/src/routes/`, `backend/src/middleware/`,
  `backend/src/validation/`, `backend/src/errors/`, `backend/src/app.js`,
  `backend/src/server.js`
- **Dependencies**: T001.
- **Acceptance criteria**:
  1. `GET /health` returns a documented JSON health response and the correct success
     status when the app is running.
  2. A representative invalid request is rejected server-side with a stable JSON
     error shape and field-level actionable details; no provider call occurs.
  3. Errors include a request/correlation identifier, but do not disclose stack traces,
     secrets, or provider credentials to clients.
  4. Route placeholders for authentication, Jira, Confluence, connections, and
     operations are organized without exposing provider calls directly to the browser.

### T005 — Redacted logger and backend test harness

- [x] T005 [P] [Plan:1.4] Add structured redacted logging and configure backend unit and HTTP tests.
- **Requirements**: REQ-003, REQ-027, REQ-028, REQ-031, REQ-032
- **Files**: `backend/src/observability/logger.js`, `backend/package.json`,
  `backend/tests/`
- **Dependencies**: T001; may proceed in parallel with T002 and T004.
- **Acceptance criteria**:
  1. Backend unit tests and Supertest HTTP tests can be run through documented package
     scripts and return a failing exit code when an assertion fails.
  2. Logger output is structured and includes operation/request context without
     recording access tokens, refresh tokens, client secrets, or unnecessary provider
     content.
  3. Automated redaction tests cover representative secret field names and nested
     provider error objects.
  4. Tests can import the app without opening a production listener or requiring live
     SSO/Atlassian credentials.

### T006 — PostgreSQL migration and persistence integration tests

- [x] T006 [Plan:1.2,1.4] Test migrations and core persistence invariants against the Docker PostgreSQL 15 service.
- **Requirements**: REQ-015, REQ-016, REQ-022, REQ-026, REQ-027, REQ-031
- **Files**: `backend/tests/integration/`, `backend/src/db/`, `backend/migrations/`
- **Dependencies**: T002, T003, T005.
- **Acceptance criteria**:
  1. The integration suite connects to PostgreSQL 15, applies the schema, creates and
     reads a durable pending operation, and cleans up only its own test data.
  2. A duplicate request identifier is rejected or resolves to the existing operation
     according to the defined uniqueness behavior; it cannot create duplicate records.
  3. A transaction rollback leaves no partial local operation records.
  4. The test suite fails explicitly if PostgreSQL is unavailable; it does not silently
     substitute an in-memory database.

**Milestone M1**: T001-T006 pass; local backend and PostgreSQL 15 run from documented
configuration, migration and persistence tests pass, and error/logging behavior is
observable and redacted.

## Phase 2: Frontend Setup — UI Skeleton and Routing

### T007 — React 18 and Vite scaffold

- [x] T007 [P] [Plan:2.1] Create the React 18/Vite frontend app and pinned dependency configuration.
- **Requirements**: REQ-023, REQ-034
- **Files**: `frontend/package.json`, `frontend/package-lock.json` (or chosen package
  manager lockfile), `frontend/vite.config.js`, `frontend/index.html`,
  `frontend/src/main.jsx`
- **Dependencies**: T001; independent of backend feature implementation.
- **Acceptance criteria**:
  1. A clean install using the lockfile succeeds with React 18 and a Vite version
     compatible with Node.js 24.
  2. Documented development and production-build scripts start and build the frontend
     without errors.
  3. The entry point renders a visible application shell and reports rendering errors
     through a user-safe error boundary.
  4. Backend URL configuration is environment-specific and no provider secret is
     included in frontend build-time configuration.

### T008 — Frontend routes

- [x] T008 [Plan:2.2] Implement client-side routes for login, connections, Jira, Confluence, and operation history.
- **Requirements**: REQ-002, REQ-021, REQ-023
- **Files**: `frontend/src/app/router.jsx`, `frontend/src/features/auth/`,
  `frontend/src/features/connections/`, `frontend/src/features/jira/`,
  `frontend/src/features/confluence/`, `frontend/src/features/operations/`
- **Dependencies**: T007.
- **Acceptance criteria**:
  1. `/login`, `/connections`, `/jira/issues`, `/confluence/pages`, and `/operations`
     resolve to their corresponding accessible route shells.
  2. Unknown routes render a not-found view with a way back to the application.
  3. Each route has a descriptive page heading and browser title.
  4. Route shells contain no direct Atlassian API access or tokens.

### T009 — Session-aware API client and route guard

- [x] T009 [P] [Plan:2.2] Add a session-aware API client and protected route guard without storing Atlassian credentials in the browser.
- **Requirements**: REQ-002, REQ-023, REQ-028, REQ-033
- **Files**: `frontend/src/api/client.js`, `frontend/src/auth/RequireSession.jsx`,
  `frontend/src/app/router.jsx`
- **Dependencies**: T007.
- **Acceptance criteria**:
  1. API requests use the configured backend origin and send the application's session
     credentials using the selected safe transport configuration.
  2. API errors preserve the backend's safe error code/message and request ID for UI
     display and support diagnosis.
  3. Protected routes show an unauthenticated/loading state until session status is
     known and redirect unauthenticated users to `/login`.
  4. No Atlassian access/refresh token is written to local storage, session storage,
     cookies accessible to JavaScript, or browser-visible API responses.

### T010 — Accessible shared UI patterns

- [ ] T010 [P] [Plan:2.3] Implement reusable accessible forms, dialogs, status banners, focus management, and validation summaries.
- **Requirements**: REQ-006, REQ-019, REQ-023
- **Files**: `frontend/src/components/`, `frontend/src/components/**/*.test.jsx`
- **Dependencies**: T007.
- **Acceptance criteria**:
  1. Form controls have programmatic labels, associated help/error text, and keyboard
     operability.
  2. Dialogs expose accessible names, manage focus on open, and return focus to their
     trigger when closed.
  3. Status/error messages are announced to assistive technology and remain perceivable
     without relying on color alone.
  4. Automated accessibility checks for these components pass, and focused keyboard
     tests cover validation and dialog interactions.

**Milestone M2**: T007-T010 pass; all route shells render and the shared client and UI
patterns handle session, loading, error, and keyboard-accessibility states.

## Phase 3: Feature Implementation — One User Story at a Time

### US1 — Sign in and authorize Atlassian access

#### T011 — US1 acceptance tests first

- [ ] T011 [US1] [Plan:3.1] Write failing backend and browser tests for company SSO and per-user Atlassian connections.
- **Requirements**: REQ-001, REQ-002, REQ-003, REQ-004, REQ-020, REQ-025, REQ-035
- **Files**: `backend/tests/auth/`, `backend/tests/integrations/atlassian/`,
  `frontend/tests/e2e/auth.spec.js`
- **Dependencies**: T004-T005, T008-T009.
- **Acceptance criteria**:
  1. Tests specify successful SSO, unauthenticated denial, OAuth denial, expiry,
     revocation, disconnected status, and per-user resource visibility.
  2. At least one test asserts that no provider call can occur without authenticated
     application identity and valid per-user authorization.
  3. Tests assert secrets are absent from HTTP responses and captured logs.
  4. Before T012-T014, these tests fail for the intended missing behavior and not
     because the test environment is misconfigured.

#### T012 — Company SSO session validation

- [ ] T012 [US1] [Plan:3.1] Implement company-SSO session validation and backend authorization middleware using approved organization configuration.
- **Requirements**: REQ-002, REQ-025
- **Files**: `backend/src/auth/`, `backend/src/middleware/`, `backend/src/config/env.js`
- **Dependencies**: T011 and organization-provided SSO issuer/client/callback inputs.
- **Acceptance criteria**:
  1. A valid configured organization SSO session identifies the authenticated
     application user for backend authorization.
  2. Missing, expired, invalid, or untrusted sessions receive an unauthenticated
     response and cannot reach protected feature handlers.
  3. Session/configuration errors do not disclose tokens, client secrets, or internal
     stack details.
  4. Automated T011 tests for SSO/session behavior pass.

#### T013 — Per-user Atlassian OAuth lifecycle

- [ ] T013 [US1] [Plan:3.1] Implement per-user Atlassian OAuth 3LO, token encryption/storage, refresh, revocation, disconnect, and connection-status routes.
- **Requirements**: REQ-001, REQ-003, REQ-004, REQ-020, REQ-025, REQ-035
- **Files**: `backend/src/integrations/atlassian/`, `backend/src/services/connections.js`,
  `backend/src/routes/connections.js`, `backend/src/db/`
- **Dependencies**: T003, T006, T011-T012; approved Atlassian OAuth client, scope, and
  Cloud site configuration.
- **Acceptance criteria**:
  1. Each authorization is associated with the currently authenticated user; the app
     does not accept pasted API tokens or use a shared provider service account.
  2. Access/refresh tokens are encrypted at rest and never appear in a browser response
     or application log.
  3. Expired/revoked authorization stops provider access and surfaces a reauthorization
     state; disconnect removes or revokes stored authorization material.
  4. Jira and Confluence connection state can be represented independently, and
     provider results are limited to the authorized user's accessible resources.
  5. Automated T011 OAuth lifecycle and isolation tests pass.

#### T014 — Sign-in and connection screens

- [ ] T014 [P] [US1] [Plan:3.1] Build sign-in, authorization initiation, connection status, and disconnect screens.
- **Requirements**: REQ-001, REQ-002, REQ-020, REQ-023
- **Files**: `frontend/src/features/auth/`, `frontend/src/features/connections/`,
  `frontend/src/app/router.jsx`
- **Dependencies**: T010-T013.
- **Acceptance criteria**:
  1. A logged-out user can start company SSO; an authenticated user sees separate Jira
     and Confluence authorization states and can initiate per-user authorization.
  2. Denied, expired, revoked, and disconnected states explain the next user action
     without displaying credential material.
  3. Disconnect requires an intentional action and visibly confirms the resulting
     disconnected state.
  4. Keyboard and screen-reader checks for these journeys pass the applicable WCAG
     2.2 AA criteria; T011 browser tests pass.

**US1 exit gate**: Sign-in and per-user connections work independently, failure states
are tested, and integration credentials are never exposed to client-side code.

### US2 — Reviewed Jira issue creation (P1 MVP)

#### T015 — US2 acceptance tests first

- [ ] T015 [US2] [Plan:3.2] Write failing acceptance tests for Jira issue creation validation, confirmation, deduplication, and uncertainty.
- **Requirements**: REQ-006, REQ-007, REQ-014, REQ-015, REQ-016, REQ-018, REQ-027, REQ-030
- **Files**: `backend/tests/jira/issue-create.test.js`,
  `backend/tests/integration/jira-issue-create.test.js`,
  `frontend/tests/e2e/jira-create.spec.js`
- **Dependencies**: US1 exit gate, T006, T010.
- **Acceptance criteria**:
  1. Tests cover required supported fields, unsupported required field blocking,
     review/confirm behavior, one provider create, duplicate request IDs, provider
     denial, and uncertain timeout.
  2. Tests prove a pending record is committed before the provider write and no provider
     request is sent when pending persistence fails.
  3. Tests assert no automatic retry for an uncertain write and no success display
     without confirmed provider and local persistence state.
  4. Tests fail for the intended missing behavior before implementation begins.

#### T016 — Jira project and create-field metadata

- [ ] T016 [US2] [Plan:3.2] Implement accessible Jira project listing and create-field metadata, blocking projects with unsupported required fields.
- **Requirements**: REQ-004, REQ-007, REQ-014
- **Files**: `backend/src/integrations/atlassian/jira/metadata.js`,
  `backend/src/routes/jira-projects.js`, `backend/src/validation/jira-issue.js`
- **Dependencies**: T013, T015.
- **Acceptance criteria**:
  1. Project and issue-type metadata are fetched only through the authenticated user's
     connection and only accessible projects are returned.
  2. Supported required fields and allowed values are described sufficiently to build
     the form and validate the submission.
  3. If any required field is unsupported, the response identifies that the project
     cannot be used for creation and provides no create-ready partial schema.
  4. Provider denial and malformed provider metadata produce safe, explicit errors;
     no issue write occurs.

#### T017 — Validated Jira issue creation endpoint/service

- [ ] T017 [US2] [Plan:3.2] Implement server-validated Jira issue creation with explicit confirmation and provider outcome mapping.
- **Requirements**: REQ-006, REQ-007, REQ-014, REQ-016, REQ-018, REQ-027, REQ-028
- **Files**: `backend/src/integrations/atlassian/jira/issues.js`,
  `backend/src/routes/jira-issues.js`, `backend/src/validation/jira-issue.js`
- **Dependencies**: T013, T015-T016, T018.
- **Acceptance criteria**:
  1. Only an authenticated user with a valid connection can create one issue in an
     accessible project, using supported required fields and allowed editable fields.
  2. Invalid, unsupported, inaccessible, or malformed submissions return actionable
     errors and do not reach the provider write endpoint.
  3. A successful provider response returns the created issue key only after local
     operation status is durably marked completed.
  4. Provider failures map to failed or uncertain states without reporting false
     success; retry policy respects provider rate limits and does not retry writes
     automatically.

#### T018 — Durable operation state and deduplication service

- [ ] T018 [US2] [Plan:3.2] Implement transactionally durable pending operation creation, request-ID deduplication, and operation state transitions.
- **Requirements**: REQ-015, REQ-016, REQ-027
- **Files**: `backend/src/services/operations.js`, `backend/src/db/operations.js`,
  `backend/migrations/`
- **Dependencies**: T003, T006, T015.
- **Acceptance criteria**:
  1. A write operation with requester, provider, target/destination when known, action,
     proposed change summary, timestamp, and unique request identifier is persisted
     before the external write.
  2. A repeated request identifier returns the existing operation and cannot trigger
     a second provider write.
  3. Pending, completed, failed, and uncertain states are enforced; completion is not
     recorded unless provider success is confirmed and local update succeeds.
  4. Database failure before pending persistence prevents the provider call; failure
     after provider acceptance leaves the record available for reconciliation.

#### T019 — Jira issue creation UI

- [ ] T019 [US2] [Plan:3.2] Build accessible Jira issue form, review step, explicit confirmation, and outcome display.
- **Requirements**: REQ-006, REQ-007, REQ-014, REQ-016, REQ-023, REQ-028
- **Files**: `frontend/src/features/jira/CreateIssuePage.jsx`,
  `frontend/src/features/jira/ReviewIssueDialog.jsx`,
  `frontend/src/features/jira/issue-create-api.js`
- **Dependencies**: T010, T015-T018.
- **Acceptance criteria**:
  1. The form displays the Jira site, project, issue type, summary, description,
     priority, assignee, and supported project-required fields.
  2. Missing/invalid fields show actionable errors; unsupported required fields block
     submission with an explanation.
  3. The user sees all proposed values and the destination before a separate explicit
     confirmation action; dismissing review causes no write.
  4. UI distinguishes pending, completed, failed, and uncertain outcomes; it displays
     the issue key only on confirmed success and gives a verification path for uncertain
     results.
  5. The 2-second local validation/request acceptance feedback target is met without
     conflating it with remote completion time.

**US2 exit gate**: Jira issue creation passes backend and browser tests, including
required-field rejection, pending-before-write, single-write deduplication, and
uncertain-outcome verification. User cohort success is measured in Phase 4.

### US3 — Jira search and single-issue updates

#### T020 — US3 acceptance tests first

- [ ] T020 [US3] [Plan:3.3] Write failing Jira search/update tests for access filtering, pagination, confirmation, conflicts, and excluded operations.
- **Requirements**: REQ-004, REQ-005, REQ-006, REQ-008, REQ-009, REQ-014, REQ-015, REQ-016, REQ-018, REQ-027, REQ-029
- **Files**: `backend/tests/jira/issue-search-update.test.js`,
  `frontend/tests/e2e/jira-search-update.spec.js`
- **Dependencies**: US2 exit gate; T018.
- **Acceptance criteria**:
  1. Tests cover search by key/text with optional project, accessible-only results,
     25-item pages, and next-page navigation.
  2. Tests cover confirmation-before-update, supported fields only, stale-version
     conflict, permission change, provider timeout, and durable history records for
     searches and writes.
  3. Tests assert deletion, bulk write, and workflow-transition routes/actions are not
     available.
  4. Missing-behavior tests fail before implementation starts.

#### T021 — Jira search API and operation records

- [ ] T021 [US3] [Plan:3.3] Implement Jira key/text search, optional project scope, 25-result pagination, and per-REQ-015 search records.
- **Requirements**: REQ-004, REQ-005, REQ-014, REQ-015, REQ-018, REQ-028, REQ-029
- **Files**: `backend/src/routes/jira-issues.js`,
  `backend/src/integrations/atlassian/jira/issues.js`,
  `backend/src/services/operations.js`
- **Dependencies**: T013, T018, T020.
- **Acceptance criteria**:
  1. A search is executed as the current user's Atlassian identity and returns no
     inaccessible issue.
  2. Search accepts issue key/text and optional accessible project scope; page size
     is 25 and pagination returns subsequent results without duplicates or omissions.
  3. Each user-requested search creates the required minimal requester/provider/action/
     timestamp/outcome record without storing unnecessary issue content.
  4. Read retries are bounded to three attempts, respect `Retry-After`, and surface
     prolonged provider errors.

#### T022 — Jira single-issue update service

- [ ] T022 [US3] [Plan:3.3] Implement confirmed single-issue updates for supported fields with stale revision and permission-conflict handling.
- **Requirements**: REQ-006, REQ-008, REQ-009, REQ-014, REQ-015, REQ-016, REQ-018, REQ-027
- **Files**: `backend/src/integrations/atlassian/jira/issues.js`,
  `backend/src/routes/jira-issues.js`, `backend/src/services/operations.js`
- **Dependencies**: T018, T020-T021.
- **Acceptance criteria**:
  1. The service accepts only one accessible issue and the supported editable fields;
     status transitions and bulk targets are rejected.
  2. The operation is pending durably before provider write and requires an explicit
     confirmation signal tied to the reviewed proposal.
  3. Stale revision or changed permission is returned as conflict/denied; no newer
     provider value is silently overwritten.
  4. Provider timeout after submission yields uncertain state and never triggers an
     automatic write retry.

#### T023 — Jira search and update UI

- [ ] T023 [US3] [Plan:3.3] Build Jira search, result list, issue details, supported-field editor, and review/update dialog.
- **Requirements**: REQ-005, REQ-006, REQ-008, REQ-009, REQ-023, REQ-028
- **Files**: `frontend/src/features/jira/IssueSearchPage.jsx`,
  `frontend/src/features/jira/IssueDetailsPage.jsx`,
  `frontend/src/features/jira/ReviewIssueUpdateDialog.jsx`,
  `frontend/src/features/jira/issue-search-api.js`
- **Dependencies**: T010, T020-T022.
- **Acceptance criteria**:
  1. Search offers key/text and optional project scope, displays accessible results,
     and supports 25-item pagination.
  2. Update review identifies site, project, issue key, current summary, and proposed
     values; no update is sent before explicit confirmation.
  3. Conflict, permission-denied, failed, pending, and uncertain results are distinct
     and actionable.
  4. The UI does not expose delete, bulk operation, or status-transition controls;
     keyboard and assistive technology behavior passes relevant accessibility checks.

**US3 exit gate**: Search and individual updates meet access, pagination, field,
confirmation, conflict, and exclusion criteria.

### US4 — Confluence search, create, and update

#### T024 — US4 acceptance tests first

- [ ] T024 [US4] [Plan:3.4] Write failing Confluence tests for accessible search, pagination, preview safety, confirmed publication, conflict, and uncertainty.
- **Requirements**: REQ-004, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-018, REQ-019, REQ-027, REQ-029
- **Files**: `backend/tests/confluence/page-operations.test.js`,
  `frontend/tests/e2e/confluence-pages.spec.js`
- **Dependencies**: US3 exit gate; T018.
- **Acceptance criteria**:
  1. Tests cover accessible selected-space search, 25-result pagination, page create,
     page update, and operation-history recording.
  2. Tests prove no write occurs until review and explicit confirmation and that confirmed
     changes publish immediately.
  3. Tests cover untrusted markup preview, conflict, permission denial, uncertain
     outcome, and absence of delete functionality.
  4. Missing-behavior tests fail before implementation begins.

#### T025 — Confluence search and provider services

- [ ] T025 [US4] [Plan:3.4] Implement accessible Confluence space/page search, 25-result pagination, and search operation records.
- **Requirements**: REQ-004, REQ-010, REQ-015, REQ-018, REQ-028, REQ-029
- **Files**: `backend/src/integrations/atlassian/confluence/pages.js`,
  `backend/src/routes/confluence-pages.js`, `backend/src/services/operations.js`
- **Dependencies**: T013, T018, T024.
- **Acceptance criteria**:
  1. Only the user's accessible spaces/pages are searchable; an inaccessible space
     cannot be used as a destination.
  2. Search supports selected-space text search and 25-result pagination.
  3. Every search is recorded with the minimum required operation metadata.
  4. Provider read retry behavior is bounded and rate-limit aware, with explicit errors.

#### T026 — Confluence page create/update routes

- [ ] T026 [US4] [Plan:3.4] Implement server-validated page create/update routes with safe content handling, confirmation, and revision conflicts.
- **Requirements**: REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-019, REQ-027
- **Files**: `backend/src/routes/confluence-pages.js`,
  `backend/src/integrations/atlassian/confluence/pages.js`,
  `backend/src/validation/confluence-page.js`, `backend/src/services/operations.js`
- **Dependencies**: T018, T024-T025.
- **Acceptance criteria**:
  1. A create/update request is validated server-side and is scoped to one allowed space
     or page; no delete route is provided.
  2. Create/update requires an explicit confirmed proposal, persists pending state
     before provider write, and publishes immediately after confirmation.
  3. Untrusted content is encoded/sanitized for the supported content format, and stale
     revision conflicts do not overwrite newer content.
  4. Provider success/failure/timeout is mapped to accurate completed/failed/uncertain
     status and recorded without unnecessary page body retention.

#### T027 — Confluence user interface

- [ ] T027 [US4] [Plan:3.4] Build Confluence space/page search, editor, safe preview, and publish-confirmation screens.
- **Requirements**: REQ-010, REQ-011, REQ-012, REQ-013, REQ-019, REQ-023, REQ-028
- **Files**: `frontend/src/features/confluence/`,
  `frontend/src/features/confluence/page-api.js`
- **Dependencies**: T010, T024-T026.
- **Acceptance criteria**:
  1. User can search only accessible pages within an accessible selected space and
     navigate result pages.
  2. Editor preview displays content as inert content; markup cannot execute scripts
     or inject active content.
  3. Confirmation identifies site, space, optional parent, title, full proposed
     content/preview, and immediate publication effect; closing confirmation makes no
     write.
  4. Conflict, failed, and uncertain outcomes are distinct and have safe next steps;
     there is no delete control.

**US4 exit gate**: Confluence search/create/update passes provider and browser tests,
including safe preview, required confirmation, immediate publish, and conflict/
uncertainty behavior.

### US5 — Private operation history, audit, and retention

#### T028 — US5 acceptance tests first

- [ ] T028 [US5] [Plan:3.5] Write failing tests for private history access, operation lifecycle, uncertain-result review, and retention.
- **Requirements**: REQ-015, REQ-016, REQ-017, REQ-021, REQ-022, REQ-027, REQ-032
- **Files**: `backend/tests/operations/`, `backend/tests/retention/`,
  `frontend/tests/e2e/operation-history.spec.js`
- **Dependencies**: T018 and US2-US4 operation flows.
- **Acceptance criteria**:
  1. Tests assert a user can list/read only their own operation records; administrators
     cannot view personal tokens or other users' history.
  2. Tests cover pending/completed/failed/uncertain display and a safe uncertain
     verification flow with explicit user-approved retry.
  3. Tests check expiry at 365 days, purge by expiry plus 24 hours, and re-purge or
     filtering after backup restore.
  4. Missing-behavior tests fail for the intended cases before implementation starts.

#### T029 — Requester-scoped operation endpoints

- [ ] T029 [US5] [Plan:3.5] Implement operation history/detail routes with requester-only access and minimal safe result fields.
- **Requirements**: REQ-015, REQ-016, REQ-017, REQ-021, REQ-032
- **Files**: `backend/src/routes/operations.js`, `backend/src/services/operations.js`,
  `backend/src/db/operations.js`
- **Dependencies**: T018, T028.
- **Acceptance criteria**:
  1. Every operation query is scoped to the authenticated requester in backend
     authorization and database access.
  2. Responses include operation ID, provider, action, target where known, timestamps,
     lifecycle state, and outcome needed by the user, but omit unnecessary provider
     content and all credentials.
  3. An administrator role cannot bypass requester scoping or read another user's
     personal token/operation detail.
  4. Tests for all lifecycle states and cross-user access pass.

#### T030 — Operation history UI and uncertain verification

- [ ] T030 [US5] [Plan:3.5] Build private operation history with clear lifecycle states and uncertain-write verification guidance.
- **Requirements**: REQ-016, REQ-017, REQ-021, REQ-023, REQ-028
- **Files**: `frontend/src/features/operations/OperationHistoryPage.jsx`,
  `frontend/src/features/operations/operation-api.js`
- **Dependencies**: T010, T028-T029.
- **Acceptance criteria**:
  1. The initiating user sees their own history with clear pending, completed, failed,
     and uncertain states; users cannot navigate to another user's operation details.
  2. Uncertain operations explain verification steps and do not retry automatically;
     retry requires a separate explicit user action after verification.
  3. Completion is not presented as success until the backend returns a confirmed
     completed state.
  4. The history route meets relevant keyboard and WCAG 2.2 AA criteria.

#### T031 — Retention expiry and purge job

- [ ] T031 [US5] [Plan:3.5] Implement 365-day operation/audit expiry and purge processing within 24 hours.
- **Requirements**: REQ-022, REQ-025, REQ-032
- **Files**: `backend/src/jobs/`, `backend/src/db/`, `backend/src/config/env.js`,
  `backend/tests/retention/`
- **Dependencies**: T003, T028-T029.
- **Acceptance criteria**:
  1. Operation and audit record expiry is computed from creation time plus 365 days
     using a consistent UTC policy.
  2. A repeatable purge process deletes expired records and runs often enough to meet
     the expiry-plus-24-hour bound; failures are observable and do not report success.
  3. Purge removes or appropriately expires linked retained content and references
     within application storage according to the spec.
  4. Restore/recovery procedures filter and re-delete expired records before restored
     data is exposed; operational backup/replica implementation is verified in T038.

**US5 exit gate**: Users can review only their own operations, uncertainty remains
explicit, and retention purge behavior is verified against PostgreSQL 15.

**Milestone M3**: US1-US5 exit gates pass independently in priority order.

## Phase 4: Integration and Testing

### T032 — Cross-feature API and provider integration

- [ ] T032 [Plan:4.1] Run backend contracts and integrations against PostgreSQL 15 and deterministic Jira/Confluence responses.
- **Requirements**: REQ-001-020, REQ-026, REQ-027, REQ-031, REQ-033
- **Files**: `backend/tests/contract/`, `backend/tests/integration/`,
  `backend/tests/fixtures/`
- **Dependencies**: US1-US5 exit gates.
- **Acceptance criteria**:
  1. All routes conform to documented request, response, validation-error, permission,
     provider-failure, and operation-status shapes.
  2. Test coverage verifies identity scoping, accessible-resource filtering,
     25-result pagination, deduplication, confirmation, pending-before-write, and all
     operation terminal/uncertain states.
  3. Persistence and migration tests run against PostgreSQL 15; deterministic test
     fixtures contain no live secrets or production records.
  4. The full relevant test command returns success and stores its output/result for
     release review.

### T033 — Remote failure and reconciliation matrix

- [ ] T033 [Plan:4.2] Test database/provider failure ordering, rate limits, bounded reads, duplicate submissions, and uncertain-write reconciliation.
- **Requirements**: REQ-014, REQ-015, REQ-016, REQ-018, REQ-027, REQ-028, REQ-031
- **Files**: `backend/tests/integration/`, `backend/tests/fixtures/providers/`
- **Dependencies**: T032.
- **Acceptance criteria**:
  1. Database failure before pending persistence produces no provider write.
  2. Provider acceptance followed by local status-write failure leaves a durable pending
     record and does not show completion until remote verification reconciles it.
  3. Provider 401/403/409/429/5xx/timeouts are mapped to correct user-safe outcomes;
     rate-limit handling follows `Retry-After`.
  4. Read retries never exceed three attempts; uncertain writes are never automatically
     retried; duplicate requests cannot issue duplicate writes.

### T034 — Security and privacy verification

- [ ] T034 [Plan:4.2] Verify OAuth protection/redaction, session and authorization boundaries, safe rendering, and absence of out-of-scope write paths.
- **Requirements**: REQ-003, REQ-004, REQ-009, REQ-013, REQ-017, REQ-019, REQ-020, REQ-032, REQ-033, REQ-035
- **Files**: `backend/tests/security/`, `frontend/tests/security/`,
  `frontend/tests/e2e/`
- **Dependencies**: T032-T033 and approved non-production SSO/OAuth settings.
- **Acceptance criteria**:
  1. Access/refresh tokens are encrypted at rest, excluded from API responses and
     logs, and unavailable to unauthorized users, including administrators.
  2. Unauthenticated, cross-user, inaccessible-resource, revoked-authorization, and
     post-disconnect requests are denied without provider access.
  3. User/provider markup cannot execute in previews; sensitive provider fields are
     not unintentionally logged or retained.
  4. No product endpoint or UI action supports deletes, bulk writes, or Jira workflow
     status transitions.

### T035 — Browser end-to-end journeys

- [ ] T035 [Plan:4.3] Add and run Playwright tests for all five principal user journeys.
- **Requirements**: REQ-002, REQ-006-008, REQ-010-012, REQ-017, REQ-021, REQ-023, REQ-031
- **Files**: `frontend/tests/e2e/`
- **Dependencies**: T032-T034; SSO/OAuth test tenant and provider test configuration.
- **Acceptance criteria**:
  1. Playwright covers SSO/provider connection, reviewed Jira create, Jira search/
     update, Confluence search/publish, and private history/uncertain recovery.
  2. Each journey verifies user-visible results and at least one relevant failure or
     permission edge case.
  3. Test setup isolates data with unique run identifiers and does not depend on
     production content or credentials.
  4. All five critical journeys pass in the supported browser environment.

### T036 — Performance, usability, and latency separation

- [ ] T036 [Plan:4.3] Measure REQ-028/029/030 user feedback, search latency, and first-time issue-creation usability thresholds.
- **Requirements**: REQ-028, REQ-029, REQ-030
- **Files**: `backend/tests/performance/`, `frontend/tests/e2e/`, `spec/` release evidence
- **Dependencies**: T035; representative accessible test data and 20-user test cohort.
- **Acceptance criteria**:
  1. Run exactly 100 representative searches and record provider response latency and
     time to display first results separately.
  2. At least 95 searches show first results within 5 seconds when the provider
     responds within 2 seconds and is available.
  3. Local validation and request-acceptance feedback are measured separately and meet
     the 2-second target under normal service conditions.
  4. At least 19 of 20 representative first-time users correctly complete reviewed
     Jira issue creation without assistance; record task success and observed failure
     points.

### T037 — WCAG 2.2 AA journey review

- [ ] T037 [Plan:4.3] Complete automated, keyboard-only, and screen-reader accessibility reviews for all five journeys.
- **Requirements**: REQ-023
- **Files**: `frontend/src/`, `frontend/tests/accessibility/`, release test evidence
- **Dependencies**: T035.
- **Acceptance criteria**:
  1. Automated accessibility checks report no unresolved WCAG 2.2 AA violations in the
     five specified journeys.
  2. Keyboard-only review completes each journey with visible focus and no keyboard
     trap.
  3. Screen-reader review verifies names, roles, instructions, validation errors,
     dialog behavior, and operation outcome announcements.
  4. Findings and retest evidence are recorded; all blocking findings are fixed before
     M4 passes.

### T038 — Retention, backup, and restore verification

- [ ] T038 [Plan:4.4] Verify expiry and permanent deletion across application data, logs, backups, and replicas, including restore behavior.
- **Requirements**: REQ-022, REQ-031
- **Files**: `backend/tests/retention/`, approved deployment backup/recovery procedures,
  release evidence
- **Dependencies**: T031; organization-provided backup, replica, and recovery design.
- **Acceptance criteria**:
  1. Expiry and purge tests demonstrate permanent deletion within 24 hours after
     records reach 365 days.
  2. Application stores, logs, replicas, and backups are covered by specific evidence
     or an approved retention control, not inferred from database row deletion.
  3. A recovery/restore exercise proves expired records are removed before restored
     data becomes accessible.
  4. Any uncovered backup/replica path blocks M4 and is recorded as an unresolved
     release risk.

### T039 — Migration, local setup, and operational documentation

- [ ] T039 [Plan:4.4] Verify clean/upgrade migrations and document fresh local startup, environment configuration, and recovery responsibilities.
- **Requirements**: REQ-024, REQ-025, REQ-026, REQ-031, REQ-034
- **Files**: `README.md`, `backend/README.md`, `frontend/README.md`,
  `backend/migrations/`, `compose.yaml`
- **Dependencies**: T001-T010, T031; organization-provided operational owner/recovery
  inputs for deployment-specific documentation.
- **Acceptance criteria**:
  1. A clean developer environment can follow the docs to start PostgreSQL 15, apply
     migrations, start backend/frontend, and run the health check without production
     credentials.
  2. Migration tests pass both from an empty database and from the prior schema
     revision.
  3. Documentation identifies required environment variables, safe local values,
     secret handling, service commands, and troubleshooting steps without secrets.
  4. Intended deployment has a named operational owner and approved recovery process;
     otherwise production release remains blocked.

### T040 — M4 release readiness gate

- [ ] T040 [Plan:4.4] Assemble evidence and approve the final release gate only when every required acceptance threshold passes.
- **Requirements**: REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027, REQ-028, REQ-029, REQ-030, REQ-031, REQ-032, REQ-033, REQ-034, REQ-035
- **Files**: `spec/plan.md`, `spec/tasks.md`, test/release evidence, approved organization configuration records
- **Dependencies**: T032-T039 and M1-M3 exit gates.
- **Acceptance criteria**:
  1. All five story gates pass, all required security/privacy tests pass, and no
     critical security or privacy failure remains open.
  2. The 100-search, 20-user, 2-second local feedback, and accessibility thresholds
     have recorded pass evidence.
  3. Retention and restore evidence covers application stores, logs, backups, and
     replicas; expired records cannot be restored into service.
  4. Runtime/dependency/browser versions are pinned, setup and recovery documentation
     is verified, and organization-specific SSO/OAuth/hosting/operations inputs are
     approved.
  5. Release approver records pass/fail for each gate; unresolved mandatory input
     means fail/defer, not assumed success.

**Milestone M4**: Release candidate is eligible for deployment after T040 passes.

## Dependency and Execution Order

1. T001-T005 establish backend and test foundations; T002 and T005 may run in parallel
   where their package/configuration work does not overlap. T003 follows T001/T002.
   T006 follows schema, database service, and test harness.
2. T007 can proceed alongside backend foundation. T008-T010 depend on T007.
3. Phase 3 starts only after M1 and M2. Within each story, acceptance tests precede
   implementation. US1 must pass before provider-backed user stories; stories then
   proceed US2 → US3 → US4 → US5.
4. Phase 4 follows the five story exit gates. T038 also requires approved backup and
   recovery controls. T040 cannot pass while any mandatory organizational input or
   acceptance criterion remains unresolved.

## Plan Item Coverage

| Plan item | Tasks |
|-----------|-------|
| 1.1 | T001 |
| 1.2 | T002, T003, T006 |
| 1.3 | T004 |
| 1.4 | T005, T006 |
| 2.1 | T007 |
| 2.2 | T008, T009 |
| 2.3 | T010 |
| 3.1 | T011-T014 |
| 3.2 | T015-T019 |
| 3.3 | T020-T023 |
| 3.4 | T024-T027 |
| 3.5 | T028-T031 |
| 4.1 | T032 |
| 4.2 | T033-T034 |
| 4.3 | T035-T037 |
| 4.4 | T038-T040 |

All 16 plan items are represented by the 40 tasks above. Requirement traceability
remains authoritative in the [plan-to-requirements checkpoint](./checkpoints/spec-to-plan.yaml)
and the [plan-to-task checkpoint](./checkpoints/plan-to-tasks.yaml).
