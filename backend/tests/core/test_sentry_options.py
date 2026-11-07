"""
tests/core/test_sentry_options.py

Covers the Sentry client settings: sampled tracing, no default PII and no trace headers on outgoing requests.
"""

import pytest

from app.core.config import Settings
from app.main import sentry_options


def test_traces_are_sampled_not_exhaustive_by_default():
    assert Settings.model_fields["SENTRY_TRACES_SAMPLE_RATE"].default == 0.1


def test_default_pii_is_never_sent():
    assert sentry_options()["send_default_pii"] is False


def test_trace_headers_are_never_added_to_outgoing_requests():
    assert sentry_options()["trace_propagation_targets"] == []


def test_sample_rate_comes_from_settings(monkeypatch):
    monkeypatch.setattr("app.main.settings.SENTRY_TRACES_SAMPLE_RATE", 0.25)
    assert sentry_options()["traces_sample_rate"] == 0.25


@pytest.mark.parametrize("rate", [-0.1, 1.5])
def test_out_of_range_sample_rate_is_rejected(rate):
    with pytest.raises(ValueError):
        Settings(SENTRY_TRACES_SAMPLE_RATE=rate)
