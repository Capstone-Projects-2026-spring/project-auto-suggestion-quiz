import datetime
import os
import sys

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
from backUnitTest.test_helpers import make_conn_and_cursor

from routes_submissions import (
    DraftRequest,
    FeedbackRequest,
    StartSubmissionRequest,
    SuggestionLogEntry,
    TabSwitchEntry,
    TestResult as SubmissionTestResult,
    PasteLogEntry,
    SubmitRequest,
    get_session,
    save_draft,
    save_feedback,
    start_submission,
    submit_session,
)


def test_start_submission_problem_not_found(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = None
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    with pytest.raises(HTTPException) as exc:
        start_submission(StartSubmissionRequest(problem_id=999, student_name="sam"))

    assert exc.value.status_code == 404
    assert exc.value.detail == "Problem not found"


def test_start_submission_submission_limit_reached(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.side_effect = [
        {"id": 1, "max_attempts": 1},
        {"cnt": 1},
    ]
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    with pytest.raises(HTTPException) as exc:
        start_submission(StartSubmissionRequest(problem_id=1, student_name="sam"))

    assert exc.value.status_code == 403
    assert "Submission limit reached" in exc.value.detail


def test_start_submission_returns_existing_draft(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    started = datetime.datetime(2026, 4, 24, 10, 0, 0)
    cursor.fetchone.side_effect = [
        {"id": 2, "max_attempts": None},
        {"id": 50, "code": "print(1)", "started_at": started},
    ]
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    result = start_submission(StartSubmissionRequest(problem_id=2, student_name="sam"))

    assert result["session_id"] == 50
    assert result["has_draft"] is True
    assert result["code"] == "print(1)"
    assert result["started_at"] == started.isoformat()


def test_start_submission_creates_new_session_when_no_draft(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    started = datetime.datetime(2026, 4, 24, 11, 0, 0)
    cursor.fetchone.side_effect = [
        {"id": 2, "max_attempts": None},
        None,
        {"id": 51, "started_at": started},
    ]
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    result = start_submission(StartSubmissionRequest(problem_id=2, student_name="sam"))

    assert result["session_id"] == 51
    assert result["has_draft"] is False
    assert result["code"] is None
    assert result["started_at"] == started.isoformat()
    conn.commit.assert_called_once()


def test_save_draft_session_not_found(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = None
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    with pytest.raises(HTTPException) as exc:
        save_draft(404, DraftRequest(code="x = 1"))

    assert exc.value.status_code == 404
    assert exc.value.detail == "Session not found"


def test_save_draft_success(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = {"id": 8, "submitted_at": None}
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    result = save_draft(8, DraftRequest(code="x = 1"))

    assert result == {"session_id": 8, "status": "saved"}
    cursor.execute.assert_any_call("UPDATE sessions SET code = %s WHERE id = %s", ("x = 1", 8))
    conn.commit.assert_called_once()


def test_save_draft_rejects_submitted_session(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = {"id": 9, "submitted_at": datetime.datetime.now()}
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    with pytest.raises(HTTPException) as exc:
        save_draft(9, DraftRequest(code="x = 1"))

    assert exc.value.status_code == 409
    assert exc.value.detail == "Session already submitted"


def test_submit_session_rejects_already_submitted(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = {
        "id": 12,
        "problem_id": 3,
        "student_name": "sam",
        "submitted_at": datetime.datetime.now(),
    }
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    with pytest.raises(HTTPException) as exc:
        submit_session(12, SubmitRequest(code="print('done')"))

    assert exc.value.status_code == 409
    assert exc.value.detail == "Already submitted"


def test_submit_session_not_found(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = None
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    with pytest.raises(HTTPException) as exc:
        submit_session(999, SubmitRequest(code="print('done')"))

    assert exc.value.status_code == 404
    assert exc.value.detail == "Session not found"


def test_submit_session_rejects_when_limit_reached(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.side_effect = [
        {"id": 12, "problem_id": 3, "student_name": "sam", "submitted_at": None},
        {"max_attempts": 1},
        {"cnt": 1},
    ]
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    with pytest.raises(HTTPException) as exc:
        submit_session(12, SubmitRequest(code="print('done')"))

    assert exc.value.status_code == 403
    assert exc.value.detail == "Submission limit reached"


def test_submit_session_success_serializes_logs(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.side_effect = [
        {"id": 12, "problem_id": 3, "student_name": "sam", "submitted_at": None},
        {"max_attempts": None},
    ]
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    req = SubmitRequest(
        code="print('done')",
        suggestion_log=[SuggestionLogEntry(time="1", action="accept", label="hint")],
        tab_switch_log=[TabSwitchEntry(time="2")],
        test_results=[SubmissionTestResult(input="1", expected="1", actual="1", passed=True)],
        paste_log=[PasteLogEntry(time="3", type="paste", charCount=5, preview="hello")],
    )

    result = submit_session(12, req)

    assert result == {"session_id": 12, "status": "submitted"}
    update_calls = [
        c for c in cursor.execute.call_args_list
        if "UPDATE sessions" in c.args[0]
    ]
    assert update_calls
    params = update_calls[0].args[1]
    assert '"action": "accept"' in params[1]
    assert '"time": "2"' in params[2]
    assert '"passed": true' in params[3]
    assert '"charCount": 5' in params[4]
    conn.commit.assert_called_once()


def test_get_session_not_found(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = None
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    with pytest.raises(HTTPException) as exc:
        get_session(404)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Session not found"


def test_get_session_success_submitted_flag(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = {"id": 5, "code": "print(1)", "submitted_at": datetime.datetime.now()}
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    result = get_session(5)

    assert result["session_id"] == 5
    assert result["code"] == "print(1)"
    assert result["submitted"] is True


def test_save_feedback_requires_auth_header():
    with pytest.raises(HTTPException) as exc:
        save_feedback(1, FeedbackRequest(feedback="Nice work"), authorization=None)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Missing or invalid token"


def test_save_feedback_rejects_non_teacher(monkeypatch):
    monkeypatch.setattr("routes_submissions.decode_token", lambda token: {"role": "student"})

    with pytest.raises(HTTPException) as exc:
        save_feedback(1, FeedbackRequest(feedback="Nice work"), authorization="Bearer abc")

    assert exc.value.status_code == 403
    assert exc.value.detail == "Only teachers can leave feedback"


def test_save_feedback_invalid_token(monkeypatch):
    def _raise(_token):
        raise Exception("bad token")

    monkeypatch.setattr("routes_submissions.decode_token", _raise)

    with pytest.raises(HTTPException) as exc:
        save_feedback(1, FeedbackRequest(feedback="Nice work"), authorization="Bearer abc")

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid or expired token"


def test_save_feedback_rejects_missing_session(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = None

    monkeypatch.setattr("routes_submissions.decode_token", lambda token: {"role": "teacher"})
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    with pytest.raises(HTTPException) as exc:
        save_feedback(100, FeedbackRequest(feedback="Nice work"), authorization="Bearer abc")

    assert exc.value.status_code == 404
    assert exc.value.detail == "Session not found"


def test_save_feedback_success(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = {"id": 7}

    monkeypatch.setattr("routes_submissions.decode_token", lambda token: {"role": "teacher"})
    monkeypatch.setattr("routes_submissions.get_connection", lambda: conn)

    result = save_feedback(7, FeedbackRequest(feedback="Great approach"), authorization="Bearer abc")

    assert result == {"session_id": 7, "status": "saved"}
    cursor.execute.assert_any_call(
        "UPDATE sessions SET feedback = %s WHERE id = %s",
        ("Great approach", 7),
    )
    conn.commit.assert_called_once()
