"""
tests/core/test_client_ip.py

Covers app/core/client_ip.get_client_ip(): the socket peer is used by
default, forwarded headers are honoured only when CLIENT_IP_HEADER names
one, X-Forwarded-For is read from the trusted end (not the spoofable
left), and bad input falls back to the peer. Also checks end to end that
the rate limiter keys on the resolved IP so users behind one proxy are
not pooled into a single bucket.
"""

from starlette.requests import Request

from app.core.config import settings


def _request(peer: str = "10.0.0.1", headers: dict | None = None) -> Request:
    scope = {
        "type": "http",
        "headers": [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()],
        "client": (peer, 12345),
    }
    return Request(scope)


class TestGetClientIp:
    def test_defaults_to_socket_peer_and_ignores_forwarded_headers(self, monkeypatch):
        from app.core.client_ip import get_client_ip

        monkeypatch.setattr(settings, "CLIENT_IP_HEADER", "")

        request = _request(headers={"X-Forwarded-For": "1.2.3.4", "CF-Connecting-IP": "5.6.7.8"})

        assert get_client_ip(request) == "10.0.0.1"

    def test_single_value_header_is_used_when_configured(self, monkeypatch):
        from app.core.client_ip import get_client_ip

        monkeypatch.setattr(settings, "CLIENT_IP_HEADER", "CF-Connecting-IP")

        assert get_client_ip(_request(headers={"CF-Connecting-IP": "203.0.113.9"})) == "203.0.113.9"

    def test_x_forwarded_for_is_read_from_the_right_not_the_spoofable_left(self, monkeypatch):
        from app.core.client_ip import get_client_ip

        monkeypatch.setattr(settings, "CLIENT_IP_HEADER", "X-Forwarded-For")
        monkeypatch.setattr(settings, "TRUSTED_PROXY_HOPS", 1)

        request = _request(headers={"X-Forwarded-For": "6.6.6.6, 203.0.113.9"})

        assert get_client_ip(request) == "203.0.113.9"

    def test_multiple_trusted_hops_skip_our_own_proxies(self, monkeypatch):
        from app.core.client_ip import get_client_ip

        monkeypatch.setattr(settings, "CLIENT_IP_HEADER", "X-Forwarded-For")
        monkeypatch.setattr(settings, "TRUSTED_PROXY_HOPS", 2)

        request = _request(headers={"X-Forwarded-For": "6.6.6.6, 203.0.113.9, 172.16.0.5"})

        assert get_client_ip(request) == "203.0.113.9"

    def test_missing_header_falls_back_to_peer(self, monkeypatch):
        from app.core.client_ip import get_client_ip

        monkeypatch.setattr(settings, "CLIENT_IP_HEADER", "CF-Connecting-IP")

        assert get_client_ip(_request()) == "10.0.0.1"

    def test_malformed_header_falls_back_to_peer(self, monkeypatch):
        from app.core.client_ip import get_client_ip

        monkeypatch.setattr(settings, "CLIENT_IP_HEADER", "CF-Connecting-IP")

        assert get_client_ip(_request(headers={"CF-Connecting-IP": "not-an-ip"})) == "10.0.0.1"

    def test_too_few_forwarded_entries_falls_back_to_peer(self, monkeypatch):
        from app.core.client_ip import get_client_ip

        monkeypatch.setattr(settings, "CLIENT_IP_HEADER", "X-Forwarded-For")
        monkeypatch.setattr(settings, "TRUSTED_PROXY_HOPS", 2)

        assert get_client_ip(_request(headers={"X-Forwarded-For": "203.0.113.9"})) == "10.0.0.1"


class TestRateLimitIsPerClientIp:
    def test_different_forwarded_ips_do_not_share_a_rate_limit_bucket(self, client, monkeypatch):
        monkeypatch.setattr(settings, "CLIENT_IP_HEADER", "X-Forwarded-For")
        monkeypatch.setattr(settings, "TRUSTED_PROXY_HOPS", 1)
        # An unknown account, so repeated failures hit only the IP rate limit
        # and never the per-account lockout (which would answer 423).
        body = {"phone_or_email": "+919876540090", "password": "wrong-password"}

        for _ in range(5):
            assert client.post("/api/v1/auth/login", json=body, headers={"X-Forwarded-For": "198.51.100.1"}).status_code == 401
        blocked = client.post("/api/v1/auth/login", json=body, headers={"X-Forwarded-For": "198.51.100.1"})
        other_visitor = client.post("/api/v1/auth/login", json=body, headers={"X-Forwarded-For": "198.51.100.2"})

        assert blocked.status_code == 429
        assert other_visitor.status_code == 401
