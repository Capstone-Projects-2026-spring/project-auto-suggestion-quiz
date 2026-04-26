---
sidebar_position: 2
title: Interface specifications
description: REST endpoints, purposes, and auth expectations for the AutoSuggestion Quiz backend.
---

The live interactive schema is available at `/docs` when the FastAPI server is running. This page summarizes the main interfaces by concern.

## Router overview

| Prefix | Purpose |
|--------|---------|
| `/auth` | OTP request/verify, optional dev login (`/auth/dev-login` when `DEBUG=True`), email/password login, JWT issuance |
| `/problems` | Teacher CRUD, `GET /problems/access/{code}` for students, grading |
| `/submissions` | Start session, draft autosave, final submit with telemetry |
| `/ai` | Suggestions and problem autofill |
| `/code` | Non-Python execution via Judge0 |
| `/quiz` | Authenticated quiz attempts and per-question answers |

## Auth

- **OTP**: `POST /auth/otp/request`, `POST /auth/otp/verify` — Supabase-backed email OTP; response includes app JWT.
- **Dev** (local only): `POST /auth/dev-login` — disabled unless `DEBUG=True`.
- **Password** (if used): `POST /auth/login`, `POST /auth/register` — returns JWT.

Protected teacher routes expect `Authorization: Bearer <token>`.

## AI

### `POST /ai/suggestion`

Returns next-step suggestions and explanations from current code and problem prompt.

- **Caller**: student code editor in the web client.
- **Body** (conceptual): `problem_id`, `current_code`, `problem_prompt`, optional `is_correct`.

### `POST /ai/autofill`

Parses pasted or raw problem text into structured problem JSON for the create-problem form.

- **Body**: `raw_text` (minimum length enforced in handler).

## Problems

### `POST /problems/`

Create a problem (sections, suggestions, test cases, settings). Requires teacher JWT.

### `GET /problems/`

List problems for the authenticated teacher.

### `GET /problems/access/{code}`

Public lookup by 6-digit access code for student entry.

### `PATCH /problems/{problem_id}`, `DELETE /problems/{problem_id}`

Edit metadata/settings or delete (teacher owns problem).

### `POST /problems/{problem_id}/grade`

Manual grade for a session: body includes `session_id`, `grade` (0–100).

## Submissions

### `POST /submissions/start`

Start or resume a draft for `problem_id` + `student_name`.

### `PUT /submissions/{session_id}/draft`

Autosave code for an unsubmitted session.

### `POST /submissions/{session_id}/submit`

Finalize: code plus `suggestion_log`, `tab_switch_log`, `test_results`, `paste_log`.

### `GET /submissions/{session_id}`

Session state (code, submitted flag).

## Code execution

### `POST /code/execute`

Runs non-Python languages through Judge0. Requires `JUDGE0_URL` (and optional `JUDGE0_AUTH_TOKEN`).

- **Body**: `code`, `language` (`python` \| `javascript` \| `c` \| `java`), optional `input`.

Python runs in the browser via Pyodide; this endpoint is used for other languages.
