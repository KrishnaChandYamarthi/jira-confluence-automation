# Feature Specification: Jira and Confluence Automation Workspace

> Governed by: `./constitution.md`

**Feature Branch**: `001-jira-confluence-automation`  
**Created**: 2026-10-06  
**Status**: Draft — core product decisions recorded; technical details remain for planning  
**Input**: User request and follow-up decisions: a Jira/Confluence automation application
using React 18 with Vite, Node.js with Express, and PostgreSQL 15 via Docker. The
project README describes automating Jira workflows and tasks; the MVP workflow and
boundaries below reflect the user's subsequent selections.

## Scope Baseline *(mandatory)*

- **Discovery method**: Reviewed `README.md`, `spec/constitution.md`, and the available
  project file listing.
- **Total items discovered**: 1 project-level product description; no implemented
  feature inventory was present in the repository.
- **Items in scope**: 1 single-organization, internally hosted workspace for company
  SSO users to authorize per-user Atlassian Cloud access, create reviewed Jira issues,
  search and update individual Jira issues, search and create/update Confluence pages,
  and review their own operation history.
- **Scope rationale**: Reviewed Jira issue creation is the primary MVP workflow.
  Individual Jira issue search/update and Confluence page search/create/update are
  also in scope. Deletes, bulk operations, status transitions, scheduled triggers,
  and unattended automation are excluded.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in and authorize Atlassian access (Priority: P1)

As an organization team member, I want to sign in with company SSO and authorize my
own Atlassian Cloud account so that the workspace can act only with my existing
Jira/Confluence permissions.

**Why this priority**: Integration access is a prerequisite for every other user
journey and must be established without exposing credentials or exceeding the user's
permissions.

**Independent Test**: Sign in using the configured company SSO test identity, complete
per-user Atlassian OAuth authorization, validate Jira and Confluence independently,
and verify invalid, revoked, and unavailable states.

**Acceptance Scenarios**:

1. **Given** an organization user has passed company SSO and authorized their
   Atlassian Cloud account, **When** they validate the connection, **Then** Jira and
   Confluence are each shown as connected or unavailable according to their own
   authorization and reachability.
2. **Given** OAuth authorization is denied, expired, or revoked, **When** the user
   accesses a provider feature, **Then** the app reports that authorization is
   unavailable and offers reauthorization without exposing tokens.
3. **Given** the user's Atlassian account cannot access a project or space, **When**
   the app lists or searches resources, **Then** those inaccessible resources are
   not returned.
4. **Given** a user disconnects their Atlassian authorization, **When** the
   disconnection completes, **Then** the application stops using and removes or
   revokes the user's stored authorization material.

### User Story 2 - Create a Jira issue from a reviewed form (Priority: P1)

As an authorized team member, I want to submit a reviewed Jira issue form so that a
routine work item can be created in the correct project with the right details.

**Why this priority**: The user selected reviewed issue creation as the primary MVP
workflow. Preview and confirmation ensure the automation creates only the intended
issue.

**Independent Test**: Select an accessible Jira project, complete the supported fields,
review the proposed issue, confirm once, and verify the created Jira issue or
accurate failure/uncertain outcome.

**Acceptance Scenarios**:

1. **Given** a connected user can create issues in a Jira project, **When** they
   select the project and enter required supported fields, **Then** the form identifies
   missing or invalid values before submission.
2. **Given** the form is valid, **When** the user reviews the project, issue type,
   summary, description, priority, assignee, and other project-required values,
   **Then** the app presents a confirmation step that clearly identifies the proposed
   issue.
3. **Given** the user explicitly confirms issue creation, **When** Jira confirms
   creation, **Then** exactly one issue is recorded as completed and its Jira key is
   shown.
4. **Given** creation is rejected, unauthorized, or has an uncertain provider
   outcome, **When** the result is shown, **Then** the app does not claim success and
   tells the user how to verify an uncertain issue before any retry.

