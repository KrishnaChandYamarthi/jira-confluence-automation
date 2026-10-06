<!--
Sync Impact Report
- Version change: none -> 1.0.0 (initial constitution)
- Modified principles: none; established five initial principles
- Added sections: Migration Mode, Target Technology Stack, Additional Constraints,
  Development Workflow, Governance
- Removed sections: none
- Templates requiring updates:
  - skills/creating-implementation-plan/templates/plan-template.md — ✅ reviewed; its
    Constitution Check accommodates project-specific principles
  - skills/feature-inventory/templates/spec-template.md — ✅ reviewed; no new mandatory
    specification sections are required
  - skills/creating-implementation-plan/templates/tasks-template.md — ✅ reviewed; task
    categories can represent the required security, testing, and operations work
- Follow-up TODO: Confirm the original ratification date.
-->
# Jira/Confluence Automation Constitution

## Migration Mode

**Mode**: REWRITE

**Justification**: The current project documentation describes automation scripts and
data but no web application architecture. The requested React, Express, and PostgreSQL
stack establishes a new application structure. Existing Jira and Confluence workflows
remain behavioral requirements and must be preserved or explicitly changed by an
approved specification.

## Core Principles

### I. Secure Integration by Default

All Jira and Confluence access MUST use credentials with the minimum permissions needed
for the requested operation. Secrets MUST NOT be committed, returned to the browser, or
written to logs. The backend MUST validate and authorize requests, validate external
API data, and safely encode rendered content. These rules protect connected workspaces
and prevent untrusted project content from becoming an execution or disclosure risk.

### II. Safe, User-Controlled Automation

Automation MUST make its intended Jira or Confluence changes clear to the user and
MUST NOT perform destructive or externally visible actions without explicit user
authorization. Operations that may be retried MUST be idempotent where practical;
otherwise, the system MUST detect and report duplicate or uncertain outcomes before
retrying. Integration retries MUST be bounded, respect provider rate limits and
`Retry-After` guidance, and surface failures rather than silently reporting success.
This minimizes unintended changes and makes recovery understandable.

### III. Explicit Contracts and Durable Data

Frontend-to-backend interfaces MUST define request, response, and error shapes. The
Express backend MUST validate inputs independently of frontend validation. PostgreSQL
schema changes MUST be versioned and applied through repeatable, reviewable migrations;
constraints and transactions MUST protect data invariants. Credentials and data not
needed for the automation's stated purpose MUST NOT be persisted. Explicit contracts
and database invariants reduce integration drift and prevent inconsistent records.

### IV. Test Observable Behavior

Every feature MUST have acceptance criteria derived from a reviewed specification.
Automated tests MUST cover critical user behavior, authorization and validation
boundaries, and failure handling for external Jira/Confluence calls. Database behavior
that depends on PostgreSQL MUST be tested against PostgreSQL 15, including the
Docker-provided development/test database where practical. Changes MUST pass relevant
automated checks before merge; manual checks MUST be documented when automation is
not feasible. This makes regressions and integration assumptions visible.

### V. Operable, Understandable Design

The React frontend and Express backend MUST remain clearly separated by their API
contract. New abstractions or dependencies MUST have a concrete need and an owner.
Operational logs MUST identify the operation and outcome while excluding secrets and
sensitive content. The system MUST expose actionable errors to users and retain enough
diagnostic context for operators to investigate failures. This keeps the application
maintainable and supportable without compromising confidentiality.

## Target Technology Stack

| Component | Target Version | Notes |
|-----------|---------------|-------|
| Frontend | React 18 | Use Vite for development and frontend builds. |
| Frontend build tool | Vite | Pin a compatible version in the project manifest. |
| Backend runtime | Node.js | Select and pin the supported runtime version in project configuration. |
| Backend framework | Express | Pin a compatible version in the project manifest. |
| Database | PostgreSQL 15 | Use for persistent application data and verify database-dependent behavior against this version. |
| Local database infrastructure | Docker | Run PostgreSQL 15 in a reproducible, documented container configuration. |

## Additional Constraints

- The frontend MUST communicate with Jira and Confluence only through the backend;
  provider credentials and privileged API calls MUST remain server-side.
- Runtime configuration MUST be externalized. Local development MUST document required
  environment variables without including live credentials or secrets.
- User-visible automation results MUST distinguish completed, failed, and uncertain
  outcomes; partial or failed provider operations MUST NOT be presented as successful.
- Data retention and any storage of Jira/Confluence content MUST be limited to the
  application's documented purpose and reviewed before implementation.

## Development Workflow

- Feature work MUST begin with a specification that states user value, permissions,
  externally visible side effects, failure behavior, and measurable acceptance criteria.
- Plans MUST include a Constitution Check against every principle above. Any exception
  MUST identify the affected principle, rationale, risk, and mitigation, and receive
  explicit review before implementation.
- Tasks MUST include relevant frontend, backend, database migration, integration
  testing, and operational work; omit categories that do not apply and state why.
- Code review MUST verify automated checks, secret handling, authorization boundaries,
  database migration safety, and Jira/Confluence failure behavior before merge.

## Governance

This constitution is the project's governing source for engineering principles and
supersedes conflicting local conventions. Feature specifications and implementation
plans MUST identify applicable principles and record approved exceptions.

Amendments MUST be proposed as reviewed changes to this file. The proposal MUST explain
the motivation, affected principles or constraints, compatibility impact, and any
required updates to specifications, plans, tests, or runtime guidance. Reviewers MUST
check affected artifacts for consistency before approving the amendment.

The constitution uses semantic versioning: MAJOR for incompatible removal or
redefinition of a principle; MINOR for a new principle or materially expanded
requirement; PATCH for clarifications and non-semantic wording changes. Every
amendment MUST update the version and last-amended date. Compliance MUST be checked
during planning, code review, and validation; violations MUST be corrected or handled
through an explicitly reviewed exception.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-10-06
