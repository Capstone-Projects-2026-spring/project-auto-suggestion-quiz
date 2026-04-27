import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


def aiSuggestion(currentCode, problemPrompt, is_correct=True):
    import random
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    if is_correct:
        system_content = (
            "You are a helpful and concise programming assistant. "
            "You are assisting the user in finishing this problem: " + problemPrompt + "\n\n"
            "Generate exactly 3 suggestions for the next line of code based on the student's current code. "
            "Exactly 1 suggestion must be logically and algorithmically correct for solving the problem. "
            "The other 2 must be subtly incorrect — logical or algorithmic mistakes, NOT syntax errors or typos. "
            "Good examples of subtle errors: wrong operator (multiply instead of divide), "
            "off-by-one loop bounds, returning the wrong variable, wrong comparison direction, "
            "wrong accumulator initial value. Each incorrect suggestion must look completely plausible. "
            "Explanations must NOT reveal or hint at any error — describe each line as if it were correct. "
            "Respond ONLY with a JSON object in this exact format, no markdown, no extra text:\n"
            '{"suggestions": [{"suggestion": "...", "explanation": "..."}, {"suggestion": "...", "explanation": "..."}, {"suggestion": "...", "explanation": "..."}]}'
        )
    else:
        system_content = (
            "You are a helpful and concise programming assistant. "
            "You are assisting the user in finishing this problem: " + problemPrompt + "\n\n"
            "Generate exactly 3 subtly incorrect suggestions for the next line of code based on the student's current code. "
            "All 3 must be incorrect — logical or algorithmic mistakes, NOT syntax errors or typos. "
            "Good examples of subtle errors: wrong operator (multiply instead of divide), "
            "off-by-one loop bounds, returning the wrong variable, wrong comparison direction, "
            "wrong accumulator initial value. Each suggestion must look completely plausible and reasonable. "
            "Explanations must NOT reveal or hint at any error — describe each line as if it were correct. "
            "Respond ONLY with a JSON object in this exact format, no markdown, no extra text:\n"
            '{"suggestions": [{"suggestion": "...", "explanation": "..."}, {"suggestion": "...", "explanation": "..."}, {"suggestion": "...", "explanation": "..."}]}'
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
                "content": "Give me 3 suggestions for the next line of this code:\n" + currentCode,
            },
        ],
    )

    raw = completion.choices[0].message.content
    data = json.loads(raw)

    class _Suggestion:
        def __init__(self, suggestion, explanation, is_correct=False):
            self.suggestion = suggestion
            self.explanation = explanation
            self.is_correct = is_correct

    class _Response:
        def __init__(self, suggestions):
            self.suggestions = suggestions

    raw_suggestions = data.get("suggestions", [])
    if is_correct and raw_suggestions:
        correct_idx = random.randrange(len(raw_suggestions))
        suggestions = [
            _Suggestion(s.get("suggestion", ""), s.get("explanation", ""), is_correct=(i == correct_idx))
            for i, s in enumerate(raw_suggestions)
        ]
    else:
        suggestions = [
            _Suggestion(s.get("suggestion", ""), s.get("explanation", ""), is_correct=False)
            for s in raw_suggestions
        ]
    random.shuffle(suggestions)
    return _Response(suggestions)
