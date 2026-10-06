# Implementation Plan: Jira and Confluence Automation Workspace

**Date**: 2026-10-06 | **Spec**: [specification.md](./specification.md)

## Summary

Implement the single-organization Jira/Confluence workspace in four gated phases:
backend foundation, frontend foundation, one user-facing feature at a time, and final
integration/acceptance testing. The MVP's first independently testable value is
company-SSO sign-in followed by a user-authorized Atlassian Cloud connection and a
reviewed Jira issue creation flow. Individual Jira search/update, Confluence
search/create/update, and private operation history follow as separate increments.

The backend owns authentication, OAuth tokens, authorization checks, provider API
calls, durable operation records, and error translation. The frontend consumes the
backend's JSON API and never receives Atlassian credentials. PostgreSQL 15 is run
through Docker for development and integration testing. Exact company SSO, OAuth
client, network, and secret-management configuration must be provided by the
organization before the corresponding integration can pass its release gate.

## Technical Context

**Language/Version**: JavaScript; React 18 frontend; Node.js 24 LTS line, with the
latest security-patched patch version pinned during Phase 1.
**Primary Dependencies**: Vite compatible with Node.js 24 and React 18, React Router,
Express 5, PostgreSQL client, a reviewed database-migration runner, Atlassian Cloud
REST APIs and OAuth 3LO. Exact compatible versions are pinned in the package
manifests and lockfiles during setup.
**Storage**: PostgreSQL 15. Initial domain includes users/SSO identity references,
per-user Atlassian connection metadata, operation history, and security audit
metadata. OAuth tokens are server-side encrypted and are not exposed to clients or
logs.
**Testing**: Node test runner plus Supertest for backend unit/HTTP tests; Vitest and
Testing Library for frontend tests; PostgreSQL 15 in Docker for persistence and
integration tests; Playwright for browser acceptance journeys. Use provider test
tenants or deterministic provider stubs for external-service failure cases.
**Target Platform**: One internally hosted organization deployment; local
development/test database via Docker. Deployment environment, ingress, SSO
configuration, and secret manager are organization-provided planning inputs.
**Performance Goals**: At least 95 of 100 representative searches display first-page
results within 5 seconds when Atlassian responds within 2 seconds; local validation
and request-acceptance feedback within 2 seconds.
**Constraints**: Meet the five constitution principles; React 18 + Vite, Node.js +
Express, PostgreSQL 15 via Docker; Atlassian Cloud only; company SSO and per-user
OAuth 3LO; no delete, bulk, status-transition, scheduled, or unattended operations;
explicit confirmation for every write; durable pending operation before provider
write; uncertain writes are not retried automatically; one-year record retention;
WCAG 2.2 AA.

## Milestones and Phase Gates

| Milestone | Phase | Exit criteria |
|-----------|-------|---------------|
| M1 — Backend foundation ready | Phase 1 | Backend starts from documented configuration; PostgreSQL 15 starts via Docker; versioned migrations run; health endpoint and API error/validation conventions work; pending-operation schema and persistence path are tested. |
| M2 — Frontend shell ready | Phase 2 | Vite/React app starts; routes and authenticated/unauthenticated states are navigable; accessible shared shell and API client handle loading and error states. |
| M3 — Feature increments accepted | Phase 3 | Each user story has an independent acceptance check; no story is marked done until its own role, failure, and confirmation cases pass. |
| M4 — Release candidate verified | Phase 4 | End-to-end journeys, security/failure behavior, PostgreSQL 15 behavior, 100-search performance sample, WCAG 2.2 AA review, retention checks, and local setup documentation meet specified gates. |

## Constitution Check

*GATE: Must pass before implementation; re-check after design review and at M4.*

| Principle | Plan decision | Gate |
|-----------|---------------|------|
| I. Secure Integration by Default | Company SSO and per-user OAuth; backend-only tokens; least-privilege scopes; server-side validation; safe content rendering; redacted logs. | Pass, conditional on organization-provided SSO/OAuth configuration and security verification in Phase 4. |
| II. Safe, User-Controlled Automation | Every create/update has a review-and-confirm step; unsupported destructive/bulk/status-transition operations are excluded; pending operation is durable before provider write; uncertain writes require verification and explicit retry. | Pass. |
| III. Explicit Contracts and Durable Data | JSON API request/response/error shapes; server-side validation; versioned PostgreSQL migrations; transactional local operation persistence and reconciliation. | Pass. |
| IV. Test Observable Behavior | Each story has independent acceptance checks; PostgreSQL 15 integration tests; provider failure tests; full user-journey and performance tests. | Pass. |
| V. Operable, Understandable Design | User-facing errors distinguish failed/uncertain outcomes; operation/audit records exclude unnecessary content; actionable health/status and setup guidance. | Pass, provided operational owner and production recovery targets are confirmed before deployment. |

