import sys
import os
import json
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from aiSuggestion import aiSuggestion


def make_mock_completion(suggestions):
    mock_completion = MagicMock()
    mock_completion.choices[0].message.content = json.dumps({
        "suggestions": suggestions
    })
    return mock_completion


class test_aiSuggestion(unittest.TestCase):

    def test_response(self):
        mock_completion = make_mock_completion([
            {"suggestion": "return a + b", "explanation": "Returns the sum"}
        ])
        with patch("aiSuggestion.OpenAI") as MockOpenAI:
            MockOpenAI.return_value.chat.completions.create.return_value = mock_completion
            test = aiSuggestion("def add_numbers(a,b):", "create a function that adds 2 numbers together")
            self.assertIsNotNone(test)

    def test_3_suggestions(self):
        mock_completion = make_mock_completion([
            {"suggestion": "return a + b", "explanation": "Returns the sum"},
            {"suggestion": "result = a + b\nreturn result", "explanation": "Stores then returns"},
            {"suggestion": "return sum([a, b])", "explanation": "Uses built-in sum"}
        ])
        with patch("aiSuggestion.OpenAI") as MockOpenAI:
            MockOpenAI.return_value.chat.completions.create.return_value = mock_completion
            test = aiSuggestion("def add_numbers(a,b):", "create a function that adds 2 numbers together")
            self.assertEqual(len(test.suggestions), 3)

    def test_fields(self):
        mock_completion = make_mock_completion([
            {"suggestion": "return a + b", "explanation": "Returns the sum"},
            {"suggestion": "return sum([a, b])", "explanation": "Uses built-in sum"}
        ])
        with patch("aiSuggestion.OpenAI") as MockOpenAI:
            MockOpenAI.return_value.chat.completions.create.return_value = mock_completion
            test = aiSuggestion("def add_numbers(a,b):", "create a function that adds 2 numbers together")
            for s in test.suggestions:
                self.assertTrue(s.suggestion.strip())
                self.assertTrue(s.explanation.strip())

    def test_api_raises_exception(self):
        """Should propagate exceptions raised by the OpenAI client."""
        with patch("aiSuggestion.OpenAI") as MockOpenAI, \
                patch("aiSuggestion.load_dotenv"), \
                patch("aiSuggestion.os.getenv", return_value="fake-key"):

            MockOpenAI.return_value.chat.completions.create.side_effect = Exception("API error")

            with self.assertRaises(Exception) as ctx:
                aiSuggestion("def add_numbers(a,b):", "add two numbers")
            self.assertEqual(str(ctx.exception), "API error")


if __name__ == '__main__':
    unittest.main()