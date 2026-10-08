"""
app/core/middleware.py

Request-scoped middleware. Currently just the slowapi in-process rate
limiter, applied to auth endpoints and the public property-enquiry
endpoint (POST /properties/{id}/enquire) — both are unauthenticated
and spam-prone. Other public write endpoints remain unlimited; expand
further only as new spam/abuse vectors are found. This assumes a
single backend instance; swap to Redis-backed storage if the backend
ever scales past one instance.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
