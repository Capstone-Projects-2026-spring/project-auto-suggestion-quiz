---
sidebar_position: 1
title: auth.py
description: JWT creation/verification and password hashing utilities
---

# `auth.py` — Authentication Utilities

**Source file:** `backend/auth.py`

**Purpose:** Provides stateless authentication helpers used across all route files. Handles password hashing with SHA-256 and JWT creation/verification with the `PyJWT` library. No database calls are made here — this module is purely computational.

---

## Module-Level Constants

| Name | Type | Default | Purpose |
|------|------|---------|---------|
| `SECRET_KEY` | `str` | `"dev-secret-key-change-in-production"` | HMAC signing key read from the `SECRET_KEY` environment variable. Must be changed to a strong random value in production. |
| `ALGORITHM` | `str` | `"HS256"` | JWT signing algorithm (HMAC-SHA256). |
| `TOKEN_LIFETIME_DAYS` | `int` | `30` | Number of days before a token expires. |

---

## Functions

### `hash_password`

```python
def hash_password(password: str) -> str
```

**Purpose:** Deterministically hashes a plain-text password using SHA-256 so it can be stored safely in the database.

**Pre-conditions:**
- `password` must be a non-empty string.

**Post-conditions:**
- Returns the same hex digest for the same input on every call (no salt). This means the same password always produces the same hash.

| Parameter | Type | Description |
|-----------|------|-------------|
| `password` | `str` | Plain-text password to hash |

**Returns:** `str` — 64-character lowercase hex digest of the SHA-256 hash.

**Exceptions thrown:** None.

---

### `verify_password`

```python
def verify_password(password: str, hashed: str) -> bool
```

**Purpose:** Checks whether a plain-text password matches a stored SHA-256 hash by re-hashing and comparing.

**Pre-conditions:**
- `hashed` must have been produced by `hash_password`.

**Post-conditions:**
- Returns `True` if and only if `hash_password(password) == hashed`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `password` | `str` | Plain-text password to verify |
| `hashed` | `str` | Previously stored SHA-256 hex digest |

**Returns:** `bool` — `True` if passwords match, `False` otherwise.

**Exceptions thrown:** None.

---

### `create_token`

```python
def create_token(user_id: int, email: str, role: str) -> str
```

**Purpose:** Encodes user identity information into a signed JWT that the client stores and sends on subsequent requests.

**Pre-conditions:**
- `SECRET_KEY` environment variable should be set to a strong value in production.
- `role` should be one of `"student"`, `"teacher"`, or `"admin"`.

**Post-conditions:**
- Returns a token that expires exactly `TOKEN_LIFETIME_DAYS` (30) days from the time of creation.
- The token payload contains `user_id`, `email`, `role`, and `exp`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | `int` | User's primary key in the `users` table |
| `email` | `str` | User's email address (embedded in payload for convenience) |
| `role` | `str` | User's role string (`"teacher"`, `"admin"`, etc.) |

**Returns:** `str` — Signed JWT string in the format `header.payload.signature`.

**Exceptions thrown:** None under normal operation. `jwt.PyJWTError` may propagate if the signing key is malformed (environment misconfiguration).

---

### `decode_token`

```python
def decode_token(token: str) -> dict
```

**Purpose:** Validates a JWT's signature and expiry, then returns the payload so route handlers can read `user_id`, `email`, and `role`.

**Pre-conditions:**
- `token` must be a string previously produced by `create_token`.
- The `SECRET_KEY` environment variable must match the one used when the token was signed.

**Post-conditions:**
- If successful, returns the full decoded payload dictionary.

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | `str` | JWT string extracted from the `Authorization: Bearer <token>` header |

**Returns:** `dict` — Decoded payload with keys `user_id` (int), `email` (str), `role` (str), `exp` (int timestamp).

**Exceptions thrown:**

| Exception | Condition |
|-----------|-----------|
| `jwt.ExpiredSignatureError` | The token's `exp` claim is in the past |
| `jwt.InvalidTokenError` | The signature is wrong, the token is malformed, or the key doesn't match |
