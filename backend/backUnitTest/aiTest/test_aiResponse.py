import sys
import os
import json

"""""
gotta use this to point to the right testing folder
"""""
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))
from unittest.mock import patch, MagicMock
from aiSuggestion import aiSuggestion


def test_ai_suggestion_returns_response():
    mock_completion = MagicMock()
    mock_completion.choices[0].message.content = json.dumps({
        "suggestions": [
            {"suggestion": "return a + b", "explanation": "This returns the sum of a and b"},
            {"suggestion": "return a + b", "explanation": "Another way to return the sum"}
        ]
    })

    with patch("aiSuggestion.OpenAI") as mock_openai:
        mock_openai.return_value.chat.completions.create.return_value = mock_completion

        """""
        Two suggestions can be possibly given to the user
        """""
        result = aiSuggestion(
            "def add_numbers(a,b):",
            "create a function that adds 2 numbers together"
        )

        """""
        Just check to see if we got something from the mock AI.
        """""
        assert result.suggestions is not None
        assert len(result.suggestions) > 0
        assert result.suggestions[0].suggestion is not None
        assert result.suggestions[0].explanation is not None
        assert len(result.suggestions[0].suggestion) > 0
        assert len(result.suggestions[0].explanation) > 0


def test_ai_suggestion_incorrect_mode_branch():
    mock_completion = MagicMock()
    mock_completion.choices[0].message.content = json.dumps({
        "suggestions": [
            {"suggestion": "return a - b", "explanation": "Returns a value"}
        ]
    })

    with patch("aiSuggestion.OpenAI") as mock_openai:
        mock_openai.return_value.chat.completions.create.return_value = mock_completion

        result = aiSuggestion(
            "def add_numbers(a,b):",
            "create a function that adds 2 numbers together",
            False,
        )

        assert result.suggestions is not None
        assert len(result.suggestions) == 1