---
sidebar_position: 2
---

# System Block Diagram

```mermaid
flowchart LR
  %% ===== Actors =====
  S[Student]
  T[Teacher / Instructor]
  A[Admin]

  %% ===== Client =====
  subgraph Client[Client - Web App]
    UI[React/Vite UI<br/>Dashboards + Code Editor + Terminal View]
  end

  %% ===== Backend =====
  subgraph Backend[Backend API - FastAPI or Node.js]
    AUTH[Authentication<br/>Edu ID or Email/Password]
    PROB[Problem + Quiz Management<br/>Upload - Edit - Publish]
    QUIZ[AutoSuggestion Quiz<br/>Suggestions + Explanations]
    RUN[Code Runner<br/>Run Code + Output]
    GRADE[Grading + Analytics<br/>Progress + Grades]
    LOG[Logging + Event Tracking]
  end

  %% ===== AI Engine =====
  subgraph AIBlock[AI Suggestion Engine]
    AI[LLM Suggestion Engine<br/>Distractors + Optional Explanations]
  end

  %% ===== Data =====
  subgraph Data[Shared Data Layer]
    DB[(Shared Database<br/>Users Classes Problems Submissions Grades Logs)]
  end

  %% ===== Main Flows =====
  S --> UI
  T --> UI
  A --> UI

  UI --> AUTH
  UI --> PROB
  UI --> QUIZ
  UI --> RUN
  UI --> GRADE

  QUIZ --> AI

  AUTH --> DB
  PROB --> DB
  QUIZ --> DB
  RUN --> DB
  GRADE --> DB
  LOG --> DB

  QUIZ --> LOG
  PROB --> LOG
  RUN --> LOG
  GRADE --> LOG
