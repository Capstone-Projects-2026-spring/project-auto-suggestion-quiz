"""
seed.py — re-seeds the Supabase database with the placeholder teacher and
sample problem. Wipes existing seed data first.

Run from the backend directory:
    python3 seed.py

Requires DATABASE_URL to be set in .env.
"""
import json
import os
import sys
from dotenv import load_dotenv

load_dotenv()

import psycopg2
import psycopg2.extras

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    sys.exit("ERROR: DATABASE_URL is not set in your environment / .env file.")

conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
cursor = conn.cursor()

# ── Wipe existing seed data ────────────────────────────────────────────────────
cursor.execute("DELETE FROM suggestions")
cursor.execute("DELETE FROM sections")
cursor.execute("DELETE FROM test_cases")
cursor.execute("DELETE FROM problems")
cursor.execute("DELETE FROM users")
conn.commit()
print("Cleared existing data.")

# ── Seed teacher ───────────────────────────────────────────────────────────────
cursor.execute(
    "INSERT INTO users (name, email, role) VALUES (%s, %s, %s) RETURNING id",
    ("Seed Teacher", "seed@autoquiz.dev", "teacher"),
)
user_id = cursor.fetchone()["id"]
print(f"Created seed teacher (id={user_id})")

# ── Seed problem ───────────────────────────────────────────────────────────────
cursor.execute(
    """INSERT INTO problems
       (user_id, access_code, title, description, language, languages,
        time_limit_minutes, max_attempts, allow_copy_paste, track_tab_switching)
       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
       RETURNING id""",
    (
        user_id,
        "123456",
        "Most Frequent Element",
        (
            "Given a list of integers, return the element that appears most frequently.\n\n"
            "You may assume there is always a single element with the highest frequency.\n\n"
            "Example:\n"
            "  most_frequent([1, 3, 2, 3, 1, 3]) -> 3\n"
            "  most_frequent([4, 4, 1, 2])       -> 4"
        ),
        "python",
        json.dumps(["python"]),
        None, None, True, False,
    ),
)
problem_id = cursor.fetchone()["id"]
print(f"Created problem '123456' (id={problem_id})")

# ── Sections ───────────────────────────────────────────────────────────────────
SECTIONS = [
    {
        "order_index": 0,
        "label": "Choose a Data Structure",
        "code": {
            "python": (
                "def most_frequent(nums: list[int]) -> int:\n"
                "    # Initialize a data structure to keep track of how many\n"
                "    # times each number appears in the list\n"
                "    "
            )
        },
    },
    {
        "order_index": 1,
        "label": "Write a Loop",
        "code": {
            "python": (
                "    # Loop over the list and populate your data structure\n"
                "    # with the count of each element\n"
                "    "
            )
        },
    },
    {
        "order_index": 2,
        "label": "Return the Result",
        "code": {
            "python": (
                "    # Return the element that has the highest count\n"
                "    "
            )
        },
    },
]

for section in SECTIONS:
    cursor.execute(
        """INSERT INTO sections (problem_id, order_index, label, code)
           VALUES (%s, %s, %s, %s)
           RETURNING id""",
        (problem_id, section["order_index"], section["label"], json.dumps(section["code"])),
    )
    section_id = cursor.fetchone()["id"]
    print(f"  Created section '{section['label']}' (id={section_id})")

    cursor.execute(
        "INSERT INTO suggestions (section_id, content, is_correct, source) VALUES (%s, %s, %s, %s)",
        (section_id, "", True, "ai"),
    )

conn.commit()
conn.close()
print("\nSeed complete.")
