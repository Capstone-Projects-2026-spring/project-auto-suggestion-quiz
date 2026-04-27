---
sidebar_position: 7
title: routes_quiz.py
description: Multiple-choice quiz attempt submission and retrieval
---

# `routes_quiz.py` — Quiz Router

**Source file:** `backend/routes_quiz.py`  
**Router prefix:** `/quiz`  
**Tags:** `quiz`

**Purpose:** Manages multiple-choice quiz attempts tied to coding problems. Teachers can present a quiz alongside a problem; authenticated users submit answers and retrieve their past attempts. The server calculates the score from the `is_correct` flags supplied by the client.

---

## Request / Response Models

### `QuizAnswer`

**Purpose:** Represents the student's response to one quiz question.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question_index` | `int` | ✅ | 0-based index of the question in the quiz |
| `selected_option` | `str` | ✅ | The answer option text the student chose |
| `is_correct` | `bool` | ✅ | Whether the chosen option is correct (evaluated client-side) |

---

### `QuizSubmitRequest`

**Purpose:** Carries a complete set of quiz answers for one attempt.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `problem_id` | `int` | ✅ | — | The problem this quiz is associated with |
| `language` | `str` | ✅ | — | Language the student solved the problem in; one of `python`, `javascript`, `java`, `c` |
| `answers` | `list[QuizAnswer]` | ✅ | — | One entry per question |
| `time_taken_seconds` | `int \| None` | ❌ | `None` | Total time spent on the quiz in seconds |

---

### `QuizAnswerResponse`

**Purpose:** Serializes one answer for inclusion in `QuizAttemptResponse`.

| Field | Type | Description |
|-------|------|-------------|
| `question_index` | `int` | 0-based question index |
| `selected_option` | `str` | The option the student chose |
| `is_correct` | `bool` | Whether it was correct |

---

### `QuizAttemptResponse`

**Purpose:** Represents a saved quiz attempt, returned by all three quiz endpoints. The `answers` list is populated on the detail endpoint and empty on the list endpoint.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Database ID of the attempt |
| `problem_id` | `int` | Problem the quiz was for |
| `user_id` | `int` | User who submitted the attempt |
| `language` | `str` | Language used |
| `score` | `int` | Number of correct answers |
| `total` | `int` | Total number of questions |
| `time_taken_seconds` | `int \| None` | Time spent, if recorded |
| `submitted_at` | `str` | ISO 8601 timestamp |
| `answers` | `list[QuizAnswerResponse]` | Individual answers; empty on list endpoints |

---

## Helper Functions

### `_get_user_from_token`

```python
def _get_user_from_token(authorization: Optional[str]) -> dict
```

**Purpose:** Extracts and validates the JWT from the `Authorization: Bearer <token>` header. Used by every endpoint in this router.

| Parameter | Type | Description |
|-----------|------|-------------|
| `authorization` | `str \| None` | Value of the `Authorization` request header |

**Returns:** `dict` — Decoded JWT payload with keys `user_id` (int), `email` (str), `role` (str).

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `401` | Header is missing or not a Bearer token |
| `401` | Token has expired (`jwt.ExpiredSignatureError`) |
| `401` | Token is invalid (`jwt.InvalidTokenError`) |

---

## Route Handlers

### `submit_quiz`

```
POST /quiz/submit
Authorization: Bearer <token>
```

**Purpose:** Records a completed quiz attempt. Calculates `score` server-side by summing `is_correct` values and stores each individual answer. Returns the full attempt record with status `201 Created`.

**Pre-conditions:**
- Valid JWT (any role).
- `req.problem_id` must reference an existing problem.

**Post-conditions:**
- One row inserted into `quiz_attempts` with `score` and `total` computed from `req.answers`.
- One row per answer inserted into `quiz_answers`.
- Returns the fully populated `QuizAttemptResponse`.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `req` | `QuizSubmitRequest` | Request body | Quiz answers and metadata |
| `authorization` | `str \| None` | Header | Bearer JWT |

**Returns:** `QuizAttemptResponse`

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `401` | Missing or invalid token |
| `404` | Problem not found |

---

### `get_attempts`

```
GET /quiz/attempts/{user_id}
Authorization: Bearer <token>
```

**Purpose:** Returns all quiz attempts submitted by the specified user, ordered newest first. Returns attempt summaries without per-question answers (use `get_attempt_detail` for those).

**Pre-conditions:**
- Valid JWT (any role).
- Students may only request their own `user_id`. Teachers and admins may request any user's attempts.

**Post-conditions:**
- `answers` field on each returned attempt is an empty list.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `user_id` | `int` | Path | Database ID of the user whose attempts to retrieve |
| `authorization` | `str \| None` | Header | Bearer JWT |

**Returns:** `list[QuizAttemptResponse]`

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `401` | Missing or invalid token |
| `403` | Student requesting another user's attempts |

---

### `get_attempt_detail`

```
GET /quiz/attempt/{attempt_id}
Authorization: Bearer <token>
```

**Purpose:** Returns a single quiz attempt including every per-question answer. Students may only retrieve their own attempts; teachers and admins may retrieve any attempt.

**Pre-conditions:**
- Valid JWT (any role).
- `attempt_id` must exist.
- Students may only access attempts where `attempt.user_id == token.user_id`.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `attempt_id` | `int` | Path | Database ID of the attempt |
| `authorization` | `str \| None` | Header | Bearer JWT |

**Returns:** `QuizAttemptResponse` (with `answers` fully populated)

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `401` | Missing or invalid token |
| `403` | Student accessing another user's attempt |
| `404` | Attempt not found |