### User Story 3 - Find and update Jira issues (Priority: P2)

As an authorized team member, I want to find a Jira issue and update supported fields
after reviewing the proposed change so that I can correct routine issue details.

**Why this priority**: Individual issue maintenance complements the primary create
workflow while keeping changes scoped to one issue and the user's own permissions.

**Independent Test**: Search for an accessible test issue, change a supported field,
review and confirm, then verify the provider state and error handling.

**Acceptance Scenarios**:

1. **Given** the user can access a Jira project, **When** they search by issue key or
   text within an optional project scope, **Then** only accessible matches are shown
   with identifying summary details.
2. **Given** an issue is selected, **When** the user edits summary, description,
   issue type, priority, assignee, or a project-required field, **Then** the app
   displays the target and proposed field values before confirmation.
3. **Given** the user confirms the update, **When** Jira confirms it, **Then** the
   app reports completion; Jira status transitions and issue deletion are unavailable.
4. **Given** the update conflicts with a newer issue revision or permission has
   changed, **When** Jira rejects it, **Then** the app reports the conflict or access
   failure and does not overwrite the newer value.

### User Story 4 - Find and manage Confluence pages (Priority: P2)

As an authorized team member, I want to find Confluence pages and create or update a
page after reviewing the content so that routine documentation work can be automated
without unintended publication.

**Why this priority**: Confluence operations complement Jira workflows and provide
reviewed documentation updates, with publication only after explicit confirmation.

**Independent Test**: Search an accessible test space, preview and confirm a page
create/update, verify its published content in Confluence, and exercise provider
failure and conflict cases.

**Acceptance Scenarios**:

1. **Given** a connected user can access a Confluence space, **When** they search for
   a page, **Then** only pages accessible to that account are returned.
2. **Given** the user has entered or edited page content, **When** they review its
   title, destination, content, and publication effect and explicitly confirm,
   **Then** the workspace publishes only the selected page create/update.
3. **Given** a page operation fails, conflicts with a newer revision, or has an
   uncertain outcome, **When** the application reports the result, **Then** it does
   not claim the content was saved and provides an appropriate correction or
   verification path before retry.

### User Story 5 - Review my operation outcomes (Priority: P2)

As a user, I want to see the status and history of my operations so that I can
confirm what changed and understand failures.

**Why this priority**: A reliable automation tool must make side effects and outcomes
visible, especially when a remote service times out or returns an ambiguous response.

**Independent Test**: Perform successful, failed, and uncertain operations and verify
their distinct status, privacy boundaries, and one-year retention policy.

**Acceptance Scenarios**:

1. **Given** an operation has been requested, **When** its state changes, **Then** the
   workspace identifies it as pending, completed, failed, or uncertain.
2. **Given** a completed operation, **When** the initiating user reviews their
   history, **Then** they can identify the target, action, time, and outcome without
   seeing credentials or unnecessary page/issue content.
3. **Given** an operation was denied or failed, **When** the user reviews the result,
   **Then** the workspace distinguishes permission, validation, connectivity, and
   provider errors when that distinction is known.

### Edge Cases

- Jira and Confluence may be independently unavailable or unauthorized; each
  connection and operation MUST have an independent status.
- A search returns no matches, has additional pages, or returns a record deleted or
  made inaccessible before the user acts; the user MUST see an empty, paginated, or
  stale-record state rather than a false success.
- A provider times out after accepting a write; the operation MUST remain uncertain,
  MUST NOT be retried automatically, and MUST require remote verification before a
  user-authorized retry.
- The provider rate-limits a request; the application MUST respect `Retry-After`,
  avoid uncontrolled retries, and report prolonged unavailability.
- A user's permission changes between search and submission; the provider rejection
  MUST be represented as denied and MUST NOT be shown as successful.
- A double-click, refresh, or duplicate request repeats a create; the application
  MUST deduplicate a repeated submission where possible and otherwise expose its
  pending/uncertain state before allowing another attempt.
