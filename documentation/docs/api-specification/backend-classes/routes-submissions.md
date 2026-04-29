---
sidebar_position: 6
title: routes_submissions.py
description: Student submission lifecycle — start, draft, submit, feedback
---

# `routes_submissions.py` — Submissions Router

**Source file:** `backend/routes_submissions.py`  
**Router prefix:** `/submissions`  
**Tags:** `submissions`

**Purpose:** Manages the complete lifecycle of a student's coding session: starting (or resuming) a session, autosaving code drafts, final submission with telemetry, retrieving session state, and saving teacher feedback. Most endpoints are intentionally unauthenticated so students can participate without accounts. Only the feedback endpoint requires a teacher JWT.

---

## Request / Response Models

### `StartSubmissionRequest`

**Purpose:** Identifies the student and problem when starting or resuming a session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `problem_id` | `int` | ✅ | Database ID of the problem to attempt |
| `student_name` | `str` | ✅ | Student's name used as their identifier throughout the session |

---

### `DraftRequest`

**Purpose:** Carries the student's current code for autosave purposes.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `str` | ✅ | Full editor contents at the time of autosave |

---

### `SuggestionLogEntry`

**Purpose:** Records one interaction event with the suggestion panel (view, select, dismiss). Collected client-side and submitted with the final submission.

| Field | Type | Description |
|-------|------|-------------|
| `time` | `str` | ISO 8601 timestamp of the event |
| `action` | `str` | Type of interaction, e.g. `"viewed"`, `"selected"`, `"dismissed"` |
| `label` | `str` | Label of the section whose suggestion was interacted with |

---

### `TabSwitchEntry`

**Purpose:** Records one instance of the student navigating away from the problem tab. Collected when `trackTabSwitching` is enabled on the problem.

| Field | Type | Description |
|-------|------|-------------|
| `time` | `str` | ISO 8601 timestamp when the tab lost focus |

---

### `TestResult`

**Purpose:** Records the outcome of one test case run client-side before submission.

| Field | Type | Description |
|-------|------|-------------|
| `input` | `str` | The input expression that was tested |
| `expected` | `str` | Expected output |
| `actual` | `str` | Actual output returned by the student's code |
| `passed` | `bool` | Whether `actual == expected` |

---

### `PasteLogEntry`

**Purpose:** Records one paste or cut event in the code editor. Used to detect potential academic integrity issues.

| Field | Type | Description |
|-------|------|-------------|
| `time` | `str` | ISO 8601 timestamp |
| `type` | `str` | Event type, e.g. `"paste"` or `"cut"` |
| `charCount` | `int` | Number of characters pasted/cut |
| `preview` | `str` | First few characters of the pasted content (truncated) |

---

### `SubmitRequest`

**Purpose:** Carries the student's final code along with all telemetry logs collected during the session.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `code` | `str` | ✅ | — | Final editor contents |
| `suggestion_log` | `list[SuggestionLogEntry]` | ❌ | `[]` | All suggestion interaction events |
| `tab_switch_log` | `list[TabSwitchEntry]` | ❌ | `[]` | All tab-switch events |
| `test_results` | `list[TestResult]` | ❌ | `[]` | Results of test cases run client-side |
| `paste_log` | `list[PasteLogEntry]` | ❌ | `[]` | All paste/cut events |

---

### `FeedbackRequest`

**Purpose:** Carries teacher-written feedback text to attach to a submitted session.

| Field | Type | Required |
|-------|------|----------|
| `feedback` | `str` | ✅ |

---

## Route Handlers

### `start_submission`

```
POST /submissions/start
(no authentication required)
```

**Purpose:** Starts a new student session or resumes an existing unsubmitted draft. Checks the problem's `max_attempts` limit before creating a new session.

**Pre-conditions:**
- `req.problem_id` must reference an existing problem.
- If `max_attempts` is set, the student must not have already reached the limit of fully submitted sessions.

