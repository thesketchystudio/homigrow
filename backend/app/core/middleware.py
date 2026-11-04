"""
app/core/middleware.py

Request-scoped middleware. Currently just the slowapi in-process rate
limiter, applied to auth endpoints and the public property-enquiry
endpoint (POST /properties/{id}/enquire) — both are unauthenticated
and spam-prone. Other public write endpoints remain unlimited; expand
further only as new spam/abuse vectors are found. Requests are keyed
by the real client IP (app/core/client_ip.py) so users behind a proxy
are not pooled into one bucket. Counters live in process memory, which
assumes a single backend instance; swap to Redis-backed storage if the
backend ever scales past one instance.
"""

from slowapi import Limiter

from app.core.client_ip import get_client_ip

limiter = Limiter(key_func=get_client_ip)
