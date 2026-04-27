---
sidebar_position: 2
title: database.py
description: PostgreSQL connection factory
---

# `database.py` — Database Connection

**Source file:** `backend/database.py`

**Purpose:** Provides a single factory function that creates a new PostgreSQL connection for each request. All route handlers call `get_connection()` at the start of a request and close the connection before returning. Using per-request connections (rather than a shared pool) keeps the implementation simple at the cost of connection overhead; this is acceptable for the current scale of the application.

---

## Dependencies

| Library | Purpose |
|---------|---------|
| `psycopg2` | PostgreSQL adapter for Python |
| `psycopg2.extras.RealDictCursor` | Makes every row return a `dict` keyed by column name instead of a positional tuple |

---

## Functions

### `get_connection`

```python
def get_connection() -> psycopg2.extensions.connection
```

**Purpose:** Opens and returns a new PostgreSQL database connection using the connection string stored in the `DATABASE_URL` environment variable. The cursor factory is set to `RealDictCursor` so that all query results are dictionaries keyed by column name.

**Pre-conditions:**
- The `DATABASE_URL` environment variable must be set to a valid PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/dbname`).
- The PostgreSQL server must be reachable from the host.

**Post-conditions:**
- A live, open connection is returned. The caller is responsible for calling `conn.close()` after use to prevent connection leaks.
- All cursors created from the returned connection will return rows as `dict` objects (via `RealDictCursor`).

**Parameters:** None.

**Returns:** `psycopg2.extensions.connection` — An open database connection.

**Exceptions thrown:**

| Exception | Condition |
|-----------|-----------|
| `KeyError` | `DATABASE_URL` is not set in the environment |
| `psycopg2.OperationalError` | The database server is unreachable, credentials are wrong, or the database name does not exist |

:::note
Every route handler that calls `get_connection()` wraps database work in a `try/except` block and calls `conn.close()` — or `conn.rollback(); conn.close()` on error — to ensure the connection is always released.
:::
