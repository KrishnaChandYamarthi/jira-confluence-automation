# Instructions Catalog

Each entry below is an instruction file with a one-line description. Load the matching instruction when the user's request contains its keywords.

---

- [`./instructions/creating-instructions.agent.md`](./creating-instructions.agent.md) — create and maintain the project's platform-agnostic instruction infrastructure.
  + Keywords: create instruction, update instruction, instruction infrastructure, agent instructions

- [`./instructions/create-status-report.agent.md`](./create-status-report.agent.md) — generate a concise weekly status report.
  + Keywords: weekly status report, status report, accomplishments, blockers, next week

- [`./instructions/import-radar-roster.agent.md`](./import-radar-roster.agent.md) — validate and normalize a manual Radar bench-roster CSV for import.
  + Keywords: Radar.epam.com, Radar export, Radar CSV, bench roster, roster import
  + Exceptions: do not assume exact Radar headers or a live API; require an explicit mapping when headers are unknown.