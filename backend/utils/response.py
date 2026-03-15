"""
Shared response helpers for consistent API response shapes.

All endpoints return one of:
  { status: "success", message, data, timestamp }
  { status: "error",   message, code, timestamp }
"""

from datetime import datetime


def _now() -> str:
    return str(datetime.utcnow())


def success(data=None, message: str = "success") -> dict:
    """Standard success response."""
    return {"status": "success", "message": message, "data": data, "timestamp": _now()}


def error(message: str = "An error occurred", code: int = 400) -> dict:
    """Standard error response."""
    return {"status": "error", "message": message, "code": code, "timestamp": _now()}


def created(data=None, message: str = "Created") -> dict:
    """Response for successful resource creation (201-style)."""
    return {"status": "success", "message": message, "data": data, "timestamp": _now()}


def validation_error(message: str) -> dict:
    """Response for input validation failures."""
    return {"status": "fail", "message": message, "timestamp": _now()}