No principle exception is proposed. If implementation requires an exception, record
the principle, rationale, risk, and mitigation and obtain review before proceeding.

## Applied Guidelines

No matching technology migration/scaffolding guideline was found in the available
`skills/guidelines/` collection. This is a greenfield rewrite plan, not a framework
conversion. Node.js 24 LTS and Express 5 are selected; the exact patched Node.js,
React 18, Vite, Express, and supporting dependency versions will be pinned and tested
in the Phase 1/2 lockfiles. Company SSO provider/protocol and hosting-specific
configuration remain organization inputs and are release gates, not assumed design
decisions.

## Implementation Steps

### Phase 1: Backend Setup — Database and API Skeleton

**Purpose**: Establish a runnable backend, PostgreSQL 15 persistence, and stable API
foundations before feature work.

#### Step 1.1: Scaffold backend runtime and configuration

- **Requirements**: REQ-025, REQ-034
- **Design inputs**: `specification.md` Target Technology Stack and Planning Details;
  `constitution.md` Target Technology Stack and Additional Constraints.
- **Description**: Create `backend/package.json`, lockfile, `.nvmrc` (or equivalent
  runtime pin), `backend/src/server.js`, `backend/src/app.js`,
  `backend/src/config/env.js`, and `backend/README.md`. Pin the latest security-patched
  Node.js 24 LTS patch available at implementation time. Keep secrets external;
  validate required configuration at process startup and fail with a clear, redacted
  error.

#### Step 1.2: Add PostgreSQL 15 container and migration foundation

- **Requirements**: REQ-022, REQ-026, REQ-027, REQ-034
- **Design inputs**: Specification Key Entities, REQ-015–017 and REQ-022/026/027;
  PostgreSQL 15/Docker constraints in constitution.
- **Description**: Add root `compose.yaml` with a PostgreSQL 15 service, health check,
  named development volume, and non-production credentials supplied from environment
  configuration. Add a migration runner and `backend/migrations/` directory. Define
  initial migrations for SSO user reference, per-user provider connection metadata,
  uniquely identified operation records, audit metadata, timestamps, and
  retention-expiry fields. Do not place provider tokens in migration fixtures.

#### Step 1.3: Create API skeleton, validation and error conventions

- **Requirements**: REQ-014, REQ-025, REQ-028, REQ-032, REQ-033
- **Design inputs**: Specification REQ-014, REQ-025, REQ-028, REQ-032/033;
  constitution Principles I, III, and V.
- **Description**: Add `backend/src/routes/`, `backend/src/middleware/`,
  `backend/src/validation/`, and `backend/src/errors/`. Establish JSON request and
  response conventions, centralized server-side validation, correlation/request IDs,
  safe error mapping, and an explicit health endpoint. Add route placeholders for
  authentication, Jira, Confluence, connections, and operations without implementing
  product behavior in this step.

#### Step 1.4: Add structured, redacted logging and backend test harness

- **Requirements**: REQ-003, REQ-027, REQ-028, REQ-032
- **Design inputs**: Specification REQ-003, REQ-027/028/032; constitution Principles I,
  IV, and V.
- **Description**: Add `backend/src/observability/logger.js` with structured operation
  context and explicit credential/token/request-body redaction. Set up
  `backend/tests/` with Node test runner and Supertest. Test environment validation,
  health/error conventions, logger redaction, and migration execution against the
  Docker PostgreSQL 15 service.

**Milestone M1**: Run the backend and database from documented local configuration;
health, migrations, error conventions, and log redaction pass automated checks.

### Phase 2: Frontend Setup — UI Skeleton and Routing

**Purpose**: Establish the user-facing shell and API boundary before implementing
provider-connected features.

#### Step 2.1: Scaffold React 18 and Vite application

- **Requirements**: REQ-023, REQ-034
- **Design inputs**: Specification Target Technology Stack, five user stories, and
  WCAG 2.2 AA target.
- **Description**: Create `frontend/package.json`, lockfile,
  `frontend/vite.config.js`, `frontend/index.html`, and
  `frontend/src/main.jsx`. Pin Vite and frontend dependencies compatible with React 18.
  Add a visible application shell, global error boundary, and environment-specific
  backend base URL configuration.

#### Step 2.2: Add routes, authenticated shell, and API client

- **Requirements**: REQ-002, REQ-023, REQ-033
- **Design inputs**: Specification User Stories 1–5 and REQ-002/023/033.
- **Description**: Add `frontend/src/app/router.jsx`,
  `frontend/src/api/client.js`, `frontend/src/auth/RequireSession.jsx`, and route
  placeholders for `/login`, `/connections`, `/jira/issues`, `/confluence/pages`, and
  `/operations`. Implement request correlation, loading/empty/error states, and
  secure session-aware navigation; never place Atlassian tokens in browser storage.