- User-supplied or provider-returned markup contains script-like content; previews and
  rendered views MUST display it safely without executing it.
- Required Jira fields are missing, a destination is invalid, or an issue/page was
  modified since it was loaded; the user MUST receive a validation or conflict state
  and the newer remote content MUST NOT be silently overwritten.
- PostgreSQL is unavailable before a write; the application MUST NOT call Jira or
  Confluence unless it has first durably recorded a pending operation.
- PostgreSQL becomes unavailable after the provider accepts a write; the durable
  pending operation MUST remain visible as pending/uncertain until remote verification
  and local reconciliation are completed.
- OAuth is expired, revoked, or rejected; the app MUST stop provider calls using that
  authorization and require the user to reauthorize.

## Requirements *(mandatory)*

### Functional Requirements

- **REQ-001**: The system MUST allow an authorized user to configure Jira and
  Confluence Cloud connections independently by authorizing their own Atlassian
  identity; designated administrators manage the organization-approved OAuth client
  and site configuration.
- **REQ-002**: The system MUST authenticate application users through company SSO and
  MUST require an authenticated organization account before access to application
  features.
- **REQ-003**: The system MUST use per-user Atlassian OAuth 3LO for provider
  authorization; it MUST NOT accept pasted API tokens or use a shared provider
  service account.
- **REQ-004**: The system MUST retrieve and display only Jira projects, Confluence
  spaces, issues, and pages that the authenticated user's Atlassian identity is
  permitted to access.
- **REQ-005**: The system MUST let a user search accessible Jira issues by issue key
  or text, optionally scoped to a selected accessible project, and MUST provide
  paginated results.
- **REQ-006**: Before issue creation, the system MUST show the Jira site, selected
  project, issue type, summary, description, priority, assignee, and other supported
  required values. Before issue update, it MUST additionally identify the existing
  issue by site, project, issue key, and summary and show the proposed field values.
- **REQ-007**: The system MUST let an authorized user create a Jira issue in a
  selected accessible project using project-required fields supported by the MVP form
  plus summary, description, issue type, priority, and assignee, after review and
  explicit confirmation. If a required field cannot be represented by the form, the
  system MUST explain that the project is not currently supported and MUST NOT submit
  a partial issue.
- **REQ-008**: The system MUST let an authorized user update one selected Jira issue's
  summary, description, issue type, priority, assignee, or a project-required field
  only after displaying the target and proposed values and receiving explicit
  confirmation.
- **REQ-009**: The system MUST NOT support Jira issue deletion, bulk issue operations,
  or Jira workflow status transitions in this MVP.
- **REQ-010**: The system MUST let a user search accessible Confluence pages by text
  within a selected accessible space and MUST provide paginated results.
- **REQ-011**: The system MUST let an authorized user create a Confluence page in a
  selected accessible space after review and explicit confirmation; the confirmed
  page MUST be published immediately.
- **REQ-012**: The system MUST let an authorized user update one selected Confluence
  page after displaying the target and proposed content and receiving explicit
  confirmation; the confirmed update MUST be published immediately.
- **REQ-013**: The system MUST NOT support Confluence page deletion in this MVP.
- **REQ-014**: The system MUST validate submitted values on the server and return
  actionable validation errors without executing an invalid operation.
- **REQ-015**: The system MUST record each user-requested Jira/Confluence search or
  write with the requesting user, provider, target or destination when known, action,
  timestamp, and outcome, without storing unnecessary provider content. Before any
  write, it MUST durably persist a pending operation record including the proposed
  change summary and a unique request identifier; repeated submissions with the same
  identifier MUST return the existing operation rather than issue a second provider
  write. A request identifier MUST be unique per authenticated user across all
  operation types; reusing it with a different action or payload MUST be rejected
  without contacting the provider. If the pending record cannot be persisted, the
  provider write MUST NOT be sent.
- **REQ-016**: The system MUST distinguish pending, completed, failed, and uncertain
  operation outcomes; it MUST report success only when the provider success has been
  confirmed and the local operation record has been updated accordingly.
