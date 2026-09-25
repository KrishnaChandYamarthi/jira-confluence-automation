# Development Environment Setup

This project uses Python. Follow these steps to set up a local
development environment.

## 1. Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

## 2. Install dependencies

```powershell
pip install -r requirements.txt
```

## 3. Configure environment variables

Copy `.env` (or create one) with your local credentials — see
`automation/status_report/README.md` for the variables required by the
status report automation. `.env` is git-ignored and should never be
committed.

## 4. Verify the setup

```powershell
python -c "import requests, dotenv; print('Environment OK')"
```

You should see `Environment OK` printed with no errors.