#### Step 2.3: Establish accessible shared UI patterns

- **Requirements**: REQ-006, REQ-023
- **Design inputs**: Specification review/confirmation requirements and WCAG 2.2 AA.
- **Description**: Add reusable form controls, status banners, dialogs, page headings,
  keyboard focus management, and accessible validation summaries in
  `frontend/src/components/`. Add frontend tests under `frontend/src/**/*.test.jsx`
  for labels, keyboard use, focus return, errors, and status announcements.

**Milestone M2**: Frontend starts independently against the backend skeleton; all
routes render, API errors are visible, and shell-level accessibility tests pass.

### Phase 3: Feature Implementation — One User Story at a Time

**Purpose**: Implement independently testable features in specification priority
order. A feature is not considered complete until its story-level acceptance tests
pass. For each story, author its tests first, confirm the tests fail against the
unimplemented behavior, and then implement the story until they pass.

#### Step 3.1: US1 — Company SSO and per-user Atlassian Cloud connections

- **Requirements**: REQ-001–004, REQ-020, REQ-025, REQ-035
- **Design inputs**: Specification User Story 1; Planning Details for SSO/OAuth inputs;
  constitution Principle I.
- **Description**: Obtain the organization's SSO provider/protocol, issuer/client
  configuration, callback URLs, Atlassian Cloud site allowlist, and approved minimum
  OAuth scopes before integration testing. Implement application sign-in in
  `backend/src/auth/`, session enforcement middleware, Atlassian OAuth 3LO callback
  handling, encrypted server-side access/refresh-token storage, refresh/revocation/
  disconnect behavior, and connection status routes in
  `backend/src/integrations/atlassian/`. Add corresponding sign-in and connection
  screens in `frontend/src/features/auth/` and `frontend/src/features/connections/`.
  Enforce per-user identity and provider permissions; administrator configuration
  MUST NOT expose or impersonate personal OAuth credentials.

#### Step 3.2: US2 — Reviewed Jira issue creation (P1 MVP)

- **Requirements**: REQ-006–007, REQ-014–016, REQ-018, REQ-027–028, REQ-030
- **Design inputs**: Specification User Story 2, Jira field scope, unsupported
  required-field rule, pending-operation policy, and success criterion SC-003.
- **Description**: Implement `backend/src/integrations/atlassian/jira/metadata.js`,
  `issues.js`, `backend/src/routes/jira-issues.js`, and
  `backend/src/services/operations.js` for accessible project listing, required-field
  metadata, server-side validation, request-ID deduplication, durable pending records,
  Jira issue creation, and confirmed/failed/uncertain state updates. Implement
  `frontend/src/features/jira/CreateIssuePage.jsx` and
  `frontend/src/features/jira/ReviewIssueDialog.jsx` for project selection, supported
  fields, field errors, review, explicit confirmation, and outcome display. Block
  submission when a mandatory Jira field is unsupported.

#### Step 3.3: US3 — Jira issue search and single-issue updates

- **Requirements**: REQ-004–009, REQ-014–018, REQ-027–029
- **Design inputs**: Specification User Story 3, accessible search defaults, shared
  field set, no-delete/no-bulk/no-transition limits, and conflict behavior.
- **Description**: Implement paginated key/text search and project scoping in
  `backend/src/routes/jira-issues.js` and
  `backend/src/integrations/atlassian/jira/issues.js`. Add one-issue update service
  with confirmation, current revision/conflict checking where supported, request
deduplication, durable operation status, and REQ-015 operation records for every
search and write. Build
  `frontend/src/features/jira/IssueSearchPage.jsx`,
  `IssueDetailsPage.jsx`, and `ReviewIssueUpdateDialog.jsx`. Enforce 25 results per
  page and omit deletion, bulk writes, and status transitions from the UI and API.

#### Step 3.4: US4 — Confluence search, create, and update

- **Requirements**: REQ-004, REQ-010–014, REQ-018–019, REQ-027–029
- **Design inputs**: Specification User Story 4, Atlassian Cloud page/content
  constraints, immediate publish after confirmation, and no-delete rule.
- **Description**: Implement paginated space-scoped page search and one-page
  create/update in `backend/src/integrations/atlassian/confluence/pages.js` and
  `backend/src/routes/confluence-pages.js`. Validate destination and page content on
  the server; safely encode/sanitize preview content; detect stale page revisions and
  return a conflict rather than silently overwriting. Record each search and write
  operation per REQ-015. Implement
  `frontend/src/features/confluence/PageSearchPage.jsx`,
  `PageEditorPage.jsx`, and `ReviewPublishDialog.jsx`. Confirmation must display the
  space, optional parent page, title, content preview, and immediate publication
  effect. Do not expose a delete action.

