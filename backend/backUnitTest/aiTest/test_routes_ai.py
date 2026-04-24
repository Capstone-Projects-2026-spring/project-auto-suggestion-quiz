import json
import os
import sys
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from main import app

client = TestClient(app)


def test_ai_suggestion_route_success():
    mock_result = {
        "suggestions": [
            {
                "suggestion": "return a + b",
                "explanation": "Adds a and b",
            }
        ]
    }

    with patch("routes_ai.aiSuggestion", return_value=mock_result):
        response = client.post(
            "/ai/suggestion",
            json={
                "problem_id": 1,
                "current_code": "def add(a,b):",
                "problem_prompt": "add two numbers",
                "is_correct": True,
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert len(body["suggestions"]) == 1
    assert body["suggestions"][0]["suggestion"] == "return a + b"


def test_ai_suggestion_route_maps_exception_to_500():
    with patch("routes_ai.aiSuggestion", side_effect=Exception("AI failure")):
        response = client.post(
            "/ai/suggestion",
            json={
                "problem_id": 1,
                "current_code": "def add(a,b):",
                "problem_prompt": "add two numbers",
                "is_correct": True,
            },
        )

    assert response.status_code == 500
    assert response.json()["detail"] == "AI failure"


def test_autofill_short_input_returns_error_payload():
    response = client.post("/ai/autofill", json={"raw_text": "too short"})

    assert response.status_code == 200
    assert "error" in response.json()


def test_autofill_success():
    mock_completion = MagicMock()
    mock_completion.choices[0].message.content = json.dumps(
        {
            "title": "Sample",
            "description": "Desc",
            "languages": ["python"],
            "boilerplate": {"python": ""},
            "sections": [],
            "testCases": [],
            "timeLimitMinutes": None,
            "maxSubmissions": None,
            "allowCopyPaste": True,
            "trackTabSwitching": False,
        }
    )

    with patch("routes_ai.OpenAI") as mock_openai:
        mock_openai.return_value.chat.completions.create.return_value = mock_completion
        response = client.post(
            "/ai/autofill",
            json={
                "raw_text": "Create a function that returns the sum of two numbers. Example: add(1,2) -> 3",
            },
        )

    assert response.status_code == 200
    assert response.json()["title"] == "Sample"


def test_autofill_malformed_json_maps_to_500():
    mock_completion = MagicMock()
    mock_completion.choices[0].message.content = "not valid json"

    with patch("routes_ai.OpenAI") as mock_openai:
        mock_openai.return_value.chat.completions.create.return_value = mock_completion
        response = client.post(
            "/ai/autofill",
            json={
                "raw_text": "Create a function that returns the sum of two numbers. Example: add(1,2) -> 3",
            },
        )

    assert response.status_code == 500
    assert "Expecting value" in response.json()["detail"]
