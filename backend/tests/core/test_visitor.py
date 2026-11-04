"""
tests/core/test_visitor.py

Covers app/core/visitor.py: bot user-agent detection and the anonymous
visitor fingerprint (stable per visitor id, falls back to IP + user-agent,
and never contains the raw inputs).
"""

from app.core.visitor import is_bot_user_agent, visitor_fingerprint


class TestIsBotUserAgent:
    def test_missing_or_blank_user_agent_is_a_bot(self):
        assert is_bot_user_agent(None)
        assert is_bot_user_agent("   ")

    def test_known_automation_markers_are_bots(self):
        for agent in ("Mozilla/5.0 (compatible; Googlebot/2.1)", "WhatsApp/2.23.1", "curl/8.4.0", "Slackbot-LinkExpanding 1.0", "python-requests/2.34"):
            assert is_bot_user_agent(agent), agent

    def test_ordinary_browsers_are_not_bots(self):
        assert not is_bot_user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36")
        assert not is_bot_user_agent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1")


class TestVisitorFingerprint:
    def test_same_visitor_id_gives_same_hash_even_if_ip_changes(self):
        assert visitor_fingerprint("1.1.1.1", "UA", "visitor-abc-123") == visitor_fingerprint("2.2.2.2", "UA2", "visitor-abc-123")

    def test_different_visitor_ids_differ(self):
        assert visitor_fingerprint("1.1.1.1", "UA", "visitor-abc-123") != visitor_fingerprint("1.1.1.1", "UA", "visitor-xyz-789")

    def test_without_visitor_id_ip_and_user_agent_both_matter(self):
        base = visitor_fingerprint("1.1.1.1", "UA", None)
        assert base == visitor_fingerprint("1.1.1.1", "UA", None)
        assert base != visitor_fingerprint("1.1.1.2", "UA", None)
        assert base != visitor_fingerprint("1.1.1.1", "UA-other", None)

    def test_hash_is_fixed_width_hex_and_hides_inputs(self):
        value = visitor_fingerprint("203.0.113.9", "UA", None)
        assert len(value) == 64 and "203.0.113.9" not in value