**Post-conditions:**
- If an open draft exists for this student+problem combination, it is returned with `has_draft: true` and the saved code. No new row is created.
- If no draft exists, a new `sessions` row is inserted and returned with `has_draft: false`.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `req` | `StartSubmissionRequest` | Request body | Problem ID and student name |

**Returns:** `dict` with keys:

| Key | Type | Description |
|-----|------|-------------|
| `session_id` | `int` | Database ID of the session |
| `has_draft` | `bool` | `true` if a previous unsubmitted draft was found |
| `code` | `str \| None` | Previously saved code, or `null` for a fresh session |
| `started_at` | `str \| None` | ISO 8601 timestamp of when the session was created |

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `403` | Student has reached the `max_attempts` limit |
| `404` | Problem not found |

---

### `save_draft`

```
PUT /submissions/{session_id}/draft
(no authentication required)
```

**Purpose:** Overwrites the `code` column on the session row. Called automatically by the frontend on a timer (autosave). Does not set `submitted_at`.

**Pre-conditions:**
- `session_id` must reference an existing session.
- The session must not have been submitted yet (`submitted_at IS NULL`).

**Post-conditions:**
- `sessions.code` is updated to `req.code`.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `session_id` | `int` | Path | Session to update |
| `req` | `DraftRequest` | Request body | Current code |

**Returns:** `dict` — `{"session_id": int, "status": "saved"}`

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `404` | Session not found |
| `409` | Session has already been submitted |

---

### `submit_session`

```
POST /submissions/{session_id}/submit
(no authentication required)
```

**Purpose:** Finalizes the submission. Saves the final code and all telemetry logs to the database and sets `submitted_at` to the current timestamp. Enforces `max_attempts` at submission time as a second check.

**Pre-conditions:**
- `session_id` must reference an existing, unsubmitted session.
- The student must not have exceeded `max_attempts` on the problem.

**Post-conditions:**
- `sessions.code`, `suggestion_log`, `tab_switch_log`, `test_results`, `paste_log`, and `submitted_at` are all updated atomically.
- The session is permanently locked (cannot be drafted or submitted again).

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `session_id` | `int` | Path | Session to finalize |
| `req` | `SubmitRequest` | Request body | Final code + telemetry |

**Returns:** `dict` — `{"session_id": int, "status": "submitted"}`

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `403` | Submission limit reached |
| `404` | Session not found |
| `409` | Session already submitted |

---

### `get_session`

```
GET /submissions/{session_id}
(no authentication required)
```

**Purpose:** Returns the current state of a session. Used by the frontend to determine if a session has been submitted and to reload saved code.

**Pre-conditions:**
- `session_id` must reference an existing session.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `session_id` | `int` | Path | Session to retrieve |

**Returns:** `dict` with keys:

| Key | Type | Description |
|-----|------|-------------|
| `session_id` | `int` | |
| `code` | `str \| None` | Current saved code |
| `submitted` | `bool` | `true` if `submitted_at` is set |

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `404` | Session not found |

---

### `save_feedback`

```
PUT /submissions/{session_id}/feedback
Authorization: Bearer <token>  (teacher or admin)
```

**Purpose:** Attaches written teacher feedback to a submitted session. The feedback is stored in `sessions.feedback` and displayed to the student on their results page.

**Pre-conditions:**
- Valid JWT with role `"teacher"` or `"admin"`.
- `session_id` must reference an existing session (does not need to be submitted, though logically feedback is added after submission).

**Post-conditions:**
- `sessions.feedback` is updated to `req.feedback`.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `session_id` | `int` | Path | Session to annotate |
| `req` | `FeedbackRequest` | Request body | Feedback text |
| `authorization` | `str \| None` | Header | Bearer JWT |

**Returns:** `dict` — `{"session_id": int, "status": "saved"}`

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `401` | Missing or invalid token |
| `403` | Role is not `"teacher"` or `"admin"` |
| `404` | Session not found |