- **REQ-017**: The system MUST display operation history to the initiating user only.
  Designated administrators MUST manage approved provider-connection configuration
  but MUST NOT impersonate users or access their personal OAuth credentials.
- **REQ-018**: The system MUST respect provider rate limits and `Retry-After` guidance.
  Automatic retries for read requests MUST be bounded to no more than three attempts
  per request. The system MUST NOT automatically retry an uncertain write; it MUST
  require the user to verify the provider state and explicitly confirm any retry.
- **REQ-019**: The system MUST safely render or preview text and markup retrieved from
  Jira, Confluence, or user input without executing untrusted content.
- **REQ-020**: The system MUST let a user disconnect their personal Atlassian
  authorization and MUST stop provider calls and remove or revoke associated stored
  authorization material after disconnection.
- **REQ-021**: The system MUST let an authorized user review the result and history
  of their own operations, including pending and uncertain records requiring
  verification.
- **REQ-022**: The system MUST retain operation history and security audit records
  for 365 days from creation and permanently delete them within 24 hours of expiry
  from application stores, logs, backups, and replicas; backup and recovery processes
  MUST NOT restore records past their expiry.
- **REQ-023**: The system MUST be accessible in accordance with WCAG 2.2 AA for
  supported user journeys.
- **REQ-024**: The MVP MUST support one internally hosted organization deployment,
  with Atlassian Cloud Jira and Confluence; multi-organization tenancy is out of scope.

### Non-Functional Requirements

- **REQ-025**: The system MUST externalize runtime configuration and MUST provide
  documented setup instructions without requiring live credentials to be committed
  to the repository. Company SSO and Atlassian OAuth client configuration MUST be
  managed by designated administrators.
- **REQ-026**: The system MUST persist application data in PostgreSQL 15; data
  definitions and schema changes MUST be reviewable and migration-managed.
- **REQ-027**: The system MUST preserve data integrity for each user-requested
  operation and MUST use transactional persistence for related local records. If a
  provider write succeeds but the final local status update fails, the durable
  pending record MUST remain available for reconciliation and MUST NOT be marked
  completed without verification.
- **REQ-028**: The system MUST provide user-visible operation feedback within 2
  seconds for local validation and request acceptance under normal service conditions;
  remote completion time MUST be represented separately when dependent on Jira or
  Confluence.
- **REQ-029**: In acceptance testing of 100 searches over accessible test data, at
  least 95% MUST display the first results within 5 seconds when the provider returns
  its response within 2 seconds and is available.
- **REQ-030**: At least 19 of 20 representative first-time users MUST complete
  reviewed Jira issue creation correctly without assistance during acceptance testing.
- **REQ-031**: Automated tests MUST cover primary user journeys, server-side input
  validation, permission-denied outcomes, remote failures, and uncertain/retry
  behavior. PostgreSQL-dependent behavior MUST be verified against PostgreSQL 15.
- **REQ-032**: The system MUST retain diagnostic context sufficient to investigate
  failed operations while excluding credentials and avoiding unnecessary capture of
  Jira/Confluence content.
- **REQ-033**: The frontend MUST interact with Jira and Confluence through the
  application backend; integration credentials and privileged provider calls MUST
  never be exposed to the browser.
- **REQ-034**: The target implementation MUST use React 18 and Vite for the frontend,
  Node.js and Express for the backend, and PostgreSQL 15 run through Docker for the
  database environment, as required by the project constitution.
- **REQ-035**: Atlassian OAuth access and refresh tokens MUST be protected in
  server-side storage using encryption at rest and MUST NOT be returned to the
  browser or written to logs. Token refresh, expiry, and revocation MUST stop
  unauthorized provider calls and require reauthorization where needed.

### Key Entities *(include if data involved)*

- **User**: An organization member authenticated through company SSO and linked to
  their own Atlassian identity; the user can view their own operation history.
