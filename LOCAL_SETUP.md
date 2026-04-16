# ASQ: Local Setup & Testing Guide

This guide covers everything needed to run AutoSuggestion Quiz on your local machine after downloading the source code from the release. It covers Supabase setup, environment configuration, starting the backend and frontend, and running all tests.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Supabase Setup](#2-supabase-setup)
3. [Backend Setup](#3-backend-setup)
4. [Frontend Setup](#4-frontend-setup)
5. [Running the Application](#5-running-the-application)
6. [Running Tests](#6-running-tests)
7. [Dev Login Bypass](#7-dev-login-bypass-no-otp-email-needed)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

Install the following before continuing:

| Tool | Minimum Version | Download |
|---|---|---|
| Node.js | v16+ | https://nodejs.org |
| Python | 3.10+ | https://www.python.org |

You will also need:

- A free [Supabase](https://supabase.com) account (for the PostgreSQL database and OTP authentication)
- An [OpenAI API key](https://platform.openai.com/api-keys) (for AI code suggestions)

> **Windows note:** Use PowerShell or Git Bash for all commands below. Anywhere you see `python3`, use `python` instead on Windows.

---

## 2. Supabase Setup

ASQ uses Supabase for both its PostgreSQL database and OTP email authentication. All Supabase communication happens on the backend; the frontend requires no Supabase credentials.

### 2.1 Create a Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**, choose an organization, and give the project a name (e.g., `asq-local`).
3. Set a strong **database password** and save it. You will need it for the connection string.
4. Wait for the project to finish provisioning (approximately one minute).

### 2.2 Collect Your Credentials

**Project URL and anon key:**

Go to **Project Settings → API** and copy:
- The **Project URL** (e.g., `https://abcdefgh.supabase.co`)
- The **anon / public** key

**Database connection string:**

Go to **Project Settings → Database → Connection string → URI**.
Select the **Session pooler** tab (port `5432`). The URI looks like:

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

Replace `[password]` with the database password you set in step 2.1.

### 2.3 Create the Schema

Open the **SQL Editor** in the Supabase dashboard and run the following SQL in full. This creates every table the application depends on.

```sql
-- users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT DEFAULT 'teacher',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Problems
CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    access_code TEXT UNIQUE NOT NULL,
    boilerplate TEXT DEFAULT '',
    language TEXT DEFAULT 'python',
    languages TEXT DEFAULT '["python"]',
    time_limit_minutes INTEGER,
    max_attempts INTEGER,
    allow_copy_paste BOOLEAN DEFAULT TRUE,
    track_tab_switching BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sections (ordered blocks within a problem)
CREATE TABLE IF NOT EXISTS sections (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    label TEXT NOT NULL,
    code TEXT DEFAULT '{}'
);

-- Suggestions for a section (correct or distractor)
CREATE TABLE IF NOT EXISTS suggestions (
    id SERIAL PRIMARY KEY,
    section_id INTEGER REFERENCES sections(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT TRUE,
    source TEXT DEFAULT 'ai'
);

-- Test cases for a problem
CREATE TABLE IF NOT EXISTS test_cases (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT DEFAULT '',
    expected TEXT DEFAULT '',
    explanation TEXT DEFAULT ''
);

-- Student sessions (in-progress and submitted)
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id),
    student_name TEXT,
    code TEXT,
    suggestion_log TEXT DEFAULT '[]',
    tab_switch_log TEXT DEFAULT '[]',
    test_results TEXT DEFAULT '[]',
    score INTEGER,
    total INTEGER,
    started_at TIMESTAMP DEFAULT NOW(),
    submitted_at TIMESTAMP
);
```

> You do not need to run any migration scripts from the source code. The schema is managed entirely through the Supabase SQL editor.

### 2.4 Configure OTP Authentication (Optional for Dev)

> **Having auth issues or just want to skip email setup?** You can log in without any OTP email by entering `dev` as the email address on the login page. See [Section 7](#7-dev-login-bypass-no-otp-email-needed) for full details.

If you want real OTP emails to work rather than using the dev bypass (see Section 7):

1. In the Supabase dashboard, go to **Authentication → Providers → Email**.
2. Confirm **Enable Email Provider** is turned on.
3. Set **Confirm email** to **off**. Otherwise, first-time OTP sign-ups require an extra confirmation step that breaks the login flow.
4. Under **Authentication → URL Configuration**, set **Site URL** to `http://localhost:3000`.



---

## 3. Backend Setup

### 3.1 Create a Virtual Environment

A virtual environment keeps ASQ's Python dependencies isolated from your system Python installation. It is strongly recommended, and essential if you have other Python projects on the same machine.

**macOS / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
```

Your terminal prompt will show `(venv)` when the environment is active. Run `deactivate` at any time to exit it. All subsequent backend commands assume the venv is active.

### 3.2 Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:

| Package | Purpose |
|---|---|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `psycopg2-binary` | PostgreSQL driver (connects to Supabase) |
| `python-dotenv` | Loads the `.env` file |
| `openai` | OpenAI API client for AI suggestions |
| `pyjwt` | JWT creation and validation |
| `httpx` | Async HTTP client |
| `pytest` / `pytest-cov` | Test runner and coverage reporting |

> **macOS note:** `psycopg2-binary` is self-contained and does not require a separate PostgreSQL installation. If you see a build error, confirm you are installing from `requirements.txt` as-is.

### 3.3 Configure Environment Variables

From inside the `backend/` directory, copy the example file:

**macOS / Linux:**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

Open `backend/.env` and fill in your values:

```env
# Supabase PostgreSQL connection string (Session pooler URI, port 5432)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Supabase project URL and anon key (from Project Settings → API)
SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_SERVICE_KEY=your-anon-public-key

# JWT signing secret (any long random string is fine for local development)
SECRET_KEY=change-me-in-production

# Set to True to enable the dev login bypass endpoint
DEBUG=True

# Your OpenAI API key
OPENAI_API_KEY=sk-...
```

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | **Yes** | Supabase Session pooler URI |
| `SUPABASE_URL` | **Yes** | Required for OTP authentication |
| `SUPABASE_SERVICE_KEY` | **Yes** | Supabase anon / public key |
| `SECRET_KEY` | **Yes** | Any random string works locally |
| `DEBUG` | No | Set `True` to enable dev login |
| `OPENAI_API_KEY` | **Yes** | Required for AI suggestions |

---

## 4. Frontend Setup

Open a **new terminal** (keep the backend terminal running separately).

```bash
cd frontend
npm install
```

This installs React, the Monaco editor component, and all testing libraries declared in `package.json`. It may take a minute on first run.

**Optional: Custom backend port**

If you changed the backend to a port other than `8000`, create `frontend/.env` and add:

```env
REACT_APP_API_URL=http://localhost:<your_port>
```

No frontend `.env` file is needed if you are using the default port `8000`.

---

## 5. Running the Application

You need two terminals running simultaneously: one for the backend, one for the frontend.

### Terminal 1: Backend

```bash
cd backend
source venv/bin/activate    # macOS/Linux
# venv\Scripts\activate     # Windows

uvicorn main:app --reload
```

The API starts at **http://localhost:8000**.

On first startup, the server automatically seeds the database with a default teacher account and sample problem, but only if the `teachers` table is empty. The seed data is:

- Teacher email: `seed@autoquiz.dev`
- Sample problem access code: `123456`

You can browse the interactive API documentation at **http://localhost:8000/docs**.

### Terminal 2: Frontend

```bash
cd frontend
npm start
```

The app opens automatically at **http://localhost:3000**.

---

## 6. Running Tests

### 6.1 Backend Tests

The backend test suite lives in `backend/backUnitTest/` and is divided into three groups:

| Suite | Location | Covers |
|---|---|---|
| AI tests | `backUnitTest/backAiTest/` | AI suggestion generation, response format, token handling |
| Auth tests | `backUnitTest/backAuthTest/` | Auth routes, login, and registration |
| Login tests | `backUnitTest/backLoginTest/` | Login flow end-to-end |

**You must run pytest from the project root**, not from inside `backend/`. The `PYTHONPATH` must be set to the root so that inter-module imports resolve correctly.

**macOS / Linux:**
```bash
# From the project root directory (project-auto-suggestion-quiz/)
PYTHONPATH=. python3 -m pytest backend/backUnitTest/ -v
```

**Windows (PowerShell):**
```powershell
# From the project root directory (project-auto-suggestion-quiz/)
$env:PYTHONPATH="."
python -m pytest backend/backUnitTest/ -v
```

> **Note:** Running `pytest` from inside `backend/` without setting `PYTHONPATH` will cause `ModuleNotFoundError`. Always run from the project root as shown above.

**Generate an HTML coverage report:**

```bash
# macOS/Linux, from the project root
PYTHONPATH=. python3 -m pytest backend/backUnitTest/ -v --cov=backend --cov-report=html
```

The report is written to `htmlcov/index.html`. Open that file in a browser to see line-by-line coverage across all backend modules.

### 6.2 Frontend Tests

```bash
cd frontend
npm test
```

Jest starts in interactive watch mode. Press `a` to run all tests, or `q` to quit.

The test suite uses **React Testing Library** (`@testing-library/react`) and **jest-dom** (`@testing-library/jest-dom`), both already installed by `npm install`.

**Run tests once, non-interactively** (useful for CI or peer review):

```bash
cd frontend
CI=true npm test
```

---

## 7. Dev Login Bypass (No OTP Email Needed)

If you do not have a working Supabase SMTP setup, you can still sign in as the seed teacher without receiving an OTP email.

1. Make sure `DEBUG=True` is set in `backend/.env`.
2. Start the backend and frontend as described in Section 5.
3. On the login page, enter `dev` as the email address.
4. Click **Send OTP**. No email is sent and no Supabase call is made.
5. You are signed in immediately as `seed@autoquiz.dev`.

> This endpoint (`/auth/dev-login`) is completely disabled when `DEBUG` is `False` or not set. Never enable it in a production deployment.

---

## 8. Troubleshooting

**`psycopg2` connection error on startup**

Verify that `DATABASE_URL` in `backend/.env` is the Session pooler URI (port `5432`) with the correct password filled in. Do not use the "Direct connection" URI; it uses a different hostname format and may not be reachable from all networks.

**`ModuleNotFoundError` when running pytest**

You are running pytest from inside `backend/` without `PYTHONPATH` set. Run from the project root with `PYTHONPATH=.` as shown in Section 6.1.

**OTP emails are not arriving**

Use the dev login bypass (Section 7) during development to avoid waiting on email delivery.

**`npm install` fails with node-gyp errors**

Confirm you are on Node.js v16 or later (`node --version`). On macOS, Xcode Command Line Tools may be required:

```bash
xcode-select --install
```

**Frontend cannot reach the backend**

Confirm the backend is running. `http://localhost:8000/docs` should load. If you changed the backend port, set `REACT_APP_API_URL` in `frontend/.env` as described in Section 4.

**Seed data does not appear after first startup**

The seed runs only once, when the `teachers` table is empty. If you started the server before the schema was created, drop and recreate the tables using the SQL in Section 2.3, then restart the server.
