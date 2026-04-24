import os
import sys
from unittest.mock import MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import main


def _make_conn_cm_with_cursor(fetch_rows):
    cur = MagicMock()
    cur.fetchall.return_value = fetch_rows

    cursor_cm = MagicMock()
    cursor_cm.__enter__.return_value = cur
    cursor_cm.__exit__.return_value = False

    conn = MagicMock()
    conn.cursor.return_value = cursor_cm

    conn_cm = MagicMock()
    conn_cm.__enter__.return_value = conn
    conn_cm.__exit__.return_value = False

    return conn_cm, conn, cur


def test_run_migrations_renames_and_converts(monkeypatch):
    conn_cm, conn, cur = _make_conn_cm_with_cursor([
        {"column_name": "time_limit_minutes"}
    ])
    monkeypatch.setattr("main.get_connection", lambda: conn_cm)

    main._run_migrations()

    cur.execute.assert_any_call(
        "ALTER TABLE problems RENAME COLUMN time_limit_minutes TO time_limit_seconds"
    )
    cur.execute.assert_any_call(
        "UPDATE problems SET time_limit_seconds = time_limit_seconds * 60 WHERE time_limit_seconds IS NOT NULL"
    )
    conn.commit.assert_called_once()


def test_run_migrations_adds_seconds_column(monkeypatch):
    conn_cm, conn, cur = _make_conn_cm_with_cursor([])
    monkeypatch.setattr("main.get_connection", lambda: conn_cm)

    main._run_migrations()

    cur.execute.assert_any_call("ALTER TABLE problems ADD COLUMN time_limit_seconds INTEGER")
    conn.commit.assert_called_once()


def test_run_migrations_noop_when_seconds_exists(monkeypatch):
    conn_cm, conn, cur = _make_conn_cm_with_cursor([
        {"column_name": "time_limit_seconds"}
    ])
    monkeypatch.setattr("main.get_connection", lambda: conn_cm)

    main._run_migrations()

    executed_sql = [call.args[0] for call in cur.execute.call_args_list]
    assert "ALTER TABLE problems ADD COLUMN time_limit_seconds INTEGER" not in executed_sql
    assert "ALTER TABLE problems RENAME COLUMN time_limit_minutes TO time_limit_seconds" not in executed_sql
    conn.commit.assert_called_once()


def test_root_health_check_payload():
    payload = main.root()

    assert payload == {"status": "ok", "message": "AutoSuggestion Quiz API is running"}
