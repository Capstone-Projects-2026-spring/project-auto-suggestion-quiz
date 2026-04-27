---
sidebar_position: 8
title: routes_ai.py
description: AI code suggestion and problem autofill endpoints
---

# `routes_ai.py` — AI Router

**Source file:** `backend/routes_ai.py`  
**Router prefix:** `/ai`  
**Tags:** `ai`

**Purpose:** Exposes two AI-powered endpoints. The first generates code suggestions for a specific problem section using the `aiSuggestion` module. The second accepts raw instructor text and uses GPT-4o-mini to parse it into a structured problem schema that can pre-populate the problem creation form.

---

## Module-Level Constants

### `AUTOFILL_SYSTEM_PROMPT`

| Name | Type | Purpose |
|------|------|---------|
| `AUTOFILL_SYSTEM_PROMPT` | `str` | System prompt sent to `gpt-4o-mini` for the autofill endpoint. Instructs the model to parse raw instructor text into a structured problem JSON with sections, boilerplate, and test cases. Also defines the rules for section splitting, code formatting, and error handling when input lacks sufficient detail. |

---

## Request / Response Models

### `AISuggestionRequest`

**Purpose:** Carries the context needed for the AI to generate a targeted code suggestion for a specific section.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `problem_id` | `int` | ✅ | — | Database ID of the problem (currently used for logging/context) |
| `current_code` | `str` | ✅ | — | Code accumulated from all sections the student has passed so far |
| `problem_prompt` | `str` | ✅ | — | Full student-facing problem description for context |
| `is_correct` | `bool` | ❌ | `True` | `True` → correct suggestion; `False` → plausible distractor |

---

### `SingleSuggestion`

**Purpose:** Represents one AI-generated code suggestion and its explanation.

| Field | Type | Description |
|-------|------|-------------|
| `suggestion` | `str` | The code snippet to present to the student |
| `explanation` | `str` | Plain-English explanation of what the code does. When `is_correct=False`, the explanation intentionally does not hint at the error. |

---

### `AISuggestionResponse`

**Purpose:** Wraps the list of suggestions returned by the AI endpoint.

| Field | Type | Description |
|-------|------|-------------|
| `suggestions` | `list[SingleSuggestion]` | AI-generated suggestions (currently always length 1) |

---

### `AutofillRequest`

**Purpose:** Carries raw instructor text to be parsed into a structured problem schema.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `raw_text` | `str` | ✅ | Must be at least 30 non-whitespace characters |

---

## Route Handlers

### `get_ai_suggestion`

```
POST /ai/suggestion
(no authentication required)
```

**Purpose:** Calls the `aiSuggestion` function with the student's current code and the problem description, then returns the result as an `AISuggestionResponse`. No database interaction occurs.

**Pre-conditions:**
- `OPENAI_API_KEY` environment variable must be configured.
- `req.current_code` should be syntactically valid code up to the current point.
- `req.problem_prompt` should clearly describe the problem so the model generates a relevant suggestion.

**Post-conditions:**
- Returns exactly one `SingleSuggestion` in the `suggestions` list.
- The `explanation` for a distractor (`is_correct=False`) deliberately does not reveal the error.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `req` | `AISuggestionRequest` | Request body | Problem context and mode flag |

**Returns:** `AISuggestionResponse`

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `500` | Any exception from the OpenAI API or JSON parsing (re-raised with the raw exception message) |

---

### `autofill_problem`

```
POST /ai/autofill
(no authentication required)
```

**Purpose:** Accepts raw instructor text and sends it to `gpt-4o-mini` with a detailed system prompt that instructs the model to extract a structured problem schema. The returned JSON is ready to populate all fields in the teacher's problem creation form. If the input is too vague, the model returns an `error` key instead of a problem schema — this is returned as a successful `200` response so the frontend can display the message to the teacher.

**Pre-conditions:**
- `OPENAI_API_KEY` must be configured.
- `req.raw_text.strip()` must be at least 30 characters; shorter input is rejected immediately without calling OpenAI.

**Post-conditions:**
- On sufficient input: returns a JSON object matching the `CreateProblemRequest` shape (title, description, languages, boilerplate, sections, testCases, etc.)
- On insufficient input: returns `{"error": "<human-readable message>"}` with status `200`.
- The `response_format={"type": "json_object"}` parameter guarantees valid JSON from the model.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `req` | `AutofillRequest` | Request body | Raw instructor text to parse |

**Returns:** `dict` — Either a full problem schema or `{"error": str}`.

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `500` | OpenAI API call fails or returns unparseable JSON |

:::note Autofill section rules
The system prompt enforces specific rules for the sections it generates:
- The **first section's** code must begin with the function signature and nothing else.
- All **intermediate sections'** code must be empty strings.
- The **last section's** code must be `"    return None"` so the function is immediately runnable.
- Code inside function bodies must use exactly **4-space indentation**.
- Each section gets exactly **one suggestion** (`isCorrect` varies to create a mix of correct and distractor sections).
:::
