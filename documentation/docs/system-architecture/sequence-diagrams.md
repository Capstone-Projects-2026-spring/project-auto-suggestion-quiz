---
sidebar_position: 4
---

# Sequence Diagrams

The following sequence diagrams illustrate the key interactions between system components.

---

## Student Runs Code

```mermaid
sequenceDiagram
  actor Student
  participant UI as Web App
  participant API as Backend
  participant RUN as Code Runner
  participant DB as Database

  Student->>UI: Click "Run Code"
  UI->>API: POST /run
  API->>RUN: Execute code
  RUN-->>API: Output + errors
  API->>DB: Save run result
  API-->>UI: Return output
```

---

## Student Receives Code Suggestions

```mermaid
sequenceDiagram
  actor Student
  participant UI as Web App
  participant API as Backend
  participant AI as AI Engine
  participant DB as Database

  Student->>UI: Pause typing
  UI->>API: POST /suggest
  API->>AI: Generate suggestion
  AI-->>API: suggestion + distractors
  API->>DB: Log suggestion event
  API-->>UI: Return suggestion choices
```

---

## Teacher Publishes Quiz (Generates Access Key)

```mermaid
sequenceDiagram
  actor Teacher
  participant UI as Web App
  participant API as Backend
  participant DB as Database
  participant LOG as Logging

  Teacher->>UI: Click "Publish Quiz"
  UI->>API: POST /quiz/{quizId}/publish
  API->>DB: Validate quiz completeness
  alt Quiz is complete
    API->>DB: Update status=Published + generate accessKey
    API->>LOG: Log "quiz_published" event
    LOG->>DB: Save event log
    API-->>UI: Return success + accessKey
    UI-->>Teacher: Show accessKey
  else Quiz missing required fields
    API-->>UI: Return error (quiz incomplete)
    UI-->>Teacher: Show validation error
  end
```

---

## Student Joins Class Using Access Code

```mermaid
sequenceDiagram
  actor Student
  participant UI as Web App
  participant API as Backend
  participant DB as Database
  participant LOG as Logging

  Student->>UI: Enter class access code
  UI->>API: POST /class/join (accessCode)
  API->>DB: Find class by accessCode
  alt Valid code
    API->>DB: Create Enrollment(studentId, classId)
    API->>LOG: Log "class_joined" event
    LOG->>DB: Save event log
    API-->>UI: Join success
    UI-->>Student: Redirect to Student Dashboard
  else Invalid code
    API-->>UI: Return error (invalid code)
    UI-->>Student: Show "invalid code" message
  end
```

---

## Student Submits Completed Work

```mermaid
sequenceDiagram
  actor Student
  participant UI as Web App
  participant API as Backend
  participant RUN as Code Runner
  participant DB as Database
  participant LOG as Logging

  Student->>UI: Click "Submit"
  UI->>API: POST /submission (quizId, problemId, code)
  API->>DB: Save submission status=Submitted
  opt Run final validation tests
    API->>RUN: Execute code on test cases
    RUN-->>API: Pass/fail + output/errors
    API->>DB: Save final RunResult
  end
  API->>LOG: Log "submission_submitted" event
  LOG->>DB: Save event log
  API-->>UI: Submission confirmation
  UI-->>Student: Redirect to Dashboard / show status
```

---

## Teacher Grades Student Submission

```mermaid
sequenceDiagram
  actor Teacher
  participant UI as Web App
  participant API as Backend
  participant DB as Database
  participant LOG as Logging

  Teacher->>UI: Open Student Progress
  UI->>API: GET /submissions?classId=...
  API->>DB: Query submissions + student info
  API-->>UI: Return submissions list
  Teacher->>UI: Enter grade + feedback
  UI->>API: POST /grade (submissionId, score, feedback)
  API->>DB: Save/Update Grade
  API->>LOG: Log "grade_published" event
  LOG->>DB: Save event log
  API-->>UI: Grade saved
  UI-->>Teacher: Show confirmation
```

---

## Admin Deletes Student Data

```mermaid
sequenceDiagram
  actor Admin
  participant UI as Web App
  participant API as Backend
  participant DB as Database
  participant LOG as Logging Service

  Admin->>UI: Select "Delete Student Data"
  UI->>API: DELETE /admin/student/{studentId}
  API->>DB: Verify Admin role
  alt Authorized
    API->>DB: Delete or anonymize student records
    API->>LOG: Log "student_data_deleted"
    LOG->>DB: Save audit log
    API-->>UI: Deletion successful
    UI-->>Admin: Show confirmation
  else Unauthorized
    API-->>UI: Return error (403 Forbidden)
    UI-->>Admin: Show permission error
  end
```
