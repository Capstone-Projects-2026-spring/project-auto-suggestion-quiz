import os
import sys

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from routes_judge import CodeExecutionRequest, decode_judge0_field, execute_code

from judge0_test_utils import MockAsyncClient, MockResponse, run_async


def test_decode_invalid_base64_returns_original_string():
    assert decode_judge0_field("not_base64%%") == "not_base64%%"


def test_execute_code_rejects_unsupported_language():
    req = CodeExecutionRequest(code="print(1)", language="ruby", input="")

    with pytest.raises(HTTPException) as exc:
        run_async(execute_code(req))

    assert exc.value.status_code == 400
    assert exc.value.detail == "Unsupported language"


def test_execute_code_requires_judge0_url(monkeypatch):
    req = CodeExecutionRequest(code="print(1)", language="python", input="")
    monkeypatch.delenv("JUDGE0_URL", raising=False)

    with pytest.raises(HTTPException) as exc:
        run_async(execute_code(req))

    assert exc.value.status_code == 500
    assert exc.value.detail == "JUDGE0_URL is not configured"


def test_execute_code_returns_status_description_when_not_accepted(monkeypatch):
    monkeypatch.setenv("JUDGE0_URL", "http://judge0.local")
    payload = {
        "stdout": None,
        "stderr": None,
        "compile_output": None,
        "message": None,
        "status": {"description": "Time Limit Exceeded"},
    }
    mock_response = MockResponse(payload=payload)
    monkeypatch.setattr(
        "routes_judge.httpx.AsyncClient",
        lambda: MockAsyncClient(response=mock_response),
    )

    req = CodeExecutionRequest(code="while True: pass", language="python", input="")
    result = run_async(execute_code(req))

    assert result.output == ""
    assert result.error == "Time Limit Exceeded"


def test_execute_code_maps_http_status_error_to_502(monkeypatch):
    monkeypatch.setenv("JUDGE0_URL", "http://judge0.local")
    mock_response = MockResponse(payload={}, should_raise=True, text="bad gateway")
    monkeypatch.setattr(
        "routes_judge.httpx.AsyncClient",
        lambda: MockAsyncClient(response=mock_response),
    )

    req = CodeExecutionRequest(code="print(1)", language="python", input="")

    with pytest.raises(HTTPException) as exc:
        run_async(execute_code(req))

    assert exc.value.status_code == 502
    assert "Judge0 request failed" in exc.value.detail


def test_execute_code_maps_unexpected_errors_to_500(monkeypatch):
    monkeypatch.setenv("JUDGE0_URL", "http://judge0.local")
    monkeypatch.setattr(
        "routes_judge.httpx.AsyncClient",
        lambda: MockAsyncClient(error=RuntimeError("network died")),
    )

    req = CodeExecutionRequest(code="print(1)", language="python", input="")

    with pytest.raises(HTTPException) as exc:
        run_async(execute_code(req))

    assert exc.value.status_code == 500
    assert "Failed to execute code" in exc.value.detail
