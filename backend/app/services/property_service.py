"""
app/services/property_service.py

Public property-listing reads (05_API_Design.md §properties; 10_Phase_3.md
P3-T04). Only active listings are visible here — there is no owner-preview
path for pending/draft listings yet, since nothing today needs a broker to
view their own unpublished property ahead of moderation.
"""

from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import NotFoundError
from app.models.enums import PropertyStatus
from app.models.property import Property
from app.models.user import User


def get_property_detail(db: Session, property_id: UUID) -> Property:
    """Returns an active property with its media and broker eager-loaded, or 404s."""
    property_ = (
        db.query(Property)
        .options(
            joinedload(Property.media),
            joinedload(Property.broker).joinedload(User.broker_profile),
        )
        .filter(Property.id == property_id)
        .first()
    )
    if property_ is None or property_.status != PropertyStatus.active:
        raise NotFoundError("PROPERTY_NOT_FOUND", "Property not found.")
    return property_