#### Step 3.5: US5 — Private operation history, audit, and retention

- **Requirements**: REQ-015–017, REQ-021–022, REQ-027–028, REQ-032
- **Design inputs**: Specification User Story 5, operation/audit entities, private
  history visibility, and 365-day deletion policy.
- **Description**: Implement requester-scoped operation list/detail endpoints and
  `frontend/src/features/operations/OperationHistoryPage.jsx` with pending,
  completed, failed, and uncertain states. Persist minimal audit fields and prohibit
  cross-user history access by default, including for integration administrators.
  Add a documented purge worker under `backend/src/jobs/` that removes expired records
  within 24 hours, covers logs/backups/replicas in the operational design, and cannot
  restore expired records during recovery. Provide user verification steps for
  uncertain writes and reconcile provider state before enabling an explicit retry.

**Milestone M3**: US1–US5 are independently testable and pass their story-specific
acceptance scenarios. Complete one story's backend, frontend, and tests before starting
the next story's implementation.

### Phase 4: Integration and Testing

**Purpose**: Verify cross-service journeys, failure recovery, accessibility, privacy,
performance, retention, and reproducible setup before release.

#### Step 4.1: Run cross-feature contract and integration suites

- **Requirements**: REQ-001–020, REQ-026–027, REQ-031, REQ-033
- **Design inputs**: All specification user stories and API error/operation rules.
- **Description**: Run backend contract/HTTP and service integration suites against
  PostgreSQL 15 in Docker and deterministic Jira/Confluence provider responses. Verify
  per-user access filtering, page size/pagination, project/space scoping, request
  deduplication, write confirmation, pending-before-provider ordering, and every
  terminal/uncertain operation status.

#### Step 4.2: Verify provider failure, security, and reconciliation behavior

- **Requirements**: REQ-003–004, REQ-014–020, REQ-022, REQ-027–028, REQ-032, REQ-035
- **Design inputs**: Specification Edge Cases, requirements, and constitution
  Principles I–III and V.
- **Description**: Test denied/expired/revoked OAuth, inaccessible records, malformed
  requests, provider 401/403/409/429/5xx and timeouts, database unavailability before
  and after provider writes, duplicate submissions, local final-status persistence
  failure, and user-approved reconciliation. Verify token encryption, token/log
  redaction, session enforcement, safe content rendering, private history access,
  bounded read retries, and no automatic retry of uncertain writes.

#### Step 4.3: Execute end-to-end and measurable acceptance tests

- **Requirements**: REQ-023, REQ-028–031, SC-001–009
- **Design inputs**: Five user journeys, specification acceptance scenarios, and all
  measurable success criteria.
- **Description**: Add Playwright journeys in `frontend/tests/e2e/` for sign-in/
  connection, reviewed Jira creation, Jira search/update, Confluence search/publish,
  and private history/recovery. Run 100 representative searches; record provider
  latency separately and confirm at least 95 display the first page within 5 seconds
  when provider response is within 2 seconds. Run usability acceptance with 20
  first-time users and verify at least 19 complete reviewed issue creation without
  assistance. Verify all five journeys meet WCAG 2.2 AA with automated checks plus
  keyboard and screen-reader review.

#### Step 4.4: Verify retention, recovery, local setup, and release readiness

- **Requirements**: REQ-022, REQ-025–027, REQ-031–035, SC-008, SC-010
- **Design inputs**: Specification Planning Details and Success Criteria; constitution
  Principles III–V.
- **Description**: Test 365-day expiry and deletion within 24 hours across application
  stores, logs, backups, and replicas; verify restore procedures cannot reintroduce
  expired records. Verify schema migration from a clean database and from the prior
  migration state. Validate documented clean-machine startup with PostgreSQL 15 via
  Docker and non-production health check without production credentials. Complete
  security/configuration review, record supported Node/dependency/browser versions,
  and close remaining operational ownership/availability/recovery inputs before
  production release.

**Milestone M4**: All end-to-end and measurable acceptance gates pass, no critical
security/privacy failure remains, expired records cannot be restored, and operational
inputs required for the intended internal deployment are approved.

## Implementation Tasks

### Phase 1: Backend Setup

