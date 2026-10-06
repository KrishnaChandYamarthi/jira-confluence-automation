# A1 Bench Engagement — Skill Assessment Automation

This repository contains planning and automation work for a pilot skill-assessment program for bench resources. The goal is to help managers assess staffing readiness consistently and track assessment completion across the pilot skill tracks.

> **Project status:** The assessment workflow and dashboard are specified as pilot goals; do not assume they are fully implemented. See [`project_spec.md`](project_spec.md) for the technical specification and open decisions.

## Pilot goals

- Assess bench resources in six priority tracks: Java, JavaScript, Data Software Engineering, Automation Testing, Python, and Generative AI knowledge.
- Import a bench roster from a Radar CSV export.
- Use coding tasks and a sandboxed execution engine to produce scores and readiness flags.
- Give managers and leadership an aggregate view of readiness, assessment progress, and completion within the 10-day target.

The pilot is intended for local or on-premises hosting. Radar data is imported manually; direct Radar API integration and Azure hosting are out of scope for this phase.

## Repository contents

- [`project_spec.md`](project_spec.md) — pilot scope, functional requirements, proposed architecture, and open decisions.
- [`SETUP.md`](SETUP.md) — local Python development environment setup.
- [`requirements.txt`](requirements.txt) — Python dependencies.
- `automation/`, `work/`, and `reports/` — automation work and supporting project artifacts.

## Development setup

This project uses Python. On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Keep credentials and other local secrets in an untracked `.env` file; never commit them. See [`SETUP.md`](SETUP.md) for the setup verification command and additional guidance.

## Decisions still to be finalized

The specification leaves several implementation choices open, including the code-execution engine, database, dashboard frontend, per-track pass thresholds, exact 10-day KPI target, and reassessment policy. Review Section 8 of [`project_spec.md`](project_spec.md) before treating these as settled.

## Security and privacy

Assessment results are sensitive. Any implementation must restrict dashboard access to authorized managers and leadership, protect credentials, and execute submitted code in an isolated sandbox. Do not commit employee roster data, assessment results, credentials, or other sensitive information.
