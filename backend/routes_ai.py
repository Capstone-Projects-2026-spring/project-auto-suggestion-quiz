from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

from aiSuggestion import aiSuggestion

load_dotenv()

router = APIRouter(prefix="/ai", tags=["ai"])


class AISuggestionRequest(BaseModel):
    problem_id: int
    current_code: str
    problem_prompt: str
    is_correct: bool = True


class SingleSuggestion(BaseModel):
    suggestion: str
    explanation: str


class AISuggestionResponse(BaseModel):
    suggestions: list[SingleSuggestion]


@router.post("/suggestion", response_model=AISuggestionResponse)
def get_ai_suggestion(req: AISuggestionRequest) -> AISuggestionResponse:
    try:
        result = aiSuggestion(req.current_code, req.problem_prompt, req.is_correct)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return result


# ---------------------------------------------------------------------------
# Autofill endpoint — parses a raw teacher text dump into a problem schema
# ---------------------------------------------------------------------------

AUTOFILL_SYSTEM_PROMPT = """You are a teaching assistant helping a computer science instructor structure a programming problem for an educational platform called AutoSuggestion Quiz.

The instructor will paste raw problem material — this may include a title, a description, code, test cases, or any combination. Your job is to parse this material and return a single JSON object that populates the problem creation form. Do not include any explanation, preamble, or markdown — respond with raw JSON only.

FIRST, check whether the input contains enough detail to generate a meaningful problem. The input must include at minimum:
- A description of what the function or program should do
- At least one concrete example, expected behavior, or function signature

If the input does not meet this bar, return ONLY this JSON and nothing else:
{"error": "Not enough detail. Please include at minimum: what the function should do, and at least one example or expected input/output."}

Otherwise, return the problem JSON matching this exact schema:

{
  "title": string,
  "description": string,
  "languages": [string],
  "boilerplate": {
    "<language>": string
  },
  "sections": [
    {
      "order": number,
      "label": string,
      "code": { "<language>": string },
      "suggestions": [
        { "type": "ai", "isCorrect": true|false, "content": "" }
      ]
    }
  ],
  "testCases": [
    { "input": string, "expected": string, "explanation": string }
  ],
  "timeLimitMinutes": null,
  "maxSubmissions": null,
  "allowCopyPaste": true,
  "trackTabSwitching": false
}

Rules:
1. SECTIONS are the most important part. Split the solution into 2-4 logical chunks, each representing a distinct step. Each section has a label and a code block. The label IS the instruction to the student — it appears as a comment header above the code block automatically, so do NOT repeat it or add any other comments inside the code field. The FIRST section's code must begin with the function signature (e.g. "def most_frequent(nums):") and nothing else — its label must describe the first real step of the solution, NOT "define the function" or "write the function signature" or any equivalent. All subsequent sections' code must be completely empty strings — no comments, no placeholder text, no code. The LAST section's code must be just "    return None" (4 spaces of indentation) so the function is syntactically valid and runnable from the start. CRITICAL: all code inside a function body must be indented with exactly 4 spaces. Never use 2 spaces or tabs. The function signature itself has no indentation. Assign each section exactly one suggestion with isCorrect set: generally make one section correct and the rest distractors, or alternate for longer problems. The type should always be "ai" and content always "".
2. LANGUAGES: detect which language the code is in. Use only: "python", "javascript", "java", "c". Default to "python" if unclear.
3. BOILERPLATE: set this to an empty string for each language. The function signature belongs inside the first section's code, not here.
4. TEST CASES: if the instructor provides test cases, extract them. If not, generate exactly 3: a normal case, an edge case, and an unusual input case. The "input" field must be a valid Python call expression (e.g. add(1, 2)). The "expected" field must be the return value as a string (e.g. "3").
5. Keep the description clean and student-facing. Remove any instructor notes or solution hints.

Example of a good section label: "Choose a data structure to track element counts"
Example of a bad section label: "Counter initialization" or "Use a dictionary"
"""


class AutofillRequest(BaseModel):
    raw_text: str


@router.post("/autofill")
def autofill_problem(req: AutofillRequest):
    if len(req.raw_text.strip()) < 30:
        return {"error": "Not enough detail. Please describe what the function should do and provide at least one example."}

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": AUTOFILL_SYSTEM_PROMPT},
                {"role": "user", "content": req.raw_text},
            ],
        )
        raw = completion.choices[0].message.content
        data = json.loads(raw)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return data
