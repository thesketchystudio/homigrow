"""
app/services/broker_property_service.py

Broker-authenticated writes for the Post Property wizard: create, edit,
media upload, and submit-for-moderation. Kept separate from
property_service.py, which is scoped to public/unauthenticated reads of
active listings only — mixing owner-scoped writes into that module
would break its existing "no owner-preview path" contract.
"""

from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationFailed
from app.models.enums import MediaType, PropertyStatus
from app.models.property import Property, PropertyMedia
from app.models.user import User
from app.schemas.properties import PropertyCreateRequest
from app.services import storage_service
from app.services.property_lifecycle import transition_property_status


def _get_owned_property(db: Session, broker: User, property_id: UUID) -> Property:
    """Loads a property with its media eager-loaded, 404s if missing, 403s if not owned by broker."""
    property_ = (
        db.query(Property)
        .options(joinedload(Property.media), joinedload(Property.broker))
        .filter(Property.id == property_id)
        .first()
    )
    if property_ is None:
        raise NotFoundError("PROPERTY_NOT_FOUND", "Property not found.")
    if property_.broker_id != broker.id:
        raise ForbiddenError("FORBIDDEN", "You do not have permission to access this property.")
    return property_


def create_property(db: Session, broker: User, data: PropertyCreateRequest) -> Property:
    """
    Creates a new draft listing owned by the broker. Fires once, at the
    end of the Post Property wizard (after Steps 1 and 2 have been
    collected client-side) — see PropertyCreateRequest's docstring for
    why the row can't be created any earlier.
    """
    property_ = Property(
        broker_id=broker.id,
        status=PropertyStatus.draft,
        title=data.title,
        listing_type=data.listing_type,
        property_type=data.property_type,
        price=data.price,
        maintenance_monthly=data.maintenance_monthly,
        deposit=data.deposit,
        is_negotiable=data.is_negotiable,
        bhk=data.bhk,
        bathrooms=data.bathrooms,
        area_sqft=data.area_sqft,
        furnishing=data.furnishing,
        built_year=data.built_year,
        amenities=data.amenities,
        plot_details=data.plot_details.model_dump() if data.plot_details else None,
        land_details=data.land_details.model_dump() if data.land_details else None,
        address_line=data.address_line,
        locality=data.locality,
        city=data.city,
        state=data.state,
        pincode=data.pincode,
        landmark=data.landmark,
    )
    db.add(property_)
    db.commit()
    db.refresh(property_)
    return property_


def add_media(db: Session, broker: User, property_id: UUID, uploads: list[tuple[bytes, str]]) -> list[PropertyMedia]:
    """
    Uploads each (content, content_type) pair as a property photo and
    creates its PropertyMedia row. The first photo ever uploaded for a
    property becomes its cover image.
    """
    property_ = _get_owned_property(db, broker, property_id)
    next_position = len(property_.media)
    has_cover = any(media.is_cover for media in property_.media)

    created: list[PropertyMedia] = []
    for offset, (content, content_type) in enumerate(uploads):
        url = storage_service.upload_property_image(property_.id, content, content_type)
        media = PropertyMedia(
            property_id=property_.id,
            media_type=MediaType.image,
            url=url,
            position=next_position + offset,
            is_cover=not has_cover and offset == 0,
        )
        db.add(media)
        created.append(media)

    db.commit()
    for media in created:
        db.refresh(media)
    return created


def submit_property(db: Session, broker: User, property_id: UUID) -> Property:
    """
    Final step of the Post Property wizard: moves a draft to pending
    (broker moderation queue). Requires at least one cover photo — a
    listing with no photos isn't a meaningful submission.
    """
    property_ = _get_owned_property(db, broker, property_id)
    if not any(media.is_cover for media in property_.media):
        raise ValidationFailed(
            "MEDIA_REQUIRED",
            "Add at least one photo before submitting this listing.",
            {"media": "Add at least one photo before submitting this listing."},
        )
    if not transition_property_status(property_.status, PropertyStatus.pending):
        raise ValidationFailed(
            "INVALID_STATUS_TRANSITION",
            f"Cannot submit a listing in '{property_.status.value}' status.",
        )
    property_.status = PropertyStatus.pending
    db.commit()
    db.refresh(property_)
    return property_
