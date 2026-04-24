# Backend Unit Testing

This page documents the backend unit-test organization, what each suite validates, and the standard commands used to run tests and coverage.

## Test Location

All backend unit tests are under:

- `backend/backUnitTest/`

## How To Run

From the repository root:

```bash
cd backend
venv/bin/python -m pytest backUnitTest -q
```

Run coverage for backend app modules:

```bash
cd backend
venv/bin/python -m pytest backUnitTest -q \
  --cov=aiSuggestion \
  --cov=auth \
  --cov=database \
  --cov=main \
  --cov=routes_ai \
  --cov=routes_auth \
  --cov=routes_judge \
  --cov=routes_problems \
  --cov=routes_quiz \
  --cov=routes_submissions \
  --cov-report=term-missing
```

## Suite Map

| Suite | Files | Focus |
| --- | --- | --- |
| `aiTest` | `test_aiResponse.py`, `test_aiRetoken.py`, `test_aiSuggestion.py`, `test_routes_ai.py` | AI suggestion/tokenization behavior and `/ai/*` route handling |
| `authTest` | `test_auth.py`, `test_loginRoute.py`, `test_register.py`, `test_otp_and_devlogin.py` | Password hashing, JWT auth, login/register, dev-login, OTP auth flows |
| `judge0Test` | `test_judge0_success.py`, `test_judge0_failure.py`, `judge0_test_utils.py` | Judge0 execution success/failure paths and upstream error mapping |
| `problemsTest` | `test_problems.py`, `test_timer.py` | Problem CRUD, helper branches, grading, permissions, access code behavior, and time limit behavior |
| `submissionsTest` | `test_submissions.py` | Submission lifecycle: start, draft, submit, retrieve, feedback |
| `quizTest` | `test_quiz.py` | Quiz auth, submission, attempt listing/detail retrieval |
| `mainTest` | `test_main.py` | App startup/migration branches and root endpoint |

## Detailed Test Inventory

This section lists every test function currently in `backUnitTest`.

### aiTest

- `test_aiResponse.py`: `test_ai_suggestion_returns_response`, `test_ai_suggestion_incorrect_mode_branch`
- `test_aiRetoken.py`: `test_ai_retokens_syntax_error`
- `test_aiSuggestion.py`: `test_response`, `test_3_suggestions`, `test_fields`, `test_api_raises_exception`
- `test_routes_ai.py`: `test_ai_suggestion_route_success`, `test_ai_suggestion_route_maps_exception_to_500`, `test_autofill_short_input_returns_error_payload`, `test_autofill_success`, `test_autofill_malformed_json_maps_to_500`

### authTest

- `test_auth.py`: `test_create_token_and_decode`
- `test_loginRoute.py`: `test_loginRoute_success`, `test_loginRoute_wrong_password`
- `test_register.py`: `test_register_success`, `test_register_email_already_exists`, `test_register_invalid_role`
- `test_otp_and_devlogin.py`: `test_dev_login_disabled_when_debug_false`, `test_dev_login_success`, `test_dev_login_seed_teacher_missing`, `test_otp_request_requires_supabase_config`, `test_otp_verify_requires_supabase_config`, `test_otp_request_success`, `test_otp_request_accepts_204`, `test_otp_request_upstream_failure_maps_to_502`, `test_otp_verify_invalid_or_expired`, `test_otp_verify_existing_user_success`, `test_otp_verify_creates_user_if_missing`, `test_otp_verify_uses_top_level_email_when_user_email_missing`, `test_otp_verify_falls_back_to_request_email`

### judge0Test

- `test_judge0_success.py`: `test_build_judge0_headers_without_token`, `test_build_judge0_headers_with_token`, `test_encode_decode_judge0_field_round_trip`, `test_execute_code_success`
- `test_judge0_failure.py`: `test_decode_invalid_base64_returns_original_string`, `test_execute_code_rejects_unsupported_language`, `test_execute_code_requires_judge0_url`, `test_execute_code_returns_status_description_when_not_accepted`, `test_execute_code_maps_http_status_error_to_502`, `test_execute_code_maps_unexpected_errors_to_500`

### problemsTest

- `test_timer.py`: `test_create_problem_request_accepts_time_limit_seconds`, `test_edit_problem_request_accepts_time_limit_seconds`, `test_create_problem_persists_time_limit_seconds`, `test_edit_problem_updates_time_limit_seconds`, `test_get_problem_by_code_returns_time_limit_seconds`, `test_get_problem_by_code_requires_6_digit_code`
- `test_problems.py`: `test_get_current_user_missing_token`, `test_get_current_user_invalid_token`, `test_generate_unique_access_code_success`, `test_generate_unique_access_code_failure`, `test_build_problem_handles_invalid_section_code_json_and_builds_submissions`, `test_create_problem_forbidden_for_student`, `test_create_problem_inserts_sections_suggestions_and_testcases`, `test_create_problem_rolls_back_on_exception`, `test_get_teacher_problems_forbidden_student`, `test_get_teacher_problems_success`, `test_edit_problem_not_found`, `test_edit_problem_teacher_cannot_edit_other_teacher`, `test_edit_problem_forbidden_for_student`, `test_edit_problem_updates_all_supported_fields`, `test_delete_problem_not_found`, `test_delete_problem_teacher_cannot_delete_other_teacher`, `test_delete_problem_admin_success`, `test_delete_problem_forbidden_for_student`, `test_grade_submission_invalid_range`, `test_grade_submission_problem_not_found`, `test_grade_submission_teacher_cannot_grade_other_teacher`, `test_grade_submission_not_found`, `test_grade_submission_success`, `test_grade_submission_forbidden_for_student`, `test_get_problem_by_code_not_found`, `test_get_problem_by_code_success`

### submissionsTest

- `test_submissions.py`: `test_start_submission_problem_not_found`, `test_start_submission_submission_limit_reached`, `test_start_submission_returns_existing_draft`, `test_start_submission_creates_new_session_when_no_draft`, `test_save_draft_session_not_found`, `test_save_draft_success`, `test_save_draft_rejects_submitted_session`, `test_submit_session_rejects_already_submitted`, `test_submit_session_not_found`, `test_submit_session_rejects_when_limit_reached`, `test_submit_session_success_serializes_logs`, `test_get_session_not_found`, `test_get_session_success_submitted_flag`, `test_save_feedback_requires_auth_header`, `test_save_feedback_rejects_non_teacher`, `test_save_feedback_invalid_token`, `test_save_feedback_rejects_missing_session`, `test_save_feedback_success`

### quizTest

- `test_quiz.py`: `test_get_user_from_token_missing_header`, `test_get_user_from_token_expired`, `test_get_user_from_token_invalid`, `test_submit_quiz_problem_not_found`, `test_submit_quiz_success_and_score`, `test_get_attempts_student_forbidden_for_other_user`, `test_get_attempts_teacher_success`, `test_get_attempt_detail_not_found`, `test_get_attempt_detail_student_access_denied`, `test_get_attempt_detail_success`

### mainTest

- `test_main.py`: `test_run_migrations_renames_and_converts`, `test_run_migrations_adds_seconds_column`, `test_run_migrations_noop_when_seconds_exists`, `test_root_health_check_payload`

## Shared Test Utilities

Common mock helpers are centralized in:

- `backend/backUnitTest/test_helpers.py`

This keeps DB mock setup consistent and avoids duplicated helper code across suites.



