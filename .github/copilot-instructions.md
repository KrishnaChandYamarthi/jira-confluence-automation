- Important! Always follow the instructions in `./instructions/main.agent.md` file.
- Always load the file completely, not partially.
- It contains links to other files with instructions.
- You should reload it in **every prompt** to get the latest instructions because the project instructions are dynamic.

# Project Copilot Instructions

## Project structure and current architecture
This is a small Python repository, not yet the bench-assessment web application described in `project_spec.md`.

- `automation/status_report/` contains the implemented Jira reporting workflow. `generate_status_report.py` loads configuration from environment variables, queries Jira through REST/JQL, formats issues as Markdown, and writes a dated report under `work/status-reports/`.
- `.vscode/mcp.json` configures Atlassian's hosted Rovo MCP server using the Jira credentials in the local `.env`. The file is Git-ignored because it contains an authentication header; regenerate it locally if needed. Atlassian must have API-token authentication enabled for this MCP server.
- `calculator/` is a standalone arithmetic example: `operations.py` defines the functions and `main.py` demonstrates them.
- `math_helper.py` and `work/module03-task/` are separate small calculator examples, not shared layers or dependencies of `calculator/`.
- `project_spec.md` and `backlog.md` describe a planned bench-assessment pilot. Treat those as product direction, not as evidence that its web UI, database, assessment engine, or access control already exists.
- `reports/`, `work/`, and `instructions/` hold report examples, requirements, and task-specific agent instructions.

There is no common application framework, package/build system, or shared service/data layer. The runnable Python files are the entry points.

## Build, test, lint, and run

Use the root `requirements.txt` for the repository environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Run the calculator example from the repository root:

```powershell
python calculator/main.py
```

Run the Jira report generator from the repository root:

```powershell
python automation/status_report/generate_status_report.py
```

The report generator requires the Jira settings documented in `automation/status_report/README.md` in a local `.env` file. The root `.gitignore` excludes `.env`; never put credentials in source, generated reports, or commits. The report script calls the live Jira API and saves its output in `work/status-reports/`.

There is currently no configured build step, test suite/test runner, or linter, and no test modules are present. Consequently, there is no existing single-test command to run.

## Code and behavior conventions

- Keep executable scripts import-safe: place command-line work in `main()` and invoke it under `if __name__ == "__main__":`.
- Keep the calculator examples' arithmetic functions in their small operation modules; their `main.py` files are demonstrations rather than application-wide entry points.
- In the Jira report workflow, keep settings environment-driven through `load_config()`, use the existing `search_issues()` helper for Jira requests, and keep report formatting in `render_report()`/`format_issue()`. Preserve the request timeout and `raise_for_status()` behavior when changing API calls.
- Keep generated Jira reports consistent with the format in `automation/status_report/README.md` and `STATUS_REPORT_TEMPLATE.md`. For manually authored weekly status reports, follow `reports/instructions.md` and `instructions/create-status-report.agent.md` (section order, bullets only, 20-line maximum).
