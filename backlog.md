

- [ ] Integrate selected code execution engine (Judge0 or Piston) for sandboxed grading of Java submissions (MVP)
- [ ] Extend code execution engine integration to remaining languages (JavaScript, .NET, Python) as each track is added
- [ ] Wire CSV import → roster table → assessment trigger pipeline end-to-end
- [ ] Build the manager/leadership dashboard backend endpoints (aggregate counts, pass/fail breakdown per track, average score per track, 10-day SLA compliance %)
- [ ] Build the dashboard frontend (simple server-rendered or lightweight JS UI) consuming the above endpoints
- [ ] Implement role-based access control so only managers/leadership can reach the dashboard
- [ ] Wire the primary KPI (% assessed within 10 days) into the dashboard view `(OPEN ITEM: confirm exact target % — spec currently says "90%+" as a placeholder)`
- [ ] Wire manual-review/failure flags into a manager-visible view for follow-up action


## Phase 4: Testing


- [ ] Unit tests for CSV import parsing (including malformed/missing fields)
- [ ] Unit tests for score calculation and readiness-flag logic per track threshold
- [ ] Integration tests for submission → code execution engine → score pipeline (Java first, then each added track)
- [ ] Integration tests for the assessment-trigger pipeline (roster import → single-fire assessment trigger, no duplicate triggers)
- [ ] Dashboard aggregation tests (counts, percentages, SLA compliance calculations) against known sample data
- [ ] Access control tests (non-manager cannot reach dashboard or other people's results)
- [ ] Security/sandbox isolation test: confirm submitted code cannot access the host system or other submissions
- [ ] Load/volume test with a representative dataset (~400 bench resources) to confirm the dashboard and grading pipeline perform acceptably


## Phase 5: Documentation


- [ ] Write project `README.md` (purpose, architecture overview, how to run locally)
- [ ] Write the task-authoring guide for SMEs/track leads (JSON/YAML schema, examples, how to submit new tasks)
- [ ] Write the manager/leadership dashboard user guide (how to read the KPI, readiness flags, and per-track breakdown)
- [ ] Write the CSV roster import guide (expected format, how to export from Radar, troubleshooting common import errors)
- [ ] Document the code execution engine integration (chosen engine, configuration, how to add support for a new language)
- [ ] Update `project_spec.md` Section 8 (Open Items) to reflect decisions made in this backlog, keeping the still-unresolved items clearly marked

## Module 19: GitHub coding agent delegation candidates

These are proposals for delegating implementation work through the GitHub coding agent; they do not automatically assign issues. The agent should work in a pull request, with a human reviewing the result before merge.

### Good candidates once the issue scope is confirmed
- **#1 — SQLite schema:** Delegate schema implementation and tests after the data model and any unresolved schema choices are explicit in the issue.
- **#3 — Python environment and dependencies:** Delegate reproducible environment/dependency setup and verification, keeping versions and setup aligned with the project requirements.
- **#8 — Setup instructions:** Delegate a documentation update after the setup path is validated; instructions should match the actual project commands.
- **#9 — CI:** Delegate the workflow implementation and checks after the supported Python version and required CI jobs are confirmed.

### Conditional or not ready to delegate
- **#5 — Framework/scaffold:** Suitable after a human confirms the framework choice (Flask or FastAPI); do not ask the agent to make that product decision implicitly.
- **#6 — Radar CSV format:** Wait for a representative Radar export and confirmation of the required columns; otherwise the agent would have to invent the input contract.
- **#7 — Judge0 vs. Piston:** The agent can gather evidence and compare options, but a human should select the execution engine before implementation is delegated.
- **#2 — Repository structure:** Review the open issue for remaining gaps first; the repository, README, and `.gitignore` are already present, so avoid duplicating completed setup work.
- **#4 — Task-file schema:** Exclude from delegation for now because the corresponding GitHub issue is closed.
