"""
app/core/middleware.py

Request-scoped middleware. Currently just the slowapi in-process rate
limiter (ADR-010), applied to auth endpoints only (P2-T08) — full-app
rollout (search, media) is P4. Single-instance assumption per ADR-010;
swap to Redis-backed storage if the backend ever scales past one
instance.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