- [ ] T001 [Plan:1.1] Create `backend/package.json` with Express 5, backend lockfile, pinned approved Node.js 24 LTS runtime configuration, `backend/src/server.js`, `backend/src/app.js`, and validated `backend/src/config/env.js`.
- [ ] T002 [P] [Plan:1.2] Add root `compose.yaml` with PostgreSQL 15, health check, named development volume, and environment-supplied non-production credentials.
- [ ] T003 [Plan:1.2] Add the backend migration runner and versioned migrations for user identity references, provider connection metadata, operation records, audit metadata, and expiry fields under `backend/migrations/`.
- [ ] T004 [Plan:1.3] Create backend route, middleware, validation, and error modules under `backend/src/`; implement JSON conventions, request IDs, centralized validation, and health endpoint.
- [ ] T005 [P] [Plan:1.4] Add structured, secret-redacting logger in `backend/src/observability/logger.js` and configure Node test runner plus Supertest in `backend/tests/`.
- [ ] T006 [Plan:1.2,1.4] Add PostgreSQL 15 migration and persistence tests in `backend/tests/integration/` using the Docker database.

### Phase 2: Frontend Setup

- [ ] T007 [P] [Plan:2.1] Create `frontend/package.json` with React 18 and compatible Vite, lockfile, Vite config, `frontend/index.html`, and React entry point at `frontend/src/main.jsx`.
- [ ] T008 [Plan:2.2] Implement frontend routing for `/login`, `/connections`, `/jira/issues`, `/confluence/pages`, and `/operations` in `frontend/src/app/router.jsx`.
- [ ] T009 [P] [Plan:2.2] Add session-aware API client and authenticated route guard in `frontend/src/api/client.js` and `frontend/src/auth/RequireSession.jsx`; keep provider credentials out of browser storage.
- [ ] T010 [P] [Plan:2.3] Build shared accessible forms, dialogs, status banners, focus handling, and validation summaries under `frontend/src/components/`; add shell accessibility tests.

### Phase 3: Feature Implementation

#### US1 — Sign in and authorize Atlassian access

- [ ] T011 [US1] [Plan:3.1] Write failing backend/browser acceptance tests for SSO access, OAuth denial/expiry/revocation, least-privilege resource filtering, and disconnect behavior in `backend/tests/` and `frontend/tests/e2e/`.
- [ ] T012 [US1] [Plan:3.1] Implement company-SSO session validation and authorization middleware under `backend/src/auth/`, using organization-provided issuer/client/callback configuration.
- [ ] T013 [US1] [Plan:3.1] Implement per-user Atlassian OAuth 3LO, encrypted server-side token storage, refresh, revocation, disconnect, and status routes under `backend/src/integrations/atlassian/`.
- [ ] T014 [P] [US1] [Plan:3.1] Build sign-in and provider connection/status screens in `frontend/src/features/auth/` and `frontend/src/features/connections/`.

#### US2 — Reviewed Jira issue creation (P1 MVP)

- [ ] T015 [US2] [Plan:3.2] Write failing acceptance tests for required fields, unsupported mandatory-field rejection, one confirmed create, provider denial/failure, and uncertain create in `backend/tests/` and `frontend/tests/e2e/`.
- [ ] T016 [US2] [Plan:3.2] Implement accessible project listing, Jira create-field metadata, and blocking behavior for unsupported required fields in `backend/src/integrations/atlassian/jira/metadata.js`.
- [ ] T017 [US2] [Plan:3.2] Implement server-side issue creation validation and provider call in `backend/src/integrations/atlassian/jira/issues.js` and `backend/src/routes/jira-issues.js`.
- [ ] T018 [US2] [Plan:3.2] Implement durable pending operation creation, request-ID deduplication, confirmed/failed/uncertain transitions, and safe results in `backend/src/services/operations.js`.
- [ ] T019 [US2] [Plan:3.2] Build issue form and review/confirm experience in `frontend/src/features/jira/CreateIssuePage.jsx` and `frontend/src/features/jira/ReviewIssueDialog.jsx`.

#### US3 — Jira search and issue updates

- [ ] T020 [US3] [Plan:3.3] Write failing tests for key/text search, 25-result pagination, supported-field updates, explicit confirmation, permission/conflict/timeout handling, and absence of delete/bulk/status-transition paths in `backend/tests/` and `frontend/tests/e2e/`.
- [ ] T021 [US3] [Plan:3.3] Implement key/text search, project scope, 25-result pagination, accessible issue summary responses, and REQ-015 search operation records in `backend/src/routes/jira-issues.js`.
- [ ] T022 [US3] [Plan:3.3] Implement supported-field update, explicit confirmation, deduplication, and stale revision conflict handling in `backend/src/integrations/atlassian/jira/issues.js`.
- [ ] T023 [US3] [Plan:3.3] Build issue search, details, edit, and review/update dialogs in `frontend/src/features/jira/IssueSearchPage.jsx`, `IssueDetailsPage.jsx`, and `ReviewIssueUpdateDialog.jsx`.

#### US4 — Confluence search and page create/update

