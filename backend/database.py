import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "quiz.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            email       TEXT NOT NULL UNIQUE,
            password    TEXT NOT NULL,
            role        TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS problems (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            access_code         TEXT NOT NULL UNIQUE,
            title               TEXT NOT NULL,
            description         TEXT NOT NULL,
            distractor_mode     TEXT NOT NULL CHECK (distractor_mode IN ('ai', 'prewritten')),
            num_distractors     INTEGER,
            max_generations     INTEGER,
            max_attempts        INTEGER,
            time_limit_minutes  INTEGER,
            allow_copy_paste    INTEGER NOT NULL DEFAULT 1 CHECK (allow_copy_paste IN (0, 1)),
            track_tab_switching INTEGER NOT NULL DEFAULT 0 CHECK (track_tab_switching IN (0, 1)),
            created_at          TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS problem_languages (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            problem_id  INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
            language    TEXT NOT NULL,
            boilerplate TEXT NOT NULL DEFAULT '',
            UNIQUE(problem_id, language)
        );

        CREATE TABLE IF NOT EXISTS problem_suggestions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            problem_id  INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
            language    TEXT NOT NULL,
            is_correct  INTEGER NOT NULL CHECK(is_correct IN (0,1)),
            content     TEXT NOT NULL,
            UNIQUE(problem_id, language, is_correct, content)
        );
    """)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print(f"Database initialized at {DB_PATH}")
