---
sidebar_position: 4
---

## Functional

### Quiz Creation and Management

- The system must allow instructors to create, edit, and delete quizzes through a web interface.  
- The system must restrict quiz modification permissions to authorized instructors.  
- The system must store quizzes and related data in the database.

### AI Suggestion Generation

- The system must generate multiple-choice suggestions using the OpenAI API.  
- The system must allow prompts to be submitted to generate suggestions.  
- The system must allow instructors to review, edit, and approve suggestions before publishing.

### Student Quiz Interaction

- The system must present quizzes in an interactive format for students.  
- The system must allow students to select answers and submit completed quizzes.  
- The system must store submissions for later review.

### Auto-Completion and Code Suggestion Features

- The system must provide auto-completion suggestions based on user prompts.  
- The system must support a web-based terminal interface for interactive input.

### Code Execution and Compilation

- The system must compile and run Java, C, and JavaScript code.
- The system must display output and errors clearly after execution.

### User Accounts and Authorization

- The system must support account creation and secure login.  
- The system must support teacher and student roles with different permissions.  
- The system must store account information securely.
- The system must support third-party authentication (e.g., Google login).
- The system must allow access key entry and authorization when required.

### Interface and Dashboard

- The system must provide a frontend interface for quiz creation and management.
- The system must include a dashboard for generating boilerplate code.
- The system must provide clear navigation between system features.

---

## Non-Functional

### Performance

- The system must respond quickly when generating AI suggestions.
- The system must handle multiple users submitting quizzes at the same time.
- The system must execute code submissions efficiently.

### Reliability and Data Integrity

- The system must reliably store quizzes and submissions.
- The system must prevent data loss during submissions or updates.
- The system must handle errors gracefully without interrupting use.

### Security

- The system must require authentication before accessing protected features.
- The system must enforce role-based permissions.
- The system must securely store credentials and access keys.
- The system must protect against unauthorized access.

### Usability and Accessibility

- The system must provide a clear and intuitive interface.
- The system must provide feedback for errors and successful actions.
- The system should work across modern browsers and common devices.

### Maintainability and Documentation

- The system must include clear API and system documentation.  
- The system must be organized to support maintenance and future updates.

### Scalability and Extensibility

- The system must support adding new programming languages in the future.  
- The system must support expanding quiz functionality and system features.