- [ ] T024 [US4] [Plan:3.4] Write failing tests for accessible space/page search, 25-result pagination, safe markup preview, explicit publish, conflicts, uncertain outcomes, and absence of delete controls in `backend/tests/` and `frontend/tests/e2e/`.
- [ ] T025 [US4] [Plan:3.4] Implement accessible space/page search with 25-result pagination, REQ-015 search operation records, and page create/update provider services in `backend/src/integrations/atlassian/confluence/pages.js`.
- [ ] T026 [US4] [Plan:3.4] Add page routes, server-side content validation, safe preview encoding, immediate publish confirmation, and stale revision conflict handling in `backend/src/routes/confluence-pages.js`.
- [ ] T027 [US4] [Plan:3.4] Build space/page search, editor, preview, and explicit publish confirmation screens in `frontend/src/features/confluence/`.

#### US5 — Private operation history, audit, and retention

- [ ] T028 [US5] [Plan:3.5] Write failing tests for requester-only history visibility, status lifecycle, uncertain-result review, one-year expiry, backup/restore expiry, and purge-within-24-hours behavior in `backend/tests/`.
- [ ] T029 [US5] [Plan:3.5] Implement requester-scoped operation list/detail routes and prevent cross-user history access in `backend/src/routes/operations.js`.
- [ ] T030 [US5] [Plan:3.5] Implement the operation history UI and uncertain-result verification state in `frontend/src/features/operations/OperationHistoryPage.jsx`.
- [ ] T031 [US5] [Plan:3.5] Implement 365-day expiry selection and purge job with audit logging under `backend/src/jobs/`; ensure admin routes cannot read personal tokens or operation history.

### Phase 4: Integration and Testing

- [ ] T032 [Plan:4.1] Run backend API/provider integration suites against PostgreSQL 15 and deterministic Jira/Confluence test responses; verify all request, validation, permission, and pagination contracts.
- [ ] T033 [Plan:4.2] Test database-unavailable-before-write, provider-success/local-status-failure, uncertain-write reconciliation, rate limiting, bounded read retries, and duplicate-submit scenarios in `backend/tests/integration/`.
- [ ] T034 [Plan:4.2] Verify OAuth token protection/redaction, authentication/session enforcement, access control, content safety, no unintended write paths, and error information disclosure in `backend/tests/security/`.
- [ ] T035 [Plan:4.3] Add and run Playwright journeys for SSO/connection, issue creation, Jira search/update, Confluence search/publish, and private history in `frontend/tests/e2e/`.
- [ ] T036 [Plan:4.3] Measure local validation/request feedback against the 2-second REQ-028 target with remote completion time separate; execute the 100-search performance sample and 20-user issue-creation/usability tests, recording outcomes against REQ-029/030 and SC-002/003/007.
- [ ] T037 [Plan:4.3] Complete WCAG 2.2 AA automated, keyboard, and screen-reader review across all five journeys; resolve findings and save the verification results with the release evidence.
- [ ] T038 [Plan:4.4] Verify 365-day deletion within 24 hours across application data and recoverable backups/replicas, including restore behavior, in `backend/tests/retention/`.
- [ ] T039 [Plan:4.4] Test clean and upgrade database migrations, document internal deployment/recovery ownership and configuration, and validate fresh Docker-based local startup in `README.md` and `backend/README.md`.
- [ ] T040 [Plan:4.4] Complete the M4 release gate: all story and non-functional acceptance results pass, secrets/configuration are reviewed, supported runtime/dependency/browser versions are pinned, and no unresolved release-blocking operational input remains.

## Project Structure

```text
Jira_Automation/
├── compose.yaml
├── README.md
├── backend/
│   ├── package.json
│   ├── migrations/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── auth/
│   │   ├── config/
│   │   ├── errors/
│   │   ├── integrations/atlassian/
│   │   │   ├── jira/
│   │   │   └── confluence/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── observability/
│   │   ├── routes/
│   │   ├── services/
│   │   └── validation/
│   ├── tests/
│   │   ├── integration/
│   │   ├── security/
│   │   └── retention/
│   └── README.md
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── app/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── components/
│   │   └── features/
│   │       ├── auth/
│   │       ├── connections/
│   │       ├── confluence/
│   │       ├── jira/
│   │       └── operations/
│   └── tests/e2e/
└── spec/
    ├── constitution.md
    ├── specification.md
    ├── clarify.md
    ├── plan.md
    └── checkpoints/
        ├── spec-to-plan.yaml
        └── plan-to-tasks.yaml
```

## Testing Strategy

- **appType**: SPA with JSON API and external SaaS integrations.
- **Critical user journeys**:
  1. Company SSO sign-in and per-user Jira/Confluence OAuth authorization.
  2. Create a Jira issue after project/field validation, review, and confirmation.
  3. Search and update one accessible Jira issue with review and conflict handling.
  4. Search, preview, and explicitly publish a Confluence page create/update.
  5. Review private operation history and resolve an uncertain write safely.
