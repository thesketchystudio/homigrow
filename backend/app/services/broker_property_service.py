"""
app/services/broker_property_service.py

Broker-authenticated writes for the Post Property wizard (create, edit,
media upload, submit-for-moderation) plus the one owner-scoped read a
broker needs: their own listings across every status. Kept separate from
property_service.py, which is scoped to public/unauthenticated reads of
active listings only — mixing owner-scoped access into that module
would break its existing "no owner-preview path" contract.
"""

from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationFailed
from app.models.enums import ListingType, MediaType, PropertyStatus
from app.models.lead import Lead
from app.models.property import Property, PropertyMedia
from app.models.saved_property import SavedProperty
from app.models.user import User
from app.schemas.properties import (
    BrokerPropertyDetailRead,
    BrokerPropertyLeadSummary,
    BrokerPropertyListItem,
    PropertyCreateRequest,
    PropertyRead,
    PropertyUpdateRequest,
)
from app.services import storage_service
from app.services._property_query_helpers import build_property_list_item, cover_image_subquery
from app.services.property_lifecycle import transition_property_status

# How many of a property's most recent leads the Property Detail page's
# Recent Leads card shows — a product/layout constraint (the card has room
# for a handful of rows, not the full pipeline), not a pagination limit.
RECENT_LEADS_LIMIT = 4


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


def list_my_properties(db: Session, broker: User) -> list[BrokerPropertyListItem]:
    """
    Every property owned by broker, across every status (draft included),
    newest first — backs the broker Dashboard's empty-state check and its
    listing list once there's at least one.
    """
    cover_image_subq = cover_image_subquery()
    rows = (
        db.query(Property, cover_image_subq.label("cover_image_url"))
        .filter(Property.broker_id == broker.id)
        .order_by(Property.created_at.desc())
        .all()
    )
    return [
        BrokerPropertyListItem(**build_property_list_item(property_, cover_image_url), status=property_.status)
        for property_, cover_image_url in rows
    ]


def get_property_detail(db: Session, broker: User, property_id: UUID) -> BrokerPropertyDetailRead:
    """
    Returns one of the broker's own properties in full detail, any status
    (unlike property_service.get_property_detail, which is public/active-
    only) — backs the Property Detail page reached by clicking a listing
    row. Adds the Performance card's real, computed numbers: leads_count
    and recent_leads from the Lead table, shortlisted_count from the
    SavedProperty watchlist join table. There is no per-day view time
    series anywhere in the schema, so that chart isn't backed here at all.
    """
    property_ = _get_owned_property(db, broker, property_id)
    leads = db.query(Lead).filter(Lead.property_id == property_id).order_by(Lead.created_at.desc()).all()
    shortlisted_count = db.query(func.count(SavedProperty.property_id)).filter(SavedProperty.property_id == property_id).scalar()
    return BrokerPropertyDetailRead(
        **PropertyRead.model_validate(property_).model_dump(),
        views_count=property_.views_count,
        leads_count=len(leads),
        shortlisted_count=shortlisted_count,
        recent_leads=[BrokerPropertyLeadSummary.model_validate(lead) for lead in leads[:RECENT_LEADS_LIMIT]],
    )


def close_property(db: Session, broker: User, property_id: UUID) -> Property:
    """
    Closes an active listing: marks a sale listing "sold" or a rent/PG
    listing "rented" — the Property Detail page's "Mark as Sold"/"Mark as
    Rented" action, which the lifecycle state machine treats as the same
    active -> sold|rented transition. Reversible via reopen_property
    below, for an accidental click.
    """
    property_ = _get_owned_property(db, broker, property_id)
    target_status = PropertyStatus.rented if property_.listing_type in (ListingType.rent, ListingType.pg) else PropertyStatus.sold
    if not transition_property_status(property_.status, target_status):
        raise ValidationFailed(
            "INVALID_STATUS_TRANSITION",
            f"Cannot mark a listing in '{property_.status.value}' status as {target_status.value}.",
        )
    property_.status = target_status
    db.commit()
    db.refresh(property_)
    return property_