- **Administrator**: A designated organization role responsible for approved
  Atlassian OAuth client/site configuration, without access to personal OAuth tokens
  or other users' operation history.
- **Service Connection**: A per-user Jira or Confluence Cloud authorization obtained
  using Atlassian OAuth 3LO and handled only by the backend.
- **Project or Space**: A Jira project or Confluence space visible to the connected
  user and usable as the scope or destination for supported operations.
- **Issue**: A Jira work item identified by its project and issue identifier, with
  summary fields and supported editable attributes.
- **Page**: A Confluence document identified by its space and page identity, with
  title, content, and revision information.
- **Automation Operation**: A user-requested search, create, or update action,
  including its target, proposed action summary, lifecycle status, timestamps, and
  outcome; write operations are durably recorded as pending before provider calls.
- **Audit Event**: A minimal security-relevant or externally visible action record
  identifying the actor, time, action category, and result, excluding credentials and
  unnecessary provider content; retained for one year.

## Assumptions

- The MVP's primary workflow is user-initiated Jira issue creation from a reviewed
  form. It also includes individual Jira issue search/update and Confluence page
  search/create/update; it does not run scheduled, triggered, bulk, or unattended
  automation.
- Company SSO authenticates users to the application. Each user separately authorizes
  their own Atlassian Cloud identity with OAuth 3LO; provider access is never elevated
  beyond that user's Atlassian permissions.
- Designated administrators manage the organization's approved Atlassian OAuth
  integration and site configuration. Users authorize and disconnect their own
  personal provider accounts. Administrators cannot impersonate users or access
  personal OAuth tokens. By default, administrators do not see individual operation
  histories.
- A deployment serves one organization. The organization selects the SSO provider
  and internal hosting environment during technical planning; multi-organization
  tenancy is not required.
- Supported Jira issue fields are project-required fields representable by the MVP
  form plus summary, description, issue type, priority, and assignee. Updates use the
  same field set; workflow status transitions are excluded. Projects requiring an
  unsupported field type cannot be used for issue creation until their configuration
  changes or the app adds support for that field type.
- Confluence page creates and updates publish immediately after the user explicitly
  confirms the reviewed target, destination, title, and content.
- No Jira issue or Confluence page deletion is supported. Bulk write operations and
  workflow rule builders are out of scope.
- Search uses Atlassian Cloud's accessible, provider-native text/key search, returns
  25 results per page, and allows the user to request subsequent pages. Results are
  limited to the selected project or space when one is specified; cross-site
  aggregation and custom query languages are out of scope.
- An operation timeout after a write is submitted is uncertain. The application does
  not retry automatically; the initiating user must verify remote state before
  explicitly retrying.
- A durable local pending operation record is required before each external write.
  If PostgreSQL cannot persist it, the write is not sent. If a provider accepts a
  write but the local final status update fails, the record remains pending/uncertain
  until reconciliation verifies provider state.
- Operation history and security audit records expire 365 days after creation and are
  permanently deleted within 24 hours, including from backups and replicas; recovery
  MUST NOT reintroduce expired records.
- The user population already has company SSO and Atlassian Cloud accounts; the app
  does not provision accounts.
- Confluence content is limited to content formats supported by the selected
  Atlassian Cloud page editor; implementation planning must document preview
  limitations and safe treatment of unsupported markup.
- The constitution specifies the implementation stack. These technology constraints
  do not change the user-visible outcomes specified above.

## Constitution Alignment

| Constitution principle | Requirements and scenarios that enforce it |
|------------------------|---------------------------------------------|
| I. Secure Integration by Default | REQ-002–004, REQ-014, REQ-019–020, REQ-032–033, REQ-035; User Story 1 |
| II. Safe, User-Controlled Automation | REQ-006–013, REQ-015–016, REQ-018, REQ-023; User Stories 2–4 |
| III. Explicit Contracts and Durable Data | REQ-014–017, REQ-022, REQ-026–027; Edge Cases |
| IV. Test Observable Behavior | Acceptance scenarios; REQ-028–031; SC-001–008 |
| V. Operable, Understandable Design | REQ-015–018, REQ-021–022, REQ-028, REQ-032; User Story 5 |

