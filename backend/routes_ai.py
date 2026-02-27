from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from aiSuggestion import ai_suggeestion


router = APIRouter(prefix="/ai", tags=["ai"])


class AISuggestionRequest(BaseModel):
    problem_id: int
    current_code: str
    problem_prompt: str


class AISuggestionResponse(BaseModel):
    label: str
    detail: str
    insertText: str
    explanation: str


@router.post("/suggestion", response_model=AISuggestionResponse)
def get_ai_suggestion(req: AISuggestionRequest) -> AISuggestionResponse:
    """
    This calls the existing `ai_suggeestion` helper and reshapes the result so
    the frontend can plug it directly into the suggestions window.
    """
    try:
        result = ai_suggeestion(req.current_code, req.problem_prompt)
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    # Shape the response so the frontend can plug it directly into Monaco / UI.
    return AISuggestionResponse(
        label="AI suggestion",
        detail="AI Suggestion",
        insertText=result.suggestion,
        explanation=result.explanation,
    )

