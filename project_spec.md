# Technical Specification: A1 Bench Engagement — Skill Assessment Automation

## 1. Overview

**Program:** A1 Bench Engagement
**Role/Context:** Junior Adaption Program Manager, overseeing 1600+ resource
capacity, with ~400 currently on the bench across 55+ skill tracks.
**Core Problem:** Bench resources need their skills validated via a
standardized assessment so managers/leadership can determine staffing
readiness, while resources stay productively engaged during their
unstaffed period.

This specification covers **Phase 1: Pilot** — a skill assessment
automation for 6 priority tracks, with a manager/leadership dashboard for
aggregate visibility.

## 2. Goals

- Provide a one-time, auto-graded coding assessment for bench resources
  in pilot skill tracks.
- Produce a **score** and a **readiness flag** (pass/fail against a
  threshold) per person, per track.
- Give leadership an aggregate dashboard view of bench readiness across
  all ~400 bench resources.
- Achieve **90%+ of bench resources assessed within 10 days** of going on
  bench (primary success KPI — exact target % open for confirmation).

## 3. Scope

### 3.1 In Scope (Pilot — Phase 1)

- Skill assessment covering **6 pilot tracks**:
  1. Java
  2. JavaScript
  3. Data Software Engineering
  4. Automation Testing (sub-tracks: Java, .NET, JS, Python)
  5. Python
  6. Generative AI / GenAI knowledge (cross-cutting, spans tracks such as
     Python.AI, AI Native Engineering, Generative AI Operations)
- Coding-task-based assessments with **automated grading** via an
  existing open-source/cloud code execution engine (e.g., Judge0, Piston).
- One-time assessment per person, triggered when they go on bench.
- Manual CSV import of bench roster data (name, track, bench start date)
  exported from Radar.epam.com.
- A **manager/leadership web dashboard** (Python/Flask or FastAPI backend
  + simple frontend) showing aggregate bench readiness.
- Role-based access: only managers/leadership can view the dashboard;
  individual bench resources cannot see others' data.
- Hosted on-prem/locally (no Azure deployment for this phase).

### 3.2 Out of Scope (for Pilot; future phases)

- The remaining ~49 skill tracks beyond the 6 pilot tracks.
- Recurring/periodic re-assessment (pilot is one-time only).
- Direct API integration with Radar.epam.com (no API currently available;
  manual CSV export/import only).
- Individual self-service dashboards for bench resources to view their
  own results.
- Cloud/Azure hosting.
- Automated training/upskilling content recommendations (may be a future
  phase tied to assessment results).

## 4. Data Sources & Inputs

| Source | Data | Integration Method |
|---|---|---|
| Radar.epam.com | Bench roster: name/ID, skill track, bench start date | Manual CSV export → import into the automation |
| Assessment platform (new, in-house) | Coding task submissions, scores | Native to this system |
| Code execution engine (Judge0/Piston, TBD) | Sandboxed code run results | API integration |

## 5. Functional Requirements

### 5.1 Bench Roster Import
- Import a CSV (exported from Radar) containing: employee identifier,
  name, skill track, bench start date.
- Support the 6 pilot tracks; other tracks may be imported but are
  flagged as "not yet assessable" in this phase.

### 5.2 Skill Assessment (Coding Tasks)
- Each of the 6 pilot tracks has its own coding task set, authored by
  **subject-matter experts (SMEs)/track leads**.
- Assessment is triggered **once**, when a person is identified as newly
  on bench.
- Submitted code is executed via a sandboxed code execution engine
  (Judge0, Piston, or similar) and auto-graded against expected
  test-case outputs.
- Each assessment produces:
  - A **numeric/percentage score**.
  - A **readiness flag** (e.g., "Ready" / "Not Ready") derived from a
    configurable pass threshold per track.

### 5.3 Manager/Leadership Dashboard
- Web-based dashboard (Python backend: Flask or FastAPI; simple
  frontend).
- Displays **aggregate** bench readiness across all bench resources:
  - Count/percentage assessed vs. not yet assessed.
  - Pass/fail (readiness) breakdown per track.
  - Average score per track.
  - Compliance against the 10-day assessment SLA (i.e., how many/what %
    of bench resources completed assessment within 10 days of their
    bench start date).
- **Access control:** restricted to managers/leadership only; individual
  bench resources do not have access to this dashboard or to others'
  results.

### 5.4 Reporting / KPI Tracking
- Primary KPI: **% of bench resources assessed within 10 days** of going
  on bench.
- Dashboard should visibly surface this KPI so it can be tracked over
  time.

## 6. Technical Architecture (Proposed)

- **Backend:** Python (Flask or FastAPI).
- **Code execution:** Integration with an existing open-source/cloud
  sandboxed code execution engine (e.g., Judge0 or Piston) — exact
  choice TBD during implementation (open item, see Section 8).
- **Data storage:** TBD — likely a lightweight database (e.g., SQLite or
  PostgreSQL) to store roster data, submissions, scores, and readiness
  flags (open item, see Section 8).
- **Frontend:** Simple internal web dashboard (framework TBD —
  server-rendered templates vs. a lightweight JS framework; open item).
- **Hosting:** On-prem/local for this phase (no Azure).
- **Data ingestion:** Manual CSV import (no live API to Radar.epam.com).

## 7. Non-Functional Requirements

- **Security & Privacy:** Assessment scores are sensitive
  performance-related data for 400+ individuals; access must be
  restricted to authorized managers/leadership only. Code execution must
  run in an isolated sandbox to prevent malicious submissions from
  affecting the host system.
- **Scale:** Must support ~400 bench resources across the 6 pilot tracks
  (with headroom to expand to the full 55+ tracks in future phases).
- **Timeline:** Working pilot targeted within **3–4 weeks**.

## 8. Open Items / Decisions Needed

- [ ] Confirm exact success KPI target percentage (e.g., "90% assessed
      within 10 days") — currently a placeholder.
- [ ] Select the specific code execution engine (Judge0 vs. Piston vs.
      other) based on language support (Java, JS, Python, .NET) and
      hosting constraints.
- [ ] Decide on the specific "GenAI knowledge" assessment scope — is this
      a standalone 6th track, or does it overlay onto the other 5 tracks
      (e.g., a GenAI module within each)?
- [ ] Decide on database technology for storing roster, submissions, and
      results.
- [ ] Define the pass/fail threshold per track (may differ by track).
- [ ] Confirm exact fields available in the Radar.epam.com CSV export to
      finalize the import format.
- [ ] Confirm whether SMEs/track leads need an authoring tool/UI to
      create coding tasks, or whether tasks will be provided as
      structured files (e.g., JSON/YAML) to the engineering team.
- [ ] Define what happens for someone who fails the assessment (retake
      policy, escalation, manual review) — not yet discussed, may be a
      Phase 2 concern.

## 9. Future Phases (Not Yet Scoped)

- Expansion to the remaining ~49 skill tracks.
- Recurring/periodic re-assessment for long-tenured bench resources.
- Direct API integration with Radar.epam.com (pending API availability).
- Individual self-service result dashboards.
- Cloud (Azure) hosting/migration.
- Training/upskilling recommendations tied to assessment gaps.
