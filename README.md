<div align="center">

# Autosuggestion Quiz
[![Report Issue on Jira](https://img.shields.io/badge/Report%20Issues-Jira-0052CC?style=flat&logo=jira-software)](https://temple-cis-projects-in-cs.atlassian.net/jira/software/c/projects/ASQ/issues)
[![Deploy Docs](https://github.com/Capstone-Projects-2026-spring/project-auto-suggestion-quiz/actions/workflows/deploy.yml/badge.svg)](https://github.com/Capstone-Projects-2026-spring/project-auto-suggestion-quiz/actions/workflows/deploy.yml)
[![Documentation Website Link](https://img.shields.io/badge/-Documentation%20Website-brightgreen)](https://capstone-projects-2026-spring.github.io/project-auto-suggestion-quiz/)


</div>


## Keywords

AI suggested code, quizzes, educational, leetcode, practice

## Project Abstract

AutoSuggestion Quiz is a web-based educational application that helps students develop critical thinking skills when working with AI-generated code commonly found in modern IDEs. Teachers create and upload quizzes, and students can write and run code directly in the platform while answering by selecting from multiple-choice code suggestions. After submission, teachers can score responses and provide feedback. This format encourages students to question AI-generated code and builds confidence in tackling complex programming problems.

## High Level Requirement

Describe the requirements – i.e., what the product does and how it does it from a user point of view – at a high level.

## Conceptual Design

The frontend is built with React (Create React App), providing a Monaco editor-based coding environment where students write and run Python code directly in the browser using Pyodide. The backend is implemented in Python using FastAPI, which handles teacher authentication, problem management, AI suggestion generation, and submission storage. The database is PostgreSQL hosted on Supabase. AI code suggestions are generated via the OpenAI API (GPT-4o mini). OTP-based teacher authentication is handled through Supabase's email auth service.

## Background

AutoSuggestion Quiz (ASQ) was created to address the problem of students accepting AI-suggested code without fully understanding it. Many students rely on these suggestions because they are unsure how to approach LeetCode-style questions, which can often be challenging.

ASQ helps solve this issue by presenting students with options for the next line of auto-suggested code. This gives them direction while encouraging them to think critically about how to solve the problem and evaluate AI-generated suggestions. After a code option is selected, an explanation is provided to clarify why the AI suggested that code.

ASQ also supports teachers by allowing them to upload problems and give students opportunities to practice solving challenging coding tasks. In this way, ASQ helps students build confidence, improve problem-solving skills, and develop a deeper understanding of the code they use.

## Required Resources

- Windows 11 / macOS
- Internet access
- [Node.js](https://nodejs.org) v16+
- [Python](https://www.python.org) 3.10+
- A free [Supabase](https://supabase.com) account (PostgreSQL database and OTP auth)
- An [OpenAI API key](https://platform.openai.com/api-keys) for AI code suggestions

---

## Running Locally

For full setup instructions including Supabase configuration, schema SQL, environment variables, and how to run all tests, see [LOCAL_SETUP.md](./LOCAL_SETUP.md).
### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows
pip install -r requirements.txt
```

**Environment variables**

Copy the template and fill in your values:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env`:

| Variable | Description | Required |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key for AI code suggestions | **Yes** |
| `DATABASE_URL` | PostgreSQL connection string for the backend database | **Yes** |
| `DEBUG` | Set to `True` in development | No |
| `SUPABASE_URL` | Your Supabase project URL | Only for OTP login |
| `SUPABASE_SERVICE_KEY` | Your Supabase anon/service key | Only for OTP login |
| `JUDGE0_URL` | Judge0 base URL, for example `http://localhost:2358` | For code execution |
| `JUDGE0_AUTH_TOKEN` | Optional auth token for a protected Judge0 instance | No |

**Start the server**

```bash
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`. The database is **created and seeded automatically** on first startup — no manual migration needed. A seed teacher (`seed@autoquiz.dev`) and a sample problem (access code `123456`) are added when the database is empty.

### Self-Hosted Compiler With Docker

The backend uses a local Judge0 CE instance for code execution. This keeps the existing `/code/execute` backend endpoint the same while moving compilation and execution onto your machine.

Docker Desktop must already be installed and running before you start Judge0. The helper scripts manage the local Judge0 stack, but they do not install Docker for you.

Start Judge0 locally:

```bash
./scripts/start_judge0.sh
```

Then set `JUDGE0_URL=http://localhost:2358` in `backend/.env` and start the backend normally.

Stop Judge0 when you are done:

```bash
./scripts/stop_judge0.sh
```

If Judge0 starts successfully but code execution still fails, reset the local Judge0 volumes and start again:

```bash
./scripts/stop_judge0.sh
cd .judge0/judge0-v1.13.1 && docker compose down -v
cd ../..
./scripts/start_judge0.sh
```

## Mac

For macOS users setting up Judge0:
You may need to change a Docker settings file if Docker and Judge0 are incompatible on your machine.

To start, close docker and every instance of it currently running.

You will need to locate the settings-store.json for docker in order to use the deprecatedCgroupv1.

In Terminal:

```bash
open -a TextEdit "/Users/[Your Computer Name]/Library/Group Containers/group.com.docker/settings-store.json"
```

Then replace the file contents with:

```json
{
  "AutoStart": false,
  "DisplayedOnboarding": true,
  "DockerAppLaunchPath": "/Applications/Docker.app",
  "EnableDockerAI": true,
  "LastContainerdSnapshotterEnable": 1773866500,
  "LicenseTermsVersion": 2,
  "SettingsVersion": 43,
  "ShowInstallScreen": false,
  "UseContainerdSnapshotter": true,
  "deprecatedCgroupv1": true
}
```

Reopen Docker, and the app should be able to reach Judge0.

---

### Frontend

```bash
cd frontend
npm install
```

> **Optional:** If your backend is not on the default port, create `frontend/.env` and set `REACT_APP_API_URL=http://localhost:<your_port>`. Otherwise no `.env` is needed.

**Start the app**

```bash
npm start
```

The app opens at `http://localhost:3000`.

---

### Supabase / OTP Login

All Supabase communication happens on the **backend** — the frontend does not need any Supabase credentials. To enable OTP email login:

1. Create a free account at [supabase.com](https://supabase.com).
2. Create a new project.
3. Go to **Project Settings → API**.
4. Copy the **Project URL** → paste as `SUPABASE_URL` in `backend/.env`.
5. Copy the **anon / public** key → paste as `SUPABASE_SERVICE_KEY` in `backend/.env`.

**Dev bypass — no Supabase account needed**

On the login page, enter `dev` as the email and click **Send OTP**. This skips Supabase entirely and signs you in as the seed teacher (`seed@autoquiz.dev`) without sending any email. This only works when `DEBUG=True` is set in `backend/.env`.

---

## Testing

### Backend

Make sure the virtual environment is activated, then run:

```bash
cd backend
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows
pytest backUnitTest/
```

### Frontend

```bash
cd frontend
npm test
```

Press `a` to run all tests.

---

## First Release

Live app: https://autosuggestions.onrender.com/

## Features
  - Teachers can create an account by entering their email and receiving a one-time password.
  - Teachers can access their dashboard and create problems by providing a problem prompt and boilerplate code for the student to start with.
  - Teachers will receive a one-time password after creating a problem. Save this password to distribute to students.
  - Students can access their problems by using the one-time password for the assignment (one-time password provided by the teacher).
  - Students can attempt a problem and will be prompted with AI suggestions whenever they are inactive for a short period of time.
  - Python is the only language available currently.

## Collaborators
Bwosley
Temi Raymond
Yong Huang
Ethan Friedman
Henry Le
Aidan McCammitt


