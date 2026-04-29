---
sidebar_position: 4
---

# Backend Data Models

Reference for the Pydantic request/response models used by the FastAPI backend. These match the schemas in the [interactive API spec](./openapi-spec).

## Auth

### `RegisterRequest`
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `name` | string | ✅ | — | Full name |
| `email` | string | ✅ | — | Must be unique |
| `password` | string | ✅ | — | SHA-256 hashed before storage |
| `role` | string | ❌ | `"teacher"` | One of `teacher`, `admin` |

### `LoginRequest`
| Field | Type | Required |
|-------|------|----------|
| `email` | string | ✅ |
| `password` | string | ✅ |

### `OtpRequestRequest`
| Field | Type | Required |
|-------|------|----------|
| `email` | string | ✅ |

### `OtpVerifyRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | ✅ | |
| `token` | string | ✅ | 6-digit OTP from email |

### `AuthResponse`
| Field | Type | Notes |
|-------|------|-------|
| `token` | string | JWT valid for 30 days |
| `user` | `UserResponse` | |

### `UserResponse`
| Field | Type |
|-------|------|
| `id` | integer |
| `name` | string |
| `email` | string |
| `role` | string |

---

## Problems

### `CreateProblemRequest`
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `title` | string | ✅ | — | |
| `description` | string | ✅ | — | Student-facing |
| `languages` | list[string] | ✅ | — | e.g. `["python"]` |
| `boilerplate` | dict[str, str] | ✅ | — | Language → starter code (usually `""`) |
| `sections` | list[SectionIn] | ✅ | — | 2–4 logical chunks of the solution |
| `testCases` | list[TestCaseIn] | ❌ | `[]` | |
| `timeLimitSeconds` | int \| null | ❌ | `null` | |
| `maxSubmissions` | int \| null | ❌ | `null` | Per-student cap |
| `allowCopyPaste` | bool | ❌ | `true` | |
| `trackTabSwitching` | bool | ❌ | `false` | |

### `SectionIn`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `order` | integer | ✅ | 0-based display order |
| `label` | string | ✅ | Instruction displayed above the code block |
| `code` | dict[str, str] | ✅ | Language → starter code for this section |
| `suggestions` | list[SuggestionIn] | ❌ | |

### `SuggestionIn`
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `type` | string | ✅ | — | `"ai"` or `"manual"` |
| `isCorrect` | bool | ✅ | — | |
| `content` | string | ❌ | `""` | Filled by AI generation step when `type = "ai"` |

### `TestCaseIn`
| Field | Type | Notes |
|-------|------|-------|
| `input` | string | Valid Python call expression, e.g. `most_frequent([1,2,2])` |
| `expected` | string | Return value as string, e.g. `"2"` |
| `explanation` | string | |

### `EditProblemRequest`
All fields optional — only provided fields are updated.

| Field | Type |
|-------|------|
| `title` | string |
| `description` | string |
| `timeLimitSeconds` | int \| null |
| `maxSubmissions` | int \| null |
| `allowCopyPaste` | bool |
| `trackTabSwitching` | bool |

### `GradeSubmissionRequest`
| Field | Type | Notes |
|-------|------|-------|
| `session_id` | integer | |
| `grade` | integer | 0–100 inclusive |

---

## Submissions

### `StartSubmissionRequest`
| Field | Type | Required |
|-------|------|----------|
| `problem_id` | integer | ✅ |
| `student_name` | string | ✅ |

### `DraftRequest`
| Field | Type |
|-------|------|
| `code` | string |

### `SubmitRequest`
| Field | Type | Default |
|-------|------|---------|
| `code` | string | (required) |
| `suggestion_log` | list[SuggestionLogEntry] | `[]` |
| `tab_switch_log` | list[TabSwitchEntry] | `[]` |
| `test_results` | list[TestResult] | `[]` |
| `paste_log` | list[PasteLogEntry] | `[]` |

### Telemetry entry types

**`SuggestionLogEntry`** — records each interaction with a suggestion panel

| Field | Type | Notes |
|-------|------|-------|
| `time` | string | ISO 8601 timestamp |
| `action` | string | e.g. `viewed`, `selected`, `dismissed` |
| `label` | string | Section label the suggestion belonged to |

**`TabSwitchEntry`** — records when the student left the browser tab

| Field | Type |
|-------|------|
| `time` | string |

**`TestResult`** — result of running one test case client-side

| Field | Type |
|-------|------|
| `input` | string |
| `expected` | string |
| `actual` | string |
| `passed` | boolean |

**`PasteLogEntry`** — records paste/cut events in the editor

| Field | Type | Notes |
|-------|------|-------|
| `time` | string | |
| `type` | string | e.g. `paste`, `cut` |
| `charCount` | integer | |
| `preview` | string | First few characters of pasted content |

### `FeedbackRequest`
| Field | Type |
|-------|------|
| `feedback` | string |

---

## Quiz

### `QuizSubmitRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `problem_id` | integer | ✅ | |
| `language` | string | ✅ | One of `python`, `javascript`, `java`, `c` |
| `answers` | list[QuizAnswer] | ✅ | |
| `time_taken_seconds` | int \| null | ❌ | |

### `QuizAnswer`
| Field | Type |
|-------|------|
| `question_index` | integer |
| `selected_option` | string |
| `is_correct` | boolean |

---

## AI

### `AISuggestionRequest`
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `problem_id` | integer | ✅ | — | |
| `current_code` | string | ✅ | — | Code accumulated from previous sections |
| `problem_prompt` | string | ✅ | — | Full problem description |
| `is_correct` | bool | ❌ | `true` | `false` → generate a distractor |

### `AutofillRequest`
| Field | Type | Notes |
|-------|------|-------|
| `raw_text` | string | Minimum 30 characters |

---

## Code Execution

### `CodeExecutionRequest`
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `code` | string | ✅ | — | Source code to run |
| `language` | string | ✅ | — | One of `python`, `javascript`, `c`, `java` |
| `input` | string | ❌ | `""` | stdin passed to the program |

### `CodeExecutionResponse`
| Field | Type | Notes |
|-------|------|-------|
| `output` | string | Program stdout |
| `error` | string | stderr, compile errors, or Judge0 status |
