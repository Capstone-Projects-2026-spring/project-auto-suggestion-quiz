---
sidebar_position: 9
title: routes_judge.py
description: Remote code execution via Judge0
---

# `routes_judge.py` — Code Execution Router

**Source file:** `backend/routes_judge.py`  
**Router prefix:** `/code`  
**Tags:** `code`

**Purpose:** Provides a single endpoint that compiles and runs student code by proxying to a self-hosted Judge0 instance. The backend handles Base64 encoding/decoding of source code and stdin/stdout so the frontend only deals with plain strings. Supports Python, JavaScript, C, and Java.

---

## Module-Level Constants

### `LANGUAGE_IDS`

**Purpose:** Maps human-readable language names to Judge0 language IDs used in the submission payload.

| Key | Value | Language |
|-----|-------|----------|
| `"python"` | `71` | Python 3 |
| `"javascript"` | `63` | Node.js |
| `"c"` | `50` | GCC C |
| `"java"` | `62` | OpenJDK Java |

---

## Request / Response Models

### `CodeExecutionRequest`

**Purpose:** Carries the source code, target language, and optional stdin to submit to Judge0.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `code` | `str` | ✅ | — | Full source code to compile and run |
| `language` | `str` | ✅ | — | One of `"python"`, `"javascript"`, `"c"`, `"java"` |
| `input` | `str` | ❌ | `""` | Data piped to the program's stdin |

---

### `CodeExecutionResponse`

**Purpose:** Returns the program's stdout and any error output.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `output` | `str` | — | Program stdout (decoded from Base64) |
| `error` | `str` | `""` | stderr, compile errors, or non-Accepted Judge0 status message |

---

## Helper Functions

### `build_judge0_headers`

```python
def build_judge0_headers() -> dict[str, str]
```

**Purpose:** Constructs the HTTP headers for Judge0 API requests. Always includes `Content-Type: application/json`. Adds `X-Auth-Token` only when the `JUDGE0_AUTH_TOKEN` environment variable is set (required for authenticated Judge0 instances).

**Parameters:** None.

**Returns:** `dict[str, str]` — Header dictionary for use with `httpx`.

**Exceptions thrown:** None.

---

### `decode_judge0_field`

```python
def decode_judge0_field(value: str | None) -> str
```

**Purpose:** Safely decodes a Base64-encoded string returned by Judge0 (stdout, stderr, compile output). Returns an empty string if the value is `None` or empty.

**Pre-conditions:**
- `value` is either `None` or a Base64-encoded ASCII string as returned by Judge0's `base64_encoded=true` mode.

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `str \| None` | Base64 string from Judge0 response, or `None` |

**Returns:** `str` — Decoded UTF-8 string, or `""` if input is falsy.

**Exceptions thrown:** None — `binascii.Error` and `ValueError` are caught internally; on failure the raw value is returned as-is.

---

### `encode_judge0_field`

```python
def encode_judge0_field(value: str) -> str
```

**Purpose:** Encodes a plain-text string to Base64 ASCII for submission to Judge0's `base64_encoded=true` API.

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `str` | Plain text to encode (source code or stdin) |

**Returns:** `str` — Base64-encoded ASCII string.

**Exceptions thrown:** None.

---

## Route Handlers

### `execute_code`

```
POST /code/execute
(no authentication required)
```

**Purpose:** Submits source code to the configured Judge0 instance in synchronous (`wait=true`) mode and returns the execution result. The flow is:
1. Encode `req.code` and `req.input` to Base64.
2. POST to `{JUDGE0_URL}/submissions?base64_encoded=true&wait=true`.
3. Decode `stdout`, `stderr`, `compile_output`, and `message` from the response.
4. Return stdout as `output` and the first non-empty error field as `error`.

**Pre-conditions:**
- `JUDGE0_URL` environment variable must be set to the base URL of the Judge0 instance.
- `req.language` must be one of the four supported languages in `LANGUAGE_IDS`.
- The Judge0 instance must be reachable from the server.

**Post-conditions:**
- On success: `output` contains stdout; `error` is empty or contains stderr/compile errors.
- If the Judge0 `status.description` is anything other than `"Accepted"` and no stderr was returned, the status description is placed in `error` (e.g. `"Time Limit Exceeded"`, `"Runtime Error"`).

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `req` | `CodeExecutionRequest` | Request body | Source code, language, and optional stdin |

**Returns:** `CodeExecutionResponse`

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `400` | `req.language` is not in `LANGUAGE_IDS` |
| `500` | `JUDGE0_URL` environment variable is not set |
| `502` | Judge0 returned a non-2xx HTTP response (`httpx.HTTPStatusError`) |
| `500` | Any other exception during the HTTP request or response parsing |
