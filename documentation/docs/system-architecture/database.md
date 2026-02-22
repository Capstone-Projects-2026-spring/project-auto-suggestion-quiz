---
sidebar_position: 5
---

# Database Design

## Entity-Relationship Diagram

```mermaid
erDiagram
  USERS ||--o{ CLASSES : "teaches (teacher_id)"
  USERS ||--o{ ENROLLMENTS : enrolls
  CLASSES ||--o{ ENROLLMENTS : has
  CLASSES ||--o{ QUIZZES : contains
  QUIZZES ||--o{ QUIZ_PROBLEMS : has
  PROBLEMS ||--o{ QUIZ_PROBLEMS : used_in
  PROBLEMS ||--o{ SUBMISSIONS : attempted_in
  USERS ||--o{ SUBMISSIONS : submits
  QUIZZES ||--o{ SUBMISSIONS : belongs_to
  SUBMISSIONS ||--o| GRADES : receives
  USERS ||--o{ GRADES : grades_by
  %% Supporting tables
  ENROLLMENTS }o--|| USERS : "user_id"
  ENROLLMENTS }o--|| CLASSES : "class_id"
  QUIZ_PROBLEMS }o--|| QUIZZES : "quiz_id"
  QUIZ_PROBLEMS }o--|| PROBLEMS : "problem_id"
```

---

## Table Overview

The system database contains the following minimum required tables:

- `users`
- `classes`
- `enrollments`
- `problems`
- `quizzes`
- `submissions`
- `grades`
- `suggestion_events`
- `event_logs`

Each table uses:

- **Primary Keys (PK)** to uniquely identify records  
- **Foreign Keys (FK)** to maintain referential integrity  
- Appropriate indexing for performance optimization  

These constraints ensure data consistency and prevent orphaned or invalid records.
