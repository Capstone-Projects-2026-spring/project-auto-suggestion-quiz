import base64
import binascii
import os

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/code", tags=["code"])

LANGUAGE_IDS = {
    "python": 71,
    "javascript": 63,
    "c": 50,
    "java": 62,
}


class CodeExecutionRequest(BaseModel):
    code: str
    language: str
    input: str = ""


class CodeExecutionResponse(BaseModel):
    output: str
    error: str = ""


def build_judge0_headers() -> dict[str, str]:
    headers = {"content-type": "application/json"}

    rapidapi_key = os.getenv("JUDGE0_API_KEY")
    if rapidapi_key:
        headers["X-RapidAPI-Key"] = rapidapi_key
        headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com"

    auth_token = os.getenv("JUDGE0_AUTH_TOKEN")
    if auth_token:
        headers["X-Auth-Token"] = auth_token

    return headers


def decode_judge0_field(value: str | None) -> str:
    if not value:
        return ""

    try:
        return base64.b64decode(value).decode("utf-8", errors="replace")
    except (binascii.Error, ValueError):
        return value


def encode_judge0_field(value: str) -> str:
    return base64.b64encode(value.encode("utf-8")).decode("ascii")


@router.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(req: CodeExecutionRequest) -> CodeExecutionResponse:
    if req.language not in LANGUAGE_IDS:
        raise HTTPException(status_code=400, detail="Unsupported language")

    judge0_url = os.getenv("JUDGE0_URL", "").strip()
    if not judge0_url:
        raise HTTPException(status_code=500, detail="JUDGE0_URL is not configured")

    submit_url = f"{judge0_url.rstrip('/')}/submissions?base64_encoded=true&wait=true"
    headers = build_judge0_headers()
    payload = {
        "source_code": encode_judge0_field(req.code),
        "language_id": LANGUAGE_IDS[req.language],
        "stdin": encode_judge0_field(req.input),
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(submit_url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()

            stdout = decode_judge0_field(result.get("stdout"))
            stderr = decode_judge0_field(result.get("stderr"))
            compile_output = decode_judge0_field(result.get("compile_output"))
            message = decode_judge0_field(result.get("message"))
            status_description = ((result.get("status") or {}).get("description") or "").strip()

            error_text = stderr or compile_output or message
            if not error_text and status_description and status_description != "Accepted":
                error_text = status_description

            return CodeExecutionResponse(
                output=stdout,
                error=error_text,
            )
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text.strip() or str(exc)
            raise HTTPException(status_code=502, detail=f"Judge0 request failed: {detail}")
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to execute code: {str(exc)}")
