import base64
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from routes_judge import (
    CodeExecutionRequest,
    build_judge0_headers,
    decode_judge0_field,
    encode_judge0_field,
    execute_code,
)

from judge0_test_utils import MockAsyncClient, MockResponse, run_async


def test_build_judge0_headers_without_token(monkeypatch):
    monkeypatch.delenv("JUDGE0_AUTH_TOKEN", raising=False)

    headers = build_judge0_headers()

    assert headers == {"content-type": "application/json"}


def test_build_judge0_headers_with_token(monkeypatch):
    monkeypatch.setenv("JUDGE0_AUTH_TOKEN", "secret-token")

    headers = build_judge0_headers()

    assert headers["content-type"] == "application/json"
    assert headers["X-Auth-Token"] == "secret-token"


def test_encode_decode_judge0_field_round_trip():
    raw = "print('hello')"

    encoded = encode_judge0_field(raw)
    decoded = decode_judge0_field(encoded)

    assert encoded == base64.b64encode(raw.encode("utf-8")).decode("ascii")
    assert decoded == raw


def test_execute_code_success(monkeypatch):
    monkeypatch.setenv("JUDGE0_URL", "http://judge0.local")
    payload = {
        "stdout": encode_judge0_field("ok\\n"),
        "stderr": None,
        "compile_output": None,
        "message": None,
        "status": {"description": "Accepted"},
    }
    mock_response = MockResponse(payload=payload)
    monkeypatch.setattr(
        "routes_judge.httpx.AsyncClient",
        lambda: MockAsyncClient(response=mock_response),
    )

    req = CodeExecutionRequest(code="print('ok')", language="python", input="")
    result = run_async(execute_code(req))

    assert result.output == "ok\\n"
    assert result.error == ""
