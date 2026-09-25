# Implementation Backlog — A1 Bench Engagement Pilot

Derived from `project_spec.md`. This backlog resolves several of the
open items from Section 8 of the spec via clarification with the
project owner (see **Decisions Applied** below); remaining open items
are flagged inline as `(OPEN ITEM)`.

## Decisions Applied (from clarification)

- **Rollout strategy:** Build one track end-to-end first (MVP), then
  expand to the remaining 5. **MVP track: Java.**
- **Code execution engine:** Not yet chosen — backlog includes an
  evaluation/spike task; integration tasks are written generically to
  support either **Judge0 or Piston**.
- **GenAI track:** Standalone 6th track with its own coding task set
  (not an overlay on the other 5).
- **Database:** SQLite for the pilot.
- **Task authoring:** SMEs/track leads provide structured **JSON/YAML**
  task files to engineering (no authoring UI in this phase).
- **Failure handling:** Manual review/escalation by the manager (no
  automated retake logic in this phase).

---

## Phase 1: Setup

- [ ] Initialize the project repository (structure, `.gitignore`,
      README)
- [ ] Set up Python virtual environment and `requirements.txt`
      (Flask/FastAPI, SQLite driver, testing libraries)
- [ ] Choose backend framework: Flask vs. FastAPI, and scaffold the
      base app
- [ ] Design initial SQLite schema: `bench_resources`, `tracks`,
      `submissions`, `scores`, `readiness_flags`
- [ ] Define the JSON/YAML schema for coding task files (task
      description, test cases, expected outputs, language, pass
      threshold)
- [ ] Spike: evaluate Judge0 vs. Piston for language support (Java
      first, then JS/.NET/Python), hosting footprint, and API
      ergonomics; document a recommendation
- [ ] Define the CSV import format expected from Radar.epam.com
      exports (employee ID, name, track, bench start date) —
      `(OPEN ITEM: confirm exact Radar CSV column names/format with a
      sample export)`
- [ ] Set up local dev environment instructions (`SETUP.md` or
      equivalent) for new contributors
- [ ] Set up basic project CI (lint + test run on push), if applicable

## Phase 2: Core Features

### MVP — Java track end-to-end
- [ ] Build CSV roster importer (parses Radar export, loads into
      `bench_resources` table, flags unsupported tracks as
      "not yet assessable")
- [ ] Build Java coding task loader (reads JSON/YAML task files for
      the Java track)
- [ ] Implement assessment trigger logic (fires once when a Java-track
      resource is newly marked "on bench")
- [ ] Implement submission handling (accept code submission tied to a
      bench resource + task)
- [ ] Implement score calculation from graded test-case results
- [ ] Implement configurable per-track pass/fail threshold and
      readiness flag logic (Ready / Not Ready) for Java
- [ ] Implement manual-review flag/status for failed assessments
      (surfaces to manager for follow-up)

### Expansion — remaining 5 tracks
- [ ] Add task loader + task files for JavaScript track
- [ ] Add task loader + task files for Data Software Engineering track
- [ ] Add task loader + task files for Automation Testing track (with
      Java/.NET/JS/Python sub-track variants)
- [ ] Add task loader + task files for Python track
- [ ] Add task loader + task files for standalone GenAI knowledge track
- [ ] Generalize assessment trigger, submission handling, and
      readiness-flag logic to work across all 6 tracks (remove
      Java-only assumptions)
- [ ] Confirm/set per-track pass/fail thresholds with each track lead
      `(OPEN ITEM: exact thresholds per track)`

## Phase 3: Integration

- [ ] Integrate selected code execution engine (Judge0 or Piston) for
      sandboxed grading of Java submissions (MVP)
- [ ] Extend code execution engine integration to remaining languages
      (JavaScript, .NET, Python) as each track is added
- [ ] Wire CSV import → roster table → assessment trigger pipeline
      end-to-end
- [ ] Build the manager/leadership dashboard backend endpoints
      (aggregate counts, pass/fail breakdown per track, average score
      per track, 10-day SLA compliance %)
- [ ] Build the dashboard frontend (simple server-rendered or
      lightweight JS UI) consuming the above endpoints
- [ ] Implement role-based access control so only managers/leadership
      can reach the dashboard
- [ ] Wire the primary KPI (% assessed within 10 days) into the
      dashboard view `(OPEN ITEM: confirm exact target % — spec
      currently says "90%+" as a placeholder)`
- [ ] Wire manual-review/failure flags into a manager-visible view for
      follow-up action

## Phase 4: Testing

- [ ] Unit tests for CSV import parsing (including malformed/missing
      fields)
- [ ] Unit tests for score calculation and readiness-flag logic per
      track threshold
- [ ] Integration tests for submission → code execution engine →
      score pipeline (Java first, then each added track)
- [ ] Integration tests for the assessment-trigger pipeline
      (roster import → single-fire assessment trigger, no duplicate
      triggers)
- [ ] Dashboard aggregation tests (counts, percentages, SLA
      compliance calculations) against known sample data
- [ ] Access control tests (non-manager cannot reach dashboard or
      other people's results)
- [ ] Security/sandbox isolation test: confirm submitted code cannot
      access the host system or other submissions
- [ ] Load/volume test with a representative dataset (~400 bench
      resources) to confirm the dashboard and grading pipeline perform
      acceptably

## Phase 5: Documentation

- [ ] Write project `README.md` (purpose, architecture overview, how
      to run locally)
- [ ] Write the task-authoring guide for SMEs/track leads (JSON/YAML
      schema, examples, how to submit new tasks)
- [ ] Write the manager/leadership dashboard user guide (how to read
      the KPI, readiness flags, and per-track breakdown)
- [ ] Write the CSV roster import guide (expected format, how to
      export from Radar, troubleshooting common import errors)
- [ ] Document the code execution engine integration (chosen engine,
      configuration, how to add support for a new language)
- [ ] Update `project_spec.md` Section 8 (Open Items) to reflect
      decisions made in this backlog, keeping the still-unresolved
      items clearly marked
