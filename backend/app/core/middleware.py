"""
app/core/middleware.py

Request-scoped middleware. Currently just the slowapi in-process rate
limiter, applied to auth endpoints only — rolling it out beyond auth
(search, media) is future work. This assumes a single backend
instance; swap to Redis-backed storage if the backend ever scales past
one instance.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
