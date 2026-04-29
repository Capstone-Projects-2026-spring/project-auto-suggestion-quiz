---
sidebar_position: 4
---

# Sequence diagrams

These diagrams align with [Use-case descriptions](../requirements/use-case-descriptions): **seven** teacher use cases (numbered **1–7**) and **nine** student use cases (numbered **1–9**), for **sixteen** diagrams total.

| # | Flow |
|---|------|
| [T1](#teacher-uc-1) | Teacher - Use Case 1 - Account Creation |
| [T2](#teacher-uc-2) | Teacher - Use Case 2 - Signing In |
| [T3](#teacher-uc-3) | Teacher - Use Case 3 - Uploading Leetcode Problems |
| [T4](#teacher-uc-4) | Teacher - Use Case 4 - Publishing Problems |
| [T5](#teacher-uc-5) | Teacher - Use Case 5 - Navigating Dashboard |
| [T6](#teacher-uc-6) | Teacher - Use Case 6 - Deleting a Question from a Quiz |
| [T7](#teacher-uc-7) | Teacher - Use Case 7 - Changing a Grade for a Student |
| [S1](#student-uc-1) | Student - Use Case 1 - Student Creates an Account |
| [S2](#student-uc-2) | Student - Use Case 2 - Student Joins a Class Using an Access Code |
| [S3](#student-uc-3) | Student - Use Case 3 - Student Views Dashboard |
| [S4](#student-uc-4) | Student - Use Case 4 - Student Begins a Coding Problem |
| [S5](#student-uc-5) | Student - Use Case 5 - Student Receives and Selects Auto Code Suggestions |
| [S6](#student-uc-6) | Student - Use Case 6 - Student Runs Code to View Output |
| [S7](#student-uc-7) | Student - Use Case 7 - Student Submits Completed Work |
| [S8](#student-uc-8) | Student - Use Case 8 - Student Saves Progress and Returns Later |
| [S9](#student-uc-9) | Student - Use Case 9 - Student Reviews Completed Problems and Grades |

---

## Teacher Use Case 1 - Account Creation {#teacher-uc-1}

```mermaid
sequenceDiagram
  actor Teacher
  participant FE as Frontend
  participant API as Backend
  participant SUPA as Supabase Auth
  participant DB as PostgreSQL

  Teacher->>FE: Open app, teacher mode, enter email
  FE->>API: POST /auth/otp/request
  API->>SUPA: Send OTP
  SUPA-->>Teacher: OTP email
  Teacher->>FE: Enter OTP
  FE->>API: POST /auth/otp/verify
  API->>SUPA: Verify OTP
  API->>DB: Find or insert user
  API-->>FE: JWT + user
  FE-->>Teacher: Dashboard
```

---

## Teacher Use Case 2 - Signing In {#teacher-uc-2}

```mermaid
sequenceDiagram
  actor Teacher
  participant FE as Frontend
  participant API as Backend
  participant DB as PostgreSQL

  Teacher->>FE: Enter email + password
  FE->>API: POST /auth/login
  API->>DB: Load user, verify password
  alt Valid
    API-->>FE: JWT + user
    FE-->>Teacher: Dashboard
  else Invalid
    API-->>FE: 401
    FE-->>Teacher: Error message
  end
```

---

## Teacher Use Case 3 - Uploading Leetcode Problems {#teacher-uc-3}

```mermaid
sequenceDiagram
  actor Teacher
  participant FE as Frontend
  participant API as Backend
  participant AI as OpenAI
  participant DB as PostgreSQL

  Teacher->>FE: Open create problem / upload flow
  opt Autofill from pasted material
    Teacher->>FE: Paste raw problem text
    FE->>API: POST /ai/autofill
    API->>AI: Parse into problem JSON
    AI-->>API: Structured fields
    API-->>FE: Prefill form
  end
  Teacher->>FE: Enter sections, suggestions, tests, restrictions
  FE->>API: POST /problems/
  API->>DB: Insert problem, sections, suggestions, test_cases
  API-->>FE: Created problem + access_code
```

---

## Teacher Use Case 4 - Publishing Problems {#teacher-uc-4}

```mermaid
sequenceDiagram
  actor Teacher
  participant FE as Frontend
  participant API as Backend
  participant DB as PostgreSQL

  Note over Teacher,DB: Publishing succeeds when the problem save succeeds. The access code is returned on create.

  Teacher->>FE: Save / publish problem
  FE->>API: POST /problems/
  API->>DB: Validate and persist
  alt Complete valid payload
    API-->>FE: 200 + access_code
    FE-->>Teacher: Success + shareable key
  else Validation / DB error
    API-->>FE: 4xx/5xx
    FE-->>Teacher: Incomplete or error message
  end
```

---

## Teacher Use Case 5 - Navigating Dashboard {#teacher-uc-5}

```mermaid
sequenceDiagram
  actor Teacher
  participant FE as Frontend
  participant API as Backend
  participant DB as PostgreSQL

  Teacher->>FE: Open dashboard / student progress
  FE->>API: GET /problems/
  API->>DB: Problems + submissions aggregate
  API-->>FE: List with submission rows
  Teacher->>FE: Enter grade, save
  FE->>API: POST /problems/:problemId/grade
  API->>DB: Update session score / total
  API-->>FE: Grade saved
  FE-->>Teacher: Confirmation
```

---

## Teacher Use Case 6 - Deleting a Question from a Quiz {#teacher-uc-6}

```mermaid
sequenceDiagram
  actor Teacher
  participant FE as Frontend
  participant API as Backend
  participant DB as PostgreSQL

  Teacher->>FE: Choose problem to delete, confirm
  FE->>API: DELETE /problems/:problemId
  API->>DB: Delete problem (and dependent rows per DB rules)
  API-->>FE: 204 No Content
  FE-->>Teacher: Success notification
```

---

## Teacher Use Case 7 - Changing a Grade for a Student {#teacher-uc-7}

```mermaid
sequenceDiagram
  actor Teacher
  participant FE as Frontend
  participant API as Backend
  participant DB as PostgreSQL

  Teacher->>FE: Open same submission as before
  FE->>API: GET /problems/
  API-->>FE: Current submissions + grades
  Teacher->>FE: Edit grade, save again
  FE->>API: POST /problems/:problemId/grade
  Note over API: Same endpoint as first grade. New score overwrites session fields.
  API->>DB: UPDATE sessions SET score, total
  API-->>FE: Updated grade
```

---

## Student Use Case 1 - Student Creates an Account {#student-uc-1}

```mermaid
sequenceDiagram
  actor Student
  participant FE as Frontend
  participant API as Backend

  Student->>FE: Open sign-up, enter name, email, password
  Student->>FE: Submit create account
  FE->>API: Register new student account
  alt Success
    API-->>FE: Account created
    FE-->>Student: Navigate to login
  else Validation error
    API-->>FE: Error
    FE-->>Student: Show message, stay on form
  end
```

---

## Student Use Case 2 - Student Joins a Class Using an Access Code {#student-uc-2}

```mermaid
sequenceDiagram
  actor Student
  participant FE as Frontend
  participant API as Backend
  participant DB as PostgreSQL

  Student->>FE: Enter display name + 6-digit access code
  FE->>API: GET /problems/access/:code
  API->>DB: Lookup problem by access_code
  alt Valid code
    API-->>FE: Problem definition
    FE->>API: POST /submissions/start
    API->>DB: New or resume session
    API-->>FE: session_id (+ draft if any)
    FE-->>Student: Problem workspace
  else Invalid code
    API-->>FE: 404
    FE-->>Student: Error message
  end
```

---

## Student Use Case 3 - Student Views Dashboard {#student-uc-3}

```mermaid
sequenceDiagram
  actor Student
  participant FE as Frontend
  participant API as Backend

  Note over Student,API: After opening a problem, the client holds context. Listing assignments may be client-only until more problems are linked.

  Student->>FE: Return to home / problem list view
  FE-->>Student: Show in-progress or completed state from client store
  opt Refresh problem from server
    FE->>API: GET /problems/access/:code
    API-->>FE: Latest problem metadata
  end
```

---

## Student Use Case 4 - Student Begins a Coding Problem {#student-uc-4}

```mermaid
sequenceDiagram
  actor Student
  participant FE as Frontend
  participant API as Backend

  Student->>FE: Land on problem page
  FE->>FE: Load Monaco + starter sections
  alt Session had draft
    FE-->>Student: Restore draft code from start response
  else New session
    FE-->>Student: Empty or boilerplate starter
  end
  Student->>FE: Begin typing in editor
```

---

## Student Use Case 5 - Student Receives and Selects Auto Code Suggestions {#student-uc-5}

```mermaid
sequenceDiagram
  actor Student
  participant FE as Editor
  participant API as Backend
  participant AI as OpenAI

  Student->>FE: Pause typing
  FE->>API: POST /ai/suggestion
  API->>AI: Generate suggestions
  AI-->>API: Suggestions + explanations
  API-->>FE: Suggestion list
  Student->>FE: Select suggestion
  FE->>FE: Insert text + log acceptance client-side
```

---

## Student Use Case 6 - Student Runs Code to View Output {#student-uc-6}

```mermaid
sequenceDiagram
  actor Student
  participant FE as Frontend
  participant API as Backend
  participant J0 as Judge0

  Student->>FE: Run code / run tests

  alt Python
    FE->>FE: Pyodide run
    FE-->>Student: Output or errors
  else Other language
    FE->>API: POST /code/execute
    API->>J0: Execute
    J0-->>API: stdout / stderr
    API-->>FE: Output or errors
  end
```

---

## Student Use Case 7 - Student Submits Completed Work {#student-uc-7}

```mermaid
sequenceDiagram
  actor Student
  participant FE as Frontend
  participant API as Backend
  participant DB as PostgreSQL

  Student->>FE: Click Submit
  FE->>API: POST /submissions/:sessionId/submit
  Note over FE,API: suggestion_log, tab_switch_log, test_results, paste_log, final code
  API->>DB: Set submitted_at + logs
  alt OK
    API-->>FE: Submitted
    FE-->>Student: Redirect / confirmation
  else Limit exceeded
    API-->>FE: 403
    FE-->>Student: Limit message
  end
```

---

## Student Use Case 8 - Student Saves Progress and Returns Later {#student-uc-8}

```mermaid
sequenceDiagram
  actor Student
  participant FE as Frontend
  participant API as Backend
  participant DB as PostgreSQL

  Student->>FE: Edit code (autosave interval or blur)
  FE->>API: PUT /submissions/:sessionId/draft
  API->>DB: UPDATE sessions.code
  API-->>FE: Saved
  Student->>FE: Leave and return later
  FE->>API: POST /submissions/start
  API->>DB: Find open draft for same name + problem
  API-->>FE: has_draft + code
  FE-->>Student: Restore editor state
```

---

## Student Use Case 9 - Student Reviews Completed Problems and Grades {#student-uc-9}

```mermaid
sequenceDiagram
  actor Student
  participant FE as Frontend
  participant API as Backend

  Student->>FE: Open completed attempt view
  FE->>FE: Show stored submission + score if returned with problem payload
  opt Teacher refreshed data
    FE->>API: GET /problems/access/:code or reload from parent state
    API-->>FE: Problem + past submission summary when available
  end
  FE-->>Student: Final code, grade, feedback fields
```