def reopen_property(db: Session, broker: User, property_id: UUID) -> Property:
    """
    Reopens a sold or rented listing back to active — undoes an
    accidental close_property click. Nothing else about the listing
    changes; a broker who genuinely wants to re-list would edit and
    resubmit it instead.
    """
    property_ = _get_owned_property(db, broker, property_id)
    if not transition_property_status(property_.status, PropertyStatus.active):
        raise ValidationFailed(
            "INVALID_STATUS_TRANSITION",
            f"Cannot reopen a listing in '{property_.status.value}' status.",
        )
    property_.status = PropertyStatus.active
    db.commit()
    db.refresh(property_)
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
        price_per_sqft=data.price_per_sqft,
        token_amount=data.token_amount,
        maintenance_monthly=data.maintenance_monthly,
        deposit=data.deposit,
        is_negotiable=data.is_negotiable,
        price_flexibility=data.price_flexibility,
        payment_structure=data.payment_structure,
        stamp_duty_percent=data.stamp_duty_percent,
        registration_fee_percent=data.registration_fee_percent,
        brokerage_included=data.brokerage_included,
        brokerage_percent=data.brokerage_percent,
        bhk=data.bhk,
        bathrooms=data.bathrooms,
        area_sqft=data.area_sqft,
        facing=data.facing,
        furnishing=data.furnishing,
        built_year=data.built_year,
        amenities=data.amenities,
        plot_details=data.plot_details.model_dump() if data.plot_details else None,
        land_details=data.land_details.model_dump() if data.land_details else None,
        pg_details=data.pg_details.model_dump() if data.pg_details else None,
        is_jv_property=data.is_jv_property,
        jv_details=data.jv_details.model_dump() if data.jv_details else None,
        virtual_tour_url=data.virtual_tour_url,
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


def update_property(db: Session, broker: User, property_id: UUID, data: PropertyUpdateRequest) -> Property:
    """
    Applies a partial edit to a broker-owned listing — the Edit Listing
    form's submit action. Only fields present on the request are touched;
    the plot/land/pg/jv JSONB blobs are replaced whole when present, same
    as create_property, since nothing partially merges them elsewhere
    either. Editing a currently-active listing sends it back to pending
    for admin re-moderation, per the transition property_lifecycle.py
    already documents; a draft/pending/rejected listing hasn't been
    published yet, so its status is left untouched.
    """
    property_ = _get_owned_property(db, broker, property_id)
    updates = data.model_dump(exclude_unset=True)

    for field in ("plot_details", "land_details", "pg_details", "jv_details"):
        value = getattr(data, field, None)
        if field in updates:
            updates[field] = value.model_dump() if value is not None else None

    for field, value in updates.items():
        setattr(property_, field, value)

    if property_.status == PropertyStatus.active and transition_property_status(property_.status, PropertyStatus.pending):
        property_.status = PropertyStatus.pending

    db.commit()
    db.refresh(property_)
    return property_


def delete_media(db: Session, broker: User, property_id: UUID, media_id: UUID) -> None:
    """
    Removes one photo/video from a listing's gallery — the Edit Listing
    form's photo grid delete action. If the removed item was the cover
    image, promotes the next-lowest-position remaining item so the listing
    is never left without one. Does not delete the underlying storage
    object; PropertyMedia rows are the source of truth for what's shown,
    and this codebase doesn't clean up orphaned storage objects elsewhere.
    """
    property_ = _get_owned_property(db, broker, property_id)
    media = db.query(PropertyMedia).filter(PropertyMedia.id == media_id, PropertyMedia.property_id == property_.id).first()
    if media is None:
        raise NotFoundError("MEDIA_NOT_FOUND", "This media item was not found on this property.")

    was_cover = media.is_cover
    db.delete(media)
    db.flush()

    if was_cover:
        next_cover = (
            db.query(PropertyMedia)
            .filter(PropertyMedia.property_id == property_.id)
            .order_by(PropertyMedia.position)
            .first()
        )
        if next_cover is not None:
            next_cover.is_cover = True

    db.commit()


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


def add_video(db: Session, broker: User, property_id: UUID, content: bytes, content_type: str) -> PropertyMedia:
    """
    Uploads one property video (walkthrough or drone footage) and creates
    its PropertyMedia row. Ordered after any existing media, and never
    treated as the cover image — cover selection stays photo-only.
    """
    property_ = _get_owned_property(db, broker, property_id)
    url = storage_service.upload_property_video(property_.id, content, content_type)
    media = PropertyMedia(
        property_id=property_.id,
        media_type=MediaType.video,
        url=url,
        position=len(property_.media),
        is_cover=False,
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media


def upload_jv_agreement(db: Session, broker: User, property_id: UUID, content: bytes, content_type: str) -> Property:
    """
    Uploads the JV agreement document for a property already flagged as a
    joint venture and records its (private) object key on jv_details.
    """
    property_ = _get_owned_property(db, broker, property_id)
    if not property_.is_jv_property:
        raise ValidationFailed(
            "NOT_JV_PROPERTY",
            "This property isn't flagged as a JV property.",
            {"jv_details": "This property isn't flagged as a JV property."},
        )
    object_key = storage_service.upload_property_document(property_.id, content, content_type)
    property_.jv_details = {**(property_.jv_details or {}), "agreement_document_key": object_key}
    db.commit()
    db.refresh(property_)
    return property_


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
