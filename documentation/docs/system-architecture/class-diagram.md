---
sidebar_position: 3
---

# Class Diagram

This diagram uses **explicit attribute types**, **behavior (methods)**, and **relationship semantics**. In this product, a **Problem** is the published assignment (the “quiz”); a **Session** is one student’s attempt (**submission**). A session is always tied to exactly one problem and is removed if that problem is removed—so Problem↔Session is **composition**, not shared aggregation.

## Relationship summary

| Relationship | Kind | Rationale |
|--------------|------|-----------|
| Problem → Section, TestCase, Session | **Composition** (`*--`) | Sections, test cases, and sessions are parts of a problem; they do not exist as standalone domain objects without that problem. |
| Section → Suggestion | **Composition** | Suggestions belong to one section only; they are not reused across sections. |
| User → Problem | **Association** (`-->`) | A teacher **creates** problems; ownership is by `teacherId`. (Persistence may cascade on delete; the diagram emphasizes create/ownership.) |

## Class diagram

```mermaid
classDiagram
  direction TB

  class User {
    +int id
    +string name
    +string email
    +string role
    +string passwordHash
    +createProblem() Problem
    +requestOtp() void
    +verifyOtp() string
    +gradeSession(sessionId int, percent int) void
  }

  class Problem {
    +int id
    +int teacherId
    +string accessCode
    +string title
    +string description
    +string languagesJson
    +string primaryLanguage
    +int timeLimitSeconds
    +int maxAttempts
    +bool allowCopyPaste
    +bool trackTabSwitching
    +addSection() Section
    +addTestCase() TestCase
  }

  class Section {
    +int id
    +int orderIndex
    +string label
    +string codeByLanguageJson
    +addSuggestion() Suggestion
  }

  class Suggestion {
    +int id
    +string content
    +bool isCorrect
    +string source
  }

  class TestCase {
    +int id
    +string input
    +string expected
    +string explanation
  }

  class Session {
    +int id
    +string studentName
    +string code
    +string suggestionLogJson
    +string tabSwitchLogJson
    +string testResultsJson
    +string pasteLogJson
    +int score
    +int total
    +string startedAt
    +string submittedAt
    +saveDraft(code string) void
    +submit() void
  }

  User "1" --> "*" Problem : creates / owns
  Problem "1" *-- "*" Section : contains
  Problem "1" *-- "*" TestCase : validates_with
  Problem "1" *-- "*" Session : submissions
  Section "1" *-- "*" Suggestion : offers
```

### Notes on types

- **IDs** are integers in PostgreSQL (`SERIAL`).
- **JSON payloads** stored as text in the database are shown as `string` with a `Json` suffix (e.g. `languagesJson`, `codeByLanguageJson`, log fields).
- **Student identity** is carried on `Session.studentName`; students using the access-code flow are not required to have a `User` record. `submit()` and `saveDraft()` represent the submission lifecycle exposed by the submissions API.