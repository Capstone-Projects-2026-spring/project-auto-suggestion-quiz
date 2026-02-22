---
sidebar_position: 1
---

# Overview

This document describes the software architecture of the **AutoSuggestion Quiz** system and explains how the requirements are mapped into the design.

The architecture is designed to:
- Support critical evaluation of AI-generated code suggestions
- Provide secure role-based access control
- Maintain low-latency code suggestions
- Log all meaningful interactions
- Store all persistent data in a shared database

---

## Component Descriptions

### Web Application (React/Vite)

**Type**: Client Interface

**Purpose**: Provide interactive UI for all user roles.

**Responsibilities**:

* Login and registration
* Student code editor and terminal
* Quiz interface (AutoSuggestion mode)
* Teacher dashboard (problem creation, grading)
* Admin panel

**Interface**:

* Communicates with Backend API using REST over HTTPS.

### Backend API Server (FastAPI or Node.js)

**Type**: Application Logic Layer  

**Purpose**: Central control of business logic, authentication, permissions, and coordination between services.

**Responsibilities**:

* Authenticate users (Edu ID or email/password)
* Enforce role-based access control (Student / Teacher / Admin)
* Manage classes, problems, quizzes, and access keys
* Handle submissions and grading
* Request AI-generated suggestions
* Send code to Code Runner for execution
* Log system events and interactions
* Provide analytics endpoints

**Dependencies**:

* Shared SQL Database
* AI Suggestion Engine
* Code Runner Service

**Interface**:

* REST API (JSON over HTTPS)
* Example endpoints:
  * `POST /auth/login`
  * `POST /quiz`
  * `POST /run`
  * `POST /suggest`
  * `GET /analytics`

### AI Suggestion Engine

**Type**: Intelligent Service Component  

**Purpose**: Generate context-aware next-line code suggestions.

**Inputs**:

* Problem description
* Student's current code
* Programming language
* Cursor position / context

**Outputs**:

* Correct next-line suggestion
* Distractors (0–2 plausible incorrect options)
* Optional explanation

**Performance Considerations**:

* Asynchronous API calls
* Timeout handling
* Optional caching of repeated prompts

### Code Runner Service

**Type**: Execution Service  

**Purpose**: Safely compile and execute student code in a sandboxed environment.

**Supported Languages**:

* Python
* Java
* C
* JavaScript

**Responsibilities**:

* Compile (if necessary)
* Execute code with test cases
* Return stdout, stderr, exit code, runtime
* Enforce memory and time limits

**Security Considerations**:

* Code runs in isolated environment
* Resource usage restrictions applied

### Shared SQL Database

**Type**: Persistent Storage Layer  

**Purpose**: Maintain all system data.

**Stores**:

* Users (students, teachers, admins)
* Classes and enrollments
* Problems and quizzes
* Submissions
* Grades and feedback
* Suggestion events
* Event logs

**Design Goals**:

* Single source of truth
* Indexed queries for performance
* Referential integrity via foreign keys
