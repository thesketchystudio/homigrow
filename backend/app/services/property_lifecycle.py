"""
app/services/property_lifecycle.py

Defines the property status state machine (draft -> pending -> active
-> sold/rented -> expired -> rejected) and validates transitions
between states.
"""

from app.models.enums import PropertyStatus

# Transition graph:
#
#   draft -> pending -> active -> sold | rented
#                          |  \-------> expired   (automatic, by expiry job)
#                          \--(re-activate)--< expired
#   pending -> rejected -> draft   (broker edits and resubmits)
#   active  -> pending             (on material edit, re-moderation)
#
# sold and rented are terminal states with no outgoing transitions.
_ALLOWED_TRANSITIONS: dict[PropertyStatus, frozenset[PropertyStatus]] = {
    PropertyStatus.draft: frozenset({PropertyStatus.pending}),
    PropertyStatus.pending: frozenset({PropertyStatus.active, PropertyStatus.rejected}),
    PropertyStatus.active: frozenset(
        {
            PropertyStatus.sold,
            PropertyStatus.rented,
            PropertyStatus.expired,
            PropertyStatus.pending,
        }
    ),
    PropertyStatus.expired: frozenset({PropertyStatus.active}),
    PropertyStatus.rejected: frozenset({PropertyStatus.draft}),
    PropertyStatus.sold: frozenset(),
    PropertyStatus.rented: frozenset(),
}


def transition_property_status(current: PropertyStatus, new: PropertyStatus) -> bool:
    """
    Validates a property status transition against the defined lifecycle.
    Returns False (does not raise) for invalid transitions so callers can
    handle rejection gracefully in the API layer rather than via exception.
    """
    return new in _ALLOWED_TRANSITIONS[current]
