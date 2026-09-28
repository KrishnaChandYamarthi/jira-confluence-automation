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

- [`./instructions/write-reliable-output.agent.md`](./write-reliable-output.agent.md) — apply shared rules for precise, evidence-based workflow output.
  + Keywords: reliable output, validation result, missing data, unsupported claim
  + Target: instructions that produce reports, import results, or validation summaries

- [`../instructions/calculate-compound-interest.agent.md`](../instructions/calculate-compound-interest.agent.md) — calculate compound interest (final amount and interest earned) via `tools/compound_interest.py`.
  + Keywords: compound interest, final amount, interest earned, investment growth
  + Exceptions: not for simple interest, loan amortization, or continuous compounding

- [`../instructions/use-benchASMT.agent.md`](../instructions/use-benchASMT.agent.md) — identify bench associates for a skill from the A1 repo workbook and generate a LeetCode-style Java skill review assessment via `tools/export_bench_associates.py` and `tools/Java_bench_ASMT.py`.
  + Keywords: bench assessment, Java skill review, bench associates, LeetCode-style test, A1 repo
  + Exceptions: Java-focused problem bank; do not use for non-Java assessments or interview scheduling