- **primaryValidationStack**: Node test runner + Supertest, Vitest + Testing Library,
  PostgreSQL 15 through Docker Compose, deterministic Atlassian provider test doubles,
  and Playwright browser acceptance tests.
- **fallbackMatrix**:
  - `infra-tier`: PostgreSQL 15 in Docker Compose → no in-memory substitute for final
    acceptance. If Docker is unavailable locally, run the same suite against an
    approved PostgreSQL 15 test service and record that deviation. Prerequisite:
    Docker or approved PostgreSQL 15 endpoint.
  - `provider-tier`: Atlassian Cloud test tenant → deterministic HTTP provider stubs
    for failure/edge coverage. Stubs do not replace at least one authorized real-tenant
    smoke test before release. Prerequisite: approved Atlassian test site and OAuth
    client for smoke test.
  - `browser-tier`: Playwright in supported browser → documented manual keyboard and
    screen-reader checks if browser automation is unavailable. Manual checks do not
    replace the release accessibility review. Prerequisite: Node.js and browser
    binaries.
- **Environment requirements**: Approved Node.js LTS version; Docker; PostgreSQL 15;
  company SSO test tenant/configuration; Atlassian Cloud test sites and OAuth client;
  encrypted server-side secret storage for non-production; supported browsers and
  screen reader for accessibility verification.
- **knownGaps**: Provider stubs cannot prove Atlassian OAuth/site permissions; local
  success without company SSO configuration cannot certify production identity;
  manual accessibility checks are less reproducible than automated browser checks;
  backup retention/deletion requires deployment-level evidence beyond database tests.
- **Test data strategy**: Dedicated non-production Jira/Confluence project and space;
  seeded disposable records with unique run IDs; isolated user identities; never use
  production content or credentials. Clean up only records created by the test run;
  because delete operations are out of scope for the product, use a designated test
  tenant reset/cleanup procedure outside product APIs.
- **Acceptance criteria**: All story scenarios pass; exact requirement thresholds
  REQ-028–031 and SC-001–010 are measured; OAuth secrets are absent from responses and
  logs; pending records precede all writes; no uncertain write is automatically
  repeated; every write requires confirmation; 365-day records are purged within 24
  hours and remain deleted after restore; all five journeys meet WCAG 2.2 AA.
- **Validation review expectations**: Reviewer confirms requirement-to-test
  traceability, exact test cohort/sample sizes, real Atlassian smoke-test evidence,
  PostgreSQL 15 execution, token and log redaction, private history access, safe
  preview behavior, uncertainty reconciliation, deletion/restore evidence, and
  approved SSO/OAuth deployment inputs.

## Dependencies and Execution Order

1. Phase 1 backend foundation and Phase 2 frontend shell may proceed in parallel after
   repository/runtime conventions are agreed; Phase 3 depends on both milestone gates.
2. Within Phase 1, database migrations and API skeleton follow backend scaffolding;
   feature APIs depend on the shared error, validation, logging, and persistence
   foundations.
3. Within Phase 2, shared accessible controls and API client precede feature screens.
4. Phase 3 proceeds sequentially: US1 auth/connections → US2 Jira create → US3 Jira
   search/update → US4 Confluence → US5 operation history/retention. US2–US5 depend
   on US1 identity and provider authorization.
5. Phase 4 depends on all five story increments. Release deployment is blocked until
   organization-specific SSO/OAuth, retention, recovery, and operational-owner inputs
   are approved.

## Requirement Mapping

