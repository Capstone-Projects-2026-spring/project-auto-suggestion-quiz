# Backend Unit Testing

This page documents the backend unit-test organization, what each suite validates, and the standard commands used to run tests and coverage.

## Test Location

All backend unit tests are under:

- `backend/backUnitTest/`

## How To Run

From the repository root:

```bash
cd backend
venv/bin/python -m pytest backUnitTest -q
```

Run coverage for backend app modules:

```bash
cd backend
venv/bin/python -m pytest backUnitTest -q \
  --cov=aiSuggestion \
  --cov=auth \
  --cov=database \
  --cov=main \
  --cov=routes_ai \
  --cov=routes_auth \
  --cov=routes_judge \
  --cov=routes_problems \
  --cov=routes_quiz \
  --cov=routes_submissions \
  --cov-report=term-missing
```

## Suite Map

| Suite | Files | Focus |
| --- | --- | --- |
| `aiTest` | `test_aiResponse.py`, `test_aiRetoken.py`, `test_aiSuggestion.py`, `test_routes_ai.py` | AI suggestion/tokenization behavior and `/ai/*` route handling |
| `authTest` | `test_auth.py`, `test_loginRoute.py`, `test_login.py`, `test_register.py`, `test_otp_and_devlogin.py` | Password hashing, JWT auth, login/register, legacy login behavior, dev-login, OTP auth flows |
| `judge0Test` | `test_judge0_success.py`, `test_judge0_failure.py`, `judge0_test_utils.py` | Judge0 execution success/failure paths and upstream error mapping |
| `problemsTest` | `test_problems.py`, `test_timer.py` | Problem CRUD, helper branches, grading, permissions, access code behavior, and time limit behavior |
| `submissionsTest` | `test_submissions.py` | Submission lifecycle: start, draft, submit, retrieve, feedback |
| `quizTest` | `test_quiz.py` | Quiz auth, submission, attempt listing/detail retrieval |
| `mainTest` | `test_main.py` | App startup/migration branches and root endpoint |

## Shared Test Utilities

Common mock helpers are centralized in:

- `backend/backUnitTest/test_helpers.py`

This keeps DB mock setup consistent and avoids duplicated helper code across suites.

## Current Status

- Backend unit tests pass.
- Backend app-module coverage is tracked using the command above.
- Core backend modules currently maintain full branch/line coverage in the active test suite.

## Maintenance Guidelines

- Add new tests to the domain suite folder instead of creating mixed-purpose files.
- Reuse `test_helpers.py` for common DB connection/cursor mocks.
- Prefer one test file per route/domain unless splitting by success/failure improves readability.
- Keep this page updated when adding/removing suite files or changing commands.
