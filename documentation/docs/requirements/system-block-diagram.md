---
sidebar_position: 2
---

# System Block Diagram

```mermaid
flowchart LR

  %% Actors
  S[Student]
  T[Teacher]
  A[Admin]

  %% Client Layer
  UI[Web Application<br/>React/Vite UI]

  %% Backend Layer
  API[Backend Server<br/>FastAPI or Node.js]

  %% AI Engine
  AI[AI Suggestion Engine<br/>LLM-based]

  %% Database
  DB[(Shared SQL Database)]

  %% Connections
  S --> UI
  T --> UI
  A --> UI

  UI --> API
  API --> AI
  API --> DB
