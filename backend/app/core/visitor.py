"""
app/core/visitor.py

Identifies anonymous visitors for property-view deduplication without
storing anything personal, and filters out automated clients.

A visitor is reduced to a keyed hash: the browser-supplied visitor id
when there is one (stable across IP changes), otherwise the client IP
plus user-agent. Only the hash is stored, so raw IPs never land in the
property_views table. The id is client-supplied and therefore forgeable;
the per-IP rate limit on the view endpoint is what bounds abuse of it.
"""

import hashlib
import hmac
from typing import Optional

from app.core.config import settings

# Substrings of user-agents that identify crawlers, link-preview fetchers
# and scripted HTTP clients. A basic first line of defence only — a
# scraper can fake its user-agent, so real bot detection belongs at the
# edge (CDN/WAF) once one is in place.
_BOT_MARKERS = (
    "bot",
    "crawl",
    "spider",
    "slurp",
    "preview",
    "facebookexternalhit",
    "whatsapp",
    "telegram",
    "curl",
    "wget",
    "python-requests",
    "httpx",
    "aiohttp",
    "go-http-client",
    "java/",
    "okhttp",
    "headless",
    "lighthouse",
)


def is_bot_user_agent(user_agent: Optional[str]) -> bool:
    """True for a missing user-agent or one containing a known automation marker."""
    if not user_agent or not user_agent.strip():
        return True
    lowered = user_agent.lower()
    return any(marker in lowered for marker in _BOT_MARKERS)


def visitor_fingerprint(client_ip: str, user_agent: str, visitor_id: Optional[str]) -> str:
    """
    Returns a hex HMAC identifying an anonymous visitor. Prefers the
    browser-supplied visitor id; falls back to IP + user-agent when the
    browser could not provide one (storage blocked, older client).
    """
    material = f"id:{visitor_id}" if visitor_id else f"ipua:{client_ip}|{user_agent}"
    return hmac.new(settings.JWT_SECRET.encode(), material.encode(), hashlib.sha256).hexdigest()
