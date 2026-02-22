---
sidebar_position: 6
---

# Process View

The process view describes concurrency, control flow, and the runtime behavior of the system.

---

## Request Lifecycle

1. Client sends request to Backend API.
2. Backend validates authentication and role.
3. Backend processes request:
   - For AI requests: asynchronous call to AI service.
   - For code execution: isolated runner process.
4. Backend waits for response (non-blocking).
5. Backend logs event and returns response.

---

## Concurrency Model

- Backend supports concurrent HTTP requests.
- AI and Code Runner calls are asynchronous.
- Resource limits prevent blocking.
- Database transactions ensure consistency.

---

## AI Algorithm Overview

The AI Suggestion Engine follows this structured workflow:

1. Receive context:
   - Problem description
   - Student's current code
   - Programming language
   - Cursor position

2. Generate next-line suggestion using a Large Language Model (LLM).

3. Optionally generate an explanation for the suggestion.

4. If in quiz mode:
   - Generate 0–2 plausible distractors.

5. Return a structured JSON response to the backend API.

Example JSON structure:

```json
{
  "suggestion": "for i in range(n):",
  "distractors": [
    "for i in n:",
    "while i < n:"
  ],
  "explanation": "This iterates from 0 to n-1."
}
```

**Performance Considerations**

To maintain low latency and responsiveness:

* Asynchronous API calls are used.
* Timeout thresholds are enforced.
* Optional caching may be applied for repeated prompts.
* AI calls are isolated from core backend logic.
