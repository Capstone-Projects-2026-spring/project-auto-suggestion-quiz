import os
import sys

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
from backUnitTest.test_helpers import make_conn_and_cursor

from routes_problems import (
    CreateProblemRequest,
    EditProblemRequest,
    create_problem,
    edit_problem,
    get_problem_by_code,
)


def test_create_problem_request_accepts_time_limit_seconds():
    req = CreateProblemRequest(
        title="Timer Problem",
        description="Test timer config",
        languages=["python"],
        boilerplate={"python": ""},
        sections=[],
        testCases=[],
        timeLimitSeconds=120,
    )

    assert req.timeLimitSeconds == 120


def test_edit_problem_request_accepts_time_limit_seconds():
    req = EditProblemRequest(timeLimitSeconds=45)

    assert req.timeLimitSeconds == 45


def test_create_problem_persists_time_limit_seconds(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.side_effect = [
        {"id": 101},
        {"id": 101},
    ]

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda authorization: {"user_id": 7, "role": "teacher"},
    )
    monkeypatch.setattr("routes_problems._generate_unique_access_code", lambda c: "123456")
    monkeypatch.setattr(
        "routes_problems._build_problem",
        lambda c, p: {"id": 101, "time_limit_seconds": 120},
    )

    req = CreateProblemRequest(
        title="Timer Problem",
        description="Test timer insert",
        languages=["python"],
        boilerplate={"python": ""},
        sections=[],
        testCases=[],
        timeLimitSeconds=120,
    )

    result = create_problem(req, authorization="Bearer token")

    assert result["time_limit_seconds"] == 120

    insert_calls = [
        call
        for call in cursor.execute.call_args_list
        if "INSERT INTO problems" in call.args[0]
    ]
    assert insert_calls, "Expected problems INSERT query to run"

    params = insert_calls[0].args[1]
    assert params[6] == 120


def test_edit_problem_updates_time_limit_seconds(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.side_effect = [
        {"id": 9, "teacher_id": 7},
        {"id": 9, "teacher_id": 7},
    ]

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda authorization: {"user_id": 7, "role": "teacher"},
    )
    monkeypatch.setattr(
        "routes_problems._build_problem",
        lambda c, p: {"id": 9, "time_limit_seconds": 45},
    )

    req = EditProblemRequest(timeLimitSeconds=45)
    result = edit_problem(9, req, authorization="Bearer token")

    assert result["time_limit_seconds"] == 45

    update_calls = [
        call
        for call in cursor.execute.call_args_list
        if call.args[0].startswith("UPDATE problems SET")
    ]
    assert update_calls, "Expected problems UPDATE query to run"

    sql = update_calls[0].args[0]
    values = update_calls[0].args[1]

    assert "time_limit_seconds = %s" in sql
    assert 45 in values


def test_get_problem_by_code_returns_time_limit_seconds(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = {"id": 88}

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._build_problem",
        lambda c, p: {
            "id": 88,
            "access_code": "123456",
            "time_limit_seconds": 300,
        },
    )

    result = get_problem_by_code("123456")

    assert result["time_limit_seconds"] == 300


def test_get_problem_by_code_requires_6_digit_code():
    with pytest.raises(HTTPException) as exc:
        get_problem_by_code("12ab")

    assert exc.value.status_code == 400
