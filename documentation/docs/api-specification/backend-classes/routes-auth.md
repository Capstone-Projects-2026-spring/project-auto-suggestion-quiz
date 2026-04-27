---
sidebar_position: 4
title: routes_auth.py
description: Authentication routes — register, login, OTP flow
---

# `routes_auth.py` — Authentication Router

**Source file:** `backend/routes_auth.py`  
**Router prefix:** `/auth`  
**Tags:** `auth`

**Purpose:** Manages all user authentication flows. Supports two login mechanisms: (1) email + password for teacher/admin accounts, and (2) a Supabase OTP (magic-link) flow. Returns signed JWTs consumed by all other protected endpoints. A debug-only login endpoint is also provided for local development.

---

## Request / Response Models

### `RegisterRequest`

**Purpose:** Carries the fields needed to create a new teacher or admin account.

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `name` | `str` | ✅ | — | Any non-empty string |
| `email` | `str` | ✅ | — | Must be unique in the `users` table |
| `password` | `str` | ✅ | — | Hashed with SHA-256 before storage |
| `role` | `str` | ❌ | `"teacher"` | Must be `"teacher"` or `"admin"`; raises `400` otherwise |

---

### `LoginRequest`

**Purpose:** Carries credentials for email + password login.

| Field | Type | Required |
|-------|------|----------|
| `email` | `str` | ✅ |
| `password` | `str` | ✅ |

---

### `OtpRequestRequest`

**Purpose:** Carries the email address to which Supabase should send an OTP.

| Field | Type | Required |
|-------|------|----------|
| `email` | `str` | ✅ |

---

### `OtpVerifyRequest`

**Purpose:** Carries the email and the OTP code the teacher received, for verification against Supabase.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `str` | ✅ | Teacher's email address |
| `token` | `str` | ✅ | 6-digit OTP delivered by Supabase |

---

### `UserResponse`

**Purpose:** Serializes a user record for embedding in `AuthResponse`. Never includes the password hash.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Database primary key |
| `name` | `str` | User's display name |
| `email` | `str` | User's email address |
| `role` | `str` | `"student"`, `"teacher"`, or `"admin"` |

---

### `AuthResponse`

**Purpose:** Returned by every successful authentication endpoint. Contains a JWT and the authenticated user's data.

| Field | Type | Description |
|-------|------|-------------|
| `token` | `str` | Signed JWT valid for 30 days |
| `user` | `UserResponse` | Authenticated user's profile |

---

## Route Handlers

### `dev_login`

```
POST /auth/dev-login
```

**Purpose:** Returns a valid JWT for the seeded teacher account without requiring OTP or a password. Intended for local development and automated testing only.

**Pre-conditions:**
- The `DEBUG` environment variable must be set to `"true"` (case-insensitive). If not, this handler returns `404` as if the route does not exist.
- The seed teacher account (`seed@autoquiz.dev`) must exist in the database. If it doesn't, `seed.py` must be run first.

**Post-conditions:**
- Returns an `AuthResponse` for the seed teacher.

**Parameters:** None (no request body).

**Returns:** `AuthResponse`

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `404` | `DEBUG` is not `"true"` in the environment |
| `500` | Seed teacher not found in the database |

---

### `request_otp`

```
POST /auth/otp/request
```

**Purpose:** Forwards an OTP request to Supabase so the teacher receives a magic-link email. Does not interact with the local database.

**Pre-conditions:**
- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` environment variables must be configured.
- The email address must be reachable.

**Post-conditions:**
- On success, Supabase sends an OTP email to the provided address.
- Returns `{"message": "OTP sent"}` with status `200`.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `req` | `OtpRequestRequest` | Request body | Contains the teacher's email |

**Returns:** `dict` — `{"message": "OTP sent"}`

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `500` | `SUPABASE_URL` or `SUPABASE_SERVICE_KEY` not configured |
| `502` | Supabase returned a non-2xx response |

---

### `verify_otp`

```
POST /auth/otp/verify
```

**Purpose:** Verifies the OTP with Supabase. If the email exists in the local database, that user is returned. If not, a new `teacher` account is auto-created. Issues a local JWT.

**Pre-conditions:**
- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` must be configured.
- The OTP must not have expired (Supabase enforces a short expiry window).

**Post-conditions:**
- The user exists in the local `users` table (created if absent).
- A 30-day JWT is issued and returned.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `req` | `OtpVerifyRequest` | Request body | Email + OTP token |

**Returns:** `AuthResponse`

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `401` | Supabase OTP verification failed (invalid or expired token) |
| `500` | Supabase not configured |

---

### `register`

```
POST /auth/register
```

**Purpose:** Creates a new teacher or admin account with a hashed password. This is the password-based alternative to the OTP flow, typically used for admin provisioning.

**Pre-conditions:**
- `req.email` must not already exist in the `users` table.
- `req.role` must be `"teacher"` or `"admin"` — not `"student"`.

**Post-conditions:**
- A new row is inserted into `users` with a SHA-256-hashed password.
- A 30-day JWT is issued and returned.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `req` | `RegisterRequest` | Request body | New user details |

**Returns:** `AuthResponse`

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `400` | `req.role` is not `"teacher"` or `"admin"` |
| `400` | Email address is already registered |

---

### `login`

```
POST /auth/login
```

**Purpose:** Authenticates a teacher or admin using email and password. Verifies the password against the stored SHA-256 hash and issues a JWT.

**Pre-conditions:**
- The user must exist and have a password set (OTP-only accounts may not have one).

**Post-conditions:**
- A 30-day JWT is issued and returned.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `req` | `LoginRequest` | Request body | Email + plain-text password |

**Returns:** `AuthResponse`

**Exceptions thrown:**

| HTTP Status | Condition |
|-------------|-----------|
| `401` | Email not found or password does not match stored hash |
