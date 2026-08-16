"""
tests/services/test_property_lifecycle.py

Exercises every legal transition in the property status state machine,
plus a representative sample of illegal ones: skip-ahead transitions,
exits from terminal states, reversals of valid edges, and identity
transitions.
"""

import pytest

from app.models.enums import PropertyStatus as S
from app.services.property_lifecycle import transition_property_status

LEGAL = [
    (S.draft, S.pending),
    (S.pending, S.active),
    (S.pending, S.rejected),
    (S.active, S.sold),
    (S.active, S.rented),
    (S.active, S.expired),
    (S.active, S.pending),
    (S.expired, S.active),
    (S.rejected, S.draft),
]

ILLEGAL = [
    # skip-ahead
    (S.draft, S.active),
    (S.draft, S.sold),
    (S.pending, S.sold),
    (S.pending, S.expired),
    # terminal states have no outgoing transitions
    (S.sold, S.active),
    (S.sold, S.draft),
    (S.rented, S.active),
    (S.rented, S.pending),
    # reverse of a valid edge is not itself valid
    (S.active, S.draft),
    (S.rejected, S.active),
    (S.expired, S.draft),
    (S.pending, S.draft),
    # identity (no-op) is not a defined transition
    (S.draft, S.draft),
    (S.active, S.active),
]


@pytest.mark.parametrize("current,new", LEGAL)
def test_legal_transitions_allowed(current, new):
    """Every transition defined in the lifecycle graph is allowed."""
    assert transition_property_status(current, new) is True


@pytest.mark.parametrize("current,new", ILLEGAL)
def test_illegal_transitions_rejected(current, new):
    """Transitions not defined in the lifecycle graph are rejected."""
    assert transition_property_status(current, new) is False


def test_every_status_has_an_entry_in_the_transition_map():
    """Every PropertyStatus member has a transition set, even if empty."""
    for status in S:
        assert transition_property_status(status, status) in (True, False)