## Planning Details

- Company SSO provider, protocol, session duration, and user deprovisioning behavior
  must be supplied by the organization before technical design is finalized.
- The Atlassian OAuth 3LO client, minimum required OAuth scopes, site allowlist, and
  supported number of Jira/Confluence Cloud sites must be confirmed during planning.
- OAuth access/refresh token protection, renewal, revocation, disconnect cleanup, and
  key management must be designed and documented; tokens must never reach the browser
  or application logs.
- Administrators manage integration configuration only. Appointment of administrators
  and whether a separate security/audit role may review cross-user events require
  organization policy confirmation; absent explicit approval, operation history is
  private to its initiating user.
- Search result ordering follows provider-native relevance for text queries and exact
  matching for issue keys; the UI must make empty results, pagination, and stale
  records clear. If provider-native ordering differs, planning documents the behavior.
- Jira required-field discovery and project-specific validation must reflect current
  project configuration. Custom fields outside the supported form controls are not
  editable in the MVP; a project with an unsupported mandatory custom field cannot be
  used to create an issue until reconfigured or the app supports that field type.
- Confluence page destination includes the selected space and an optional parent page.
  The preview must identify title, destination, and publish effect; supported content
  formats and preview fidelity must be verified against Atlassian Cloud.
- If a provider write may have succeeded but the final local status update fails, the
  initiating user is shown a pending/uncertain operation. The application verifies
  provider state before permitting a retry and does not infer completion from a
  timeout alone.
- The 365-day deletion policy applies to operation and audit records in application
  stores, logs, backups, and replicas. Planning must define and test purge timing and
  confirm expired records are not retained or restored past the 365-day period.
- Acceptance performance testing uses 100 searches against an agreed representative
  test dataset and records provider response time separately from application
  processing/presentation time.
- Usability testing uses 20 first-time representative users performing the reviewed
  Jira issue-creation journey; at least 19 must complete it correctly without
  assistance.
- The application targets WCAG 2.2 AA across all five user journeys. Supported
  browser versions and assistive technology combinations must be set in the
  implementation plan.
- Fresh local setup is successful when a developer can start the documented
  application services, initialize the PostgreSQL 15 database, and complete a
  non-production health check without committing or supplying production secrets.
- Exact Node.js, Express, Vite, package manager, backup/recovery, availability,
  migration rollback, and support-owner details are implementation-plan decisions;
  they must not weaken requirements in this specification or constitution.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of invalid, expired, or revoked Atlassian authorizations are shown
  as disconnected or requiring reauthorization; none are shown as connected.
- **SC-002**: At least 95% of searches display their first results within 5 seconds
  when the provider returns within 2 seconds, measured over 100 representative
  searches.
- **SC-003**: At least 19 of 20 representative first-time users create the intended
  Jira issue correctly without assistance.
- **SC-004**: 100% of tested Jira and Confluence create/update operations show the
  correct target or destination and proposed change before explicit confirmation.
- **SC-005**: 100% of tested unauthorized, rejected, or uncertain provider operations
  are not reported as confirmed success.
- **SC-006**: 100% of security tests verify that Atlassian OAuth credentials are
  absent from browser-visible responses and application logs.
- **SC-007**: At least 19 of 20 usability-test participants can correctly determine
  whether their latest operation succeeded, failed, or requires verification without
  consulting an operator.
- **SC-008**: 100% of sampled operation and audit records are permanently deleted
  within 24 hours after 365 days of retention, including in recoverable backups and
  replicas.
- **SC-009**: All five specified user journeys pass the agreed WCAG 2.2 AA
  accessibility evaluation before release.
- **SC-010**: A developer can complete the documented fresh local setup and run a
  non-production health check without production credentials.
