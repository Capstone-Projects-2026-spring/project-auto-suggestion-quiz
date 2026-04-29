---
sidebar_position: 3
title: aiSuggestion.py
description: OpenAI GPT-4o-mini wrapper for generating code suggestions
---

# `aiSuggestion.py` — AI Suggestion Engine

**Source file:** `backend/aiSuggestion.py`

**Purpose:** Wraps the OpenAI Chat Completions API to generate a single code suggestion for a given problem. Depending on the `is_correct` flag, it produces either a correct next line of code or a plausible-but-wrong distractor designed to test critical thinking. Used internally by `routes_ai.py`.

---

## Internal Classes

These classes are defined inside `aiSuggestion()` and used only to structure its return value. They are not exported.

### `_Suggestion`

**Purpose:** Lightweight data container holding one code suggestion and its explanation.

| Field | Type | Purpose |
|-------|------|---------|
| `suggestion` | `str` | The code snippet to show the student |
| `explanation` | `str` | Plain-English explanation of what the code does (deliberately non-revealing when `is_correct=False`) |

**Constructor parameters:**

| Parameter | Type |
|-----------|------|
| `suggestion` | `str` |
| `explanation` | `str` |

---

### `_Response`

**Purpose:** Wraps a list of `_Suggestion` objects to match the shape expected by `AISuggestionResponse` in `routes_ai.py`.

| Field | Type | Purpose |
|-------|------|---------|
| `suggestions` | `list[_Suggestion]` | All suggestions returned for this call (currently always length 1) |

**Constructor parameters:**

| Parameter | Type |
|-----------|------|
| `suggestions` | `list[_Suggestion]` |

---

## Functions

### `aiSuggestion`

```python
def aiSuggestion(currentCode: str, problemPrompt: str, is_correct: bool = True) -> _Response
```

**Purpose:** Sends a system-prompted request to OpenAI's `gpt-4o-mini` model and parses the JSON response into a `_Response` object containing exactly one suggestion.

**Behavior by mode:**

| `is_correct` | Behavior |
|---|---|
| `True` | Generates a **correct** next line of code that logically advances the solution |
| `False` | Generates a **subtly incorrect** line — a plausible logical/algorithmic mistake (wrong operator, off-by-one, wrong variable) with an explanation that deliberately does not reveal the error |

**Pre-conditions:**
- `OPENAI_API_KEY` environment variable must be set to a valid OpenAI API key.
- `currentCode` should be syntactically valid Python (or whatever language the problem uses) up to the current point.
- `problemPrompt` should be the full student-facing problem description so the model has enough context.

**Post-conditions:**
- Returns exactly one suggestion in `_Response.suggestions` (the model is instructed to produce a single-element list).
- The JSON from OpenAI is parsed with `json.loads`; if parsing fails an exception propagates to the caller.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `currentCode` | `str` | — | Code the student has written so far (all sections concatenated) |
| `problemPrompt` | `str` | — | Full problem description shown to the student |
| `is_correct` | `bool` | `True` | Controls whether to generate a correct or distractor suggestion |

**Returns:** `_Response` — Object with a `suggestions` attribute containing one `_Suggestion`.

**Exceptions thrown:**

| Exception | Condition |
|-----------|-----------|
| `openai.AuthenticationError` | `OPENAI_API_KEY` is missing or invalid |
| `openai.RateLimitError` | OpenAI API rate limit exceeded |
| `json.JSONDecodeError` | Model returned a response that is not valid JSON (should not happen with `response_format=json_object`) |
| Any `openai.OpenAIError` subclass | Network error, timeout, or other OpenAI API failure |

:::note
The caller (`routes_ai.get_ai_suggestion`) wraps this in `try/except Exception` and re-raises as `HTTPException(status_code=500)`, so all OpenAI errors surface to the client as a `500` response with the raw error message.
:::
