"""
app/core/client_ip.py

Resolves the real client IP for a request. Used as the rate-limit key
and for the IP recorded on refresh-token sessions.

Behind a reverse proxy or CDN the TCP peer is the proxy, not the
visitor, so using it alone would put every user in one rate-limit
bucket. Reading a forwarded header fixes that, but a client can send
any header it likes, so a forwarded header is trusted only when
CLIENT_IP_HEADER names one explicitly — which should be set only when
the API is reachable solely through the proxy that writes it. With no
setting the socket peer is used, which is correct for direct access
and local development.
"""

import ipaddress
from typing import Optional

from fastapi import Request

from app.core.config import settings


def _valid_ip(value: str) -> Optional[str]:
    """Returns the stripped value if it parses as an IP address, else None."""
    candidate = value.strip()
    try:
        ipaddress.ip_address(candidate)
    except ValueError:
        return None
    return candidate


def get_client_ip(request: Request) -> str:
    """
    Returns the visitor's IP. When CLIENT_IP_HEADER is set, reads that
    header: a single-value header such as CF-Connecting-IP is used as
    is, and X-Forwarded-For is read from the right, skipping the
    TRUSTED_PROXY_HOPS entries our own proxies appended (the leftmost
    entries are client-supplied and spoofable). A missing or malformed
    header falls back to the socket peer instead of failing the request.
    """
    peer = request.client.host if request.client else "unknown"
    header_name = settings.CLIENT_IP_HEADER.strip()
    if not header_name:
        return peer

    raw = request.headers.get(header_name)
    if not raw:
        return peer

    if header_name.lower() == "x-forwarded-for":
        parts = [part for part in raw.split(",") if part.strip()]
        hops = max(settings.TRUSTED_PROXY_HOPS, 1)
        if len(parts) < hops:
            return peer
        return _valid_ip(parts[-hops]) or peer

    return _valid_ip(raw) or peer