| REQ ID | Description | Plan Items | Implementation Evidence |
|--------|-------------|------------|------------------------|
| REQ-001 | Per-user Jira/Confluence Cloud connections; admin config | 3.1 | `backend/src/integrations/atlassian/`, `frontend/src/features/connections/` |
| REQ-002 | Company SSO authentication | 2.2, 3.1 | `backend/src/auth/`, `frontend/src/auth/` |
| REQ-003 | Per-user OAuth 3LO, no shared account/API tokens | 3.1, 4.2 | `backend/src/integrations/atlassian/`, `backend/tests/security/` |
| REQ-004 | Provider permission-filtered resources | 3.1, 3.3, 3.4, 4.1 | Atlassian integration services and provider access tests |
| REQ-005 | Paginated Jira key/text search | 3.3 | `backend/src/routes/jira-issues.js`, Jira search tests |
| REQ-006 | Confirmed Jira target and field review | 2.3, 3.2, 3.3, 4.3 | `CreateIssuePage.jsx`, `ReviewIssueDialog.jsx`, `ReviewIssueUpdateDialog.jsx` |
| REQ-007 | Supported-field Jira issue creation | 3.2, 4.1, 4.3 | `jira/issues.js`, `CreateIssuePage.jsx`, issue creation tests |
| REQ-008 | Confirmed single-issue supported-field update | 3.3, 4.1 | `jira/issues.js`, `ReviewIssueUpdateDialog.jsx`, update tests |
| REQ-009 | Exclude Jira delete/bulk/status transitions | 3.3, 4.2 | Jira route allowlist and negative capability tests |
| REQ-010 | Paginated Confluence page search | 3.4, 4.1 | `confluence/pages.js`, `confluence-pages.js` |
| REQ-011 | Confirmed immediate Confluence page creation | 3.4, 4.1, 4.3 | `confluence/pages.js`, `ReviewPublishDialog.jsx`, E2E tests |
| REQ-012 | Confirmed immediate Confluence page update | 3.4, 4.1, 4.3 | `confluence/pages.js`, `ReviewPublishDialog.jsx`, conflict tests |
| REQ-013 | Exclude Confluence page deletion | 3.4, 4.2 | Confluence route allowlist and negative capability tests |
| REQ-014 | Server-side input validation | 1.3, 3.2, 3.3, 3.4, 4.1 | `backend/src/validation/`, route and validation tests |
| REQ-015 | Search/write history; durable pending record; deduplication | 1.2, 3.2, 3.3, 3.4, 3.5, 4.1–4.2 | Operation migrations/service and operation integration tests |
| REQ-016 | Distinct pending/completed/failed/uncertain status | 1.2, 3.2–3.5, 4.1–4.2 | Operation service, history UI, lifecycle tests |
| REQ-017 | Private requester history/admin boundaries | 1.2, 3.5, 4.2 | `backend/src/routes/operations.js`, authorization tests |
| REQ-018 | Respect rate limits; bounded reads; no automatic uncertain-write retry | 3.2–3.4, 4.2 | Atlassian request wrapper and retry/failure tests |
| REQ-019 | Safe rendering/preview of untrusted content | 2.3, 3.4, 4.2 | Shared preview components, Confluence preview tests |
| REQ-020 | User disconnect stops use/removes or revokes credentials | 3.1, 4.2 | Connection service/routes and disconnect tests |
| REQ-021 | User reviews own history and unresolved operations | 3.5, 4.3 | `OperationHistoryPage.jsx`, E2E history journey |
| REQ-022 | 365-day retention and deletion within 24h incl backups | 1.2, 3.5, 4.4 | Expiry migration, purge job, retention and restore tests |
| REQ-023 | WCAG 2.2 AA | 2.1–2.3, 4.3 | Accessible shell/components and accessibility evidence |
| REQ-024 | One internally hosted organization; Atlassian Cloud | 1.1, 4.4 | Runtime/deployment config and deployment documentation |
| REQ-025 | Externalized configuration and admin-managed SSO/OAuth setup | 1.1, 3.1, 4.4 | Env validation, auth configuration, setup documentation |
| REQ-026 | PostgreSQL 15 with reviewable migrations | 1.2, 4.1, 4.4 | `compose.yaml`, `backend/migrations/`, migration tests |
| REQ-027 | Transactional local consistency/reconciliation after remote success | 1.2, 3.2, 3.5, 4.1–4.2 | Operation persistence and reconciliation tests |
| REQ-028 | Local feedback within 2s, remote latency distinct | 1.3, 3.2–3.5, 4.3 | API/UI status handling and timing acceptance tests |
| REQ-029 | 95/100 searches within 5s under provider latency condition | 3.3–3.4, 4.3 | Search UI/API and 100-search performance test |
| REQ-030 | 19/20 users create issue unaided | 3.2, 4.3 | Issue creation journey and 20-user usability evidence |
| REQ-031 | Tests for critical journeys/security/provider failures/PostgreSQL | 1.4, 3.1–3.5, 4.1–4.4 | Backend/frontend test suites and release test evidence |
| REQ-032 | Diagnostic context excludes credentials/unnecessary content | 1.3–1.4, 3.5, 4.2 | Redacted logger, audit model, security tests |
| REQ-033 | Frontend uses backend; no provider secrets in browser | 2.2, 3.1, 4.2 | API client, route enforcement, browser security tests |
| REQ-034 | React 18/Vite, Node/Express, PostgreSQL 15/Docker | 1.1–1.2, 2.1, 4.4 | Package manifests, runtime pins, `compose.yaml`, setup test |
| REQ-035 | Encrypted server-side OAuth tokens and lifecycle | 3.1, 4.2 | Atlassian token store, refresh/revoke and redaction tests |

## Complexity Tracking

No constitution violations or unnecessary architecture layers are proposed. The
provider integration adapter, durable operation service, and history/audit storage
are required by user-permission boundaries, remote-write recovery, and retention
requirements; they are not optional abstraction layers.
