"""
Custom middleware: request ID injection and audit logging.
"""
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from loguru import logger


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Injects X-Request-ID into every request and response."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Logs API requests with timing for audit and monitoring."""

    # Paths to skip logging (health checks, static files)
    SKIP_PATHS = {"/health", "/favicon.ico", "/docs", "/redoc"}

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        start_time = time.time()

        # Extract request info
        method = request.method
        path = request.url.path
        request_id = getattr(request.state, "request_id", "-")

        response: Response = await call_next(request)

        duration_ms = (time.time() - start_time) * 1000

        logger.bind(
            request_id=request_id,
            method=method,
            path=path,
            status=response.status_code,
            duration_ms=round(duration_ms, 2),
        ).info(f"{method} {path} → {response.status_code} ({duration_ms:.1f}ms)")

        return response
