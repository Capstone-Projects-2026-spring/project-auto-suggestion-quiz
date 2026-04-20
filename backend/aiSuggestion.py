import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


def aiSuggestion(currentCode, problemPrompt, is_correct=True):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    if is_correct:
        system_content = (
            "You are a helpful and concise programming assistant. "
            "You are assisting the user in finishing this problem: " + problemPrompt + "\n\n"
            "Suggest exactly one correct next line of code based on the student's current code. "
            "The suggestion must be logically and algorithmically correct for solving the problem. "
            "Respond ONLY with a JSON object in this exact format, no markdown, no extra text:\n"
            '{"suggestions": [{"suggestion": "...", "explanation": "..."}]}'
        )
    else:
        system_content = (
            "You are a helpful and concise programming assistant. "
            "You are assisting the user in finishing this problem: " + problemPrompt + "\n\n"
            "Suggest exactly one subtly incorrect next line of code based on the student's current code. "
            "The error must be a logical or algorithmic mistake — NOT a syntax error, typo, or misspelling. "
            "Good examples of subtle errors: using the wrong operator (multiply instead of divide, "
            "subtract instead of add), an off-by-one loop bound (starting at index 1 instead of 0, "
            "using < instead of <=, or using <= instead of <), returning the wrong variable, "
            "using the wrong comparison direction (> instead of <), or using the wrong accumulator "
            "initial value. The line must look completely plausible and reasonable at first glance — "
            "the student must think critically to identify the error. "
            "Your explanation must NOT reveal or hint at the error — describe what the line "
            "appears to do as if it were correct. "
            "Respond ONLY with a JSON object in this exact format, no markdown, no extra text:\n"
            '{"suggestions": [{"suggestion": "...", "explanation": "..."}]}'
        )

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": system_content,
            },
            {
                "role": "user",
                "content": "Give me 1 suggestion for the next line of this code:\n" + currentCode,
            },
        ],
    )

    raw = completion.choices[0].message.content
    data = json.loads(raw)

    class _Suggestion:
        def __init__(self, suggestion, explanation):
            self.suggestion = suggestion
            self.explanation = explanation

    class _Response:
        def __init__(self, suggestions):
            self.suggestions = suggestions

    suggestions = [
        _Suggestion(s.get("suggestion", ""), s.get("explanation", ""))
        for s in data.get("suggestions", [])
    ]
    return _Response(suggestions)
