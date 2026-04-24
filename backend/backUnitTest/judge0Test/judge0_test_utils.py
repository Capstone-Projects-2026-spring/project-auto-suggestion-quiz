import asyncio

import httpx


class MockResponse:
    def __init__(self, payload, should_raise=False, text=""):
        self._payload = payload
        self._should_raise = should_raise
        self.text = text

    def raise_for_status(self):
        if self._should_raise:
            req = httpx.Request("POST", "http://judge0.local/submissions")
            resp = httpx.Response(502, request=req, text=self.text or "upstream error")
            raise httpx.HTTPStatusError("Judge0 error", request=req, response=resp)

    def json(self):
        return self._payload


class MockAsyncClient:
    def __init__(self, response=None, error=None):
        self._response = response
        self._error = error

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return False

    async def post(self, *args, **kwargs):
        if self._error:
            raise self._error
        return self._response


def run_async(coro):
    return asyncio.run(coro)
