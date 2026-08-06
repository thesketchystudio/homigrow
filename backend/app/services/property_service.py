"""
app/services/property_service.py

Public property-listing reads (05_API_Design.md §properties; 10_Phase_3.md
P3-T04 detail + P3-T10 search). Only active listings are visible here —
there is no owner-preview path for pending/draft listings yet, since
nothing today needs a broker to view their own unpublished property ahead
of moderation.
"""

from typing import Literal, Optional
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.dialects.postgresql import array
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import NotFoundError
from app.models.enums import ListingType, PropertyStatus, PropertyType
from app.models.property import Property, PropertyMedia
from app.models.user import User
from app.schemas.properties import NeighborhoodSummary, PropertyListItem

SortOption = Literal["newest", "price_asc", "price_desc"]

_SORT_CLAUSES = {
    "newest": Property.published_at.desc().nullslast(),
    "price_asc": Property.price.asc(),
    "price_desc": Property.price.desc(),
}


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


def compare_properties(db: Session, ids: list[UUID]) -> list[Property]:
    """
    Returns active properties matching the given ids, reordered back into the
    caller's requested order (SQL IN doesn't preserve it). Missing or
    non-active ids are silently dropped — same visibility rule
    get_property_detail uses, just without raising for a subset that isn't
    found rather than a single lookup.
    """
    if not ids:
        return []
    rows = (
        db.query(Property)
        .options(
            joinedload(Property.media),
            joinedload(Property.broker).joinedload(User.broker_profile),
        )
        .filter(Property.id.in_(ids), Property.status == PropertyStatus.active)
        .all()
    )
    by_id = {row.id: row for row in rows}
    return [by_id[i] for i in ids if i in by_id]


def list_properties(
    db: Session,
    *,
    city: Optional[str] = None,
    locality: Optional[str] = None,
    q: Optional[str] = None,
    listing_type: Optional[ListingType] = None,
    property_type: Optional[list[PropertyType]] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    bhk_min: Optional[int] = None,
    amenities: Optional[list[str]] = None,
    sort: SortOption = "newest",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[PropertyListItem], int]:
    """
    Returns a page of active listings plus the total matching count, for
    the /properties search grid. Filters are AND-ed together; `amenities`
    matches a property that has ANY of the given amenities (Postgres
    JSONB `?|`), matching the sidebar's multi-select checkbox UX. `city`/
    `locality` are exact (case-insensitive) matches, driven by dropdowns
    and neighborhood links that already know the precise value. `q` is
    separate: a free-text substring match against EITHER city OR locality,
    for the nav search box — a typed "Whitefield" is a locality, not a
    city, so an exact `city` match alone would silently return nothing.
    """
    conditions = [Property.status == PropertyStatus.active]
    if city:
        conditions.append(func.lower(Property.city) == city.lower())
    if locality:
        conditions.append(func.lower(Property.locality) == locality.lower())
    if q:
        pattern = f"%{q.lower()}%"
        conditions.append(or_(func.lower(Property.city).like(pattern), func.lower(Property.locality).like(pattern)))
    if listing_type is not None:
        conditions.append(Property.listing_type == listing_type)
    if property_type:
        conditions.append(Property.property_type.in_(property_type))
    if price_min is not None:
        conditions.append(Property.price >= price_min)
    if price_max is not None:
        conditions.append(Property.price <= price_max)
    if bhk_min is not None:
        conditions.append(Property.bhk >= bhk_min)
    if amenities:
        conditions.append(Property.amenities.op("?|")(array(amenities)))

    total = db.query(func.count(Property.id)).filter(*conditions).scalar()

    cover_image_subq = (
        select(PropertyMedia.url)
        .where(PropertyMedia.property_id == Property.id, PropertyMedia.is_cover.is_(True))
        .correlate(Property)
        .limit(1)
        .scalar_subquery()
    )

    rows = (
        db.query(Property, cover_image_subq.label("cover_image_url"))
        .filter(*conditions)
        .order_by(_SORT_CLAUSES[sort])
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        PropertyListItem(
            id=property_.id,
            title=property_.title,
            listing_type=property_.listing_type,
            property_type=property_.property_type,
            price=property_.price,
            bhk=property_.bhk,
            bathrooms=property_.bathrooms,
            area_sqft=property_.area_sqft,
            furnishing=property_.furnishing,
            city=property_.city,
            locality=property_.locality,
            cover_image_url=cover_image_url,
            published_at=property_.published_at,
        )
        for property_, cover_image_url in rows
    ]
    return items, total


def list_neighborhoods(db: Session, *, limit: int = 4) -> list[NeighborhoodSummary]:
    """
    Returns the top `limit` localities by active listing count, each paired
    with one representative cover image — backs the search overlay's
    "Curated Neighborhoods" grid. Ranked purely by listing volume; there is
    no separate curation step or featured-neighborhood concept.
    """
    rows = (
        db.query(Property.locality, Property.city, func.count(Property.id).label("count"))
        .filter(Property.status == PropertyStatus.active)
        .group_by(Property.locality, Property.city)
        .order_by(func.count(Property.id).desc())
        .limit(limit)
        .all()
    )

    results = []
    for locality, city, count in rows:
        cover_image_url = (
            db.query(PropertyMedia.url)
            .join(Property, Property.id == PropertyMedia.property_id)
            .filter(
                Property.locality == locality,
                Property.city == city,
                Property.status == PropertyStatus.active,
                PropertyMedia.is_cover.is_(True),
            )
            .limit(1)
            .scalar()
        )
        results.append(
            NeighborhoodSummary(locality=locality, city=city, property_count=count, cover_image_url=cover_image_url)
        )
    return